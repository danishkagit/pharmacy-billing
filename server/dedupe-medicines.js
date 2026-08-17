/**
 * Deduplicate medicines: merges records with the SAME name + composition under the SAME company.
 *
 * Strategy (per the approved rules):
 *   - A "duplicate" is a medicine sharing (company, normalized name, normalized composition).
 *   - KEEP the record that has the most stock/batches (sum qty desc, batch count desc, createdAt asc).
 *   - DELETE the other duplicate records after reassigning their references (batches, sale/purchase
 *     invoice lines, stock adjustments, transfers, returns, prescriptions) to the kept record,
 *     so no history is lost.
 *
 * Safety:
 *   - Dry-run by default. Pass `--apply` to actually modify data.
 *   - Prints a full report of every group detected and what would be kept vs removed.
 *
 * Usage:
 *   node server/dedupe-medicines.js        # dry run (recommended first)
 *   node server/dedupe-medicines.js --apply   # commit changes
 */
require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');

const Medicine = require('./models/Medicine');
const Batch = require('./models/Batch');

const APPLY = process.argv.includes('--apply');

function log(msg) { console.log(msg); }
function norm(s) {
  return (s || '').toString().toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Return the list of schema paths on a model that reference Medicine. */
function medicineRefPaths(model) {
  if (!model || !model.schema || !model.schema.paths) return [];
  const out = [];
  for (const [p, sch] of Object.entries(model.schema.paths)) {
    const t = sch && sch.instance;
    if (t === 'ObjectID' && sch.options && sch.options.ref === 'Medicine') out.push(p);
  }
  // element paths under arrays (e.g. "medicines.$.medicine")
  for (const [p, sch] of Object.entries(model.schema.paths)) {
    if (sch && sch.instance === 'Array') {
      const caster = sch.caster;
      if (caster && caster.type && caster.options && caster.options.ref === 'Medicine') out.push(p);
    }
  }
  return out;
}

// Find every registered model that points at Medicine (by schema.ref above).
function refMapping() {
  const mapping = [];
  for (const name of Object.keys(mongoose.models)) {
    const M = mongoose.models[name];
    const paths = medicineRefPaths(M);
    if (!paths.length) continue;
    mapping.push({ name, paths });
  }
  return mapping;
}

/** Reassign all foreign-key references (except Batch, which is handled for merge semantics) to the kept id. */
async function reassignRefs(fromId, toId, mapping) {
  for (const { name, paths } of mapping) {
    const M = mongoose.models[name];
    if (name === 'Batch') continue; // handled separately to respect unique (batchNo, medicine) index
    for (const p of paths) {
      const res = await M.updateMany({ [p]: fromId }, { $set: { [p]: toId } });
      if (res && res.modifiedCount > 0) {
        logDetail(`    • reference ${name}.${p}: ${res.modifiedCount} -> kept id`);
      }
    }
  }
}

/** Move every batch of `dupId` onto `keptId`; where a batchNo already exists on kept, merge the qty then delete. */
async function moveBatches(dupId, keptId) {
  const dupeBatches = await Batch.find({ medicine: dupId });
  for (const b of dupeBatches) {
    const clash = await Batch.findOne({ medicine: keptId, batchNo: b.batchNo });
    if (clash) {
      if (APPLY) {
        clash.qty = (clash.qty || 0) + (b.qty || 0);
        await clash.save();
        await Batch.deleteOne({ _id: b._id });
      }
      logDetail(`  • batch ${b.batchNo}: merged qty +${b.qty || 0} into kept batch`);
    } else {
      if (APPLY) await Batch.updateOne({ _id: b._id }, { $set: { medicine: keptId } });
      logDetail(`  • batch ${b.batchNo}: repointed to kept`);
    }
  }
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  log('Connected to MongoDB.');

  const mapping = refMapping();

  const medicines = await Medicine.find({}).select('_id name composition manufacturer company createdAt').lean();
  const ids = medicines.map(m => m._id);

  // aggregate stock per medicine
  const stockAgg = await Batch.aggregate([
    { $match: { medicine: { $in: ids } } },
    { $group: { _id: '$medicine', qty: { $sum: '$qty' }, batches: { $sum: 1 } } },
  ]);
  const stock = new Map(stockAgg.map(s => [String(s._id), s]));

  // group by (company, name, composition)
  const groups = new Map();
  for (const m of medicines) {
    const key = `${String(m.company)}|${norm(m.name)}|${norm(m.composition)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(m);
  }

  const duplicateGroups = [...groups.values()].filter(g => g.length > 1);
  log(`\nDetected ${duplicateGroups.length} duplicate group(s).\n`);

  let removed = 0, kept = 0;
  for (const group of duplicateGroups) {
    // Sort: most stock qty, then batch count, then earliest created = the winner to keep.
    group.sort((a, b) => {
      const sa = stock.get(a._id); const sb = stock.get(b._id);
      const aq = sa ? sa.qty : 0, bq = sb ? sb.qty : 0;
      const ab = sa ? sa.batches : 0, bb = sb ? sb.batches : 0;
      if (aq !== bq) return bq - aq;
      if (ab !== bb) return bb - ab;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
    const keep = group[0];
    const dups = group.slice(1);

    log(`== Group (${norm(keep.composition) || 'no comp'}) ~ ${keep.name}`);
    for (const m of group) {
      const s = stock.get(m._id);
      log(`   ${m._id === keep._id ? 'KEEP ' : '  -> '} ${m.name} | ${m.composition || '-'} | comp:${m.manufacturer || '-'} | stock:${s ? s.qty : 0} (${s ? s.batches : 0})`);
    }

    if (APPLY) {
      for (const dup of dups) {
        await reassignRefs(dup._id, keep._id, mapping);
        await moveBatches(dup._id, keep._id);
        await Medicine.deleteOne({ _id: dup._id });
        removed++;
      }
      kept++;
    } else {
      removed += dups.length;
      kept++;
    }
  }

  log(`\n${APPLY ? '' : '[DRY RUN] '}Summary: ${kept} kept, ${removed} duplicate(s) example would be removed.`);
  log(APPLY ? 'Changes committed.' : 'Re-run with `--apply` to commit.');

  await mongoose.disconnect();
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });