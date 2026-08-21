const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });

const Company = require('./models/Company');
const Branch = require('./models/Branch');
const User = require('./models/User');
const Medicine = require('./models/Medicine');
const Supplier = require('./models/Supplier');
const Customer = require('./models/Customer');
const Doctor = require('./models/Doctor');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existingCompany = await Company.findOne({ name: 'CalcuttaRx' });
    if (existingCompany) {
      console.log('Seed data already exists. Deleting and re-seeding...');
      await mongoose.connection.dropDatabase();
    }

    const company = await Company.create({
      name: 'CalcuttaRx',
      legalName: 'CalcuttaRx Pharmacy — a Calcutta Node. venture',
      address: 'Champdani, Hooghly',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '712224',
      phone: '8584885450',
      email: 'calcuttanode@gmail.com',
      gstin: '19AABCC1234H1Z5',
      pan: 'AABCC1234H',
      dlNo: 'WB/HUG/DL/2025/20471',
      fssaiNo: '12824998000123',
      dlExpiryDate: new Date('2030-12-31'),
      drugLicenseCategory: 'both',
      upiId: 'calcuttarx@ybl',
      bankName: 'State Bank of India',
      declarationNote: 'Goods once sold will not be taken back or exchanged.',
      invoiceNote: 'Thank you for choosing CalcuttaRx! Get well soon.'
    });
    console.log('Company created:', company.name);

    const branch = await Branch.create({
      name: 'Champdani Flagship',
      company: company._id,
      code: 'CRX-HO',
      address: 'Champdani, Hooghly',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '712224',
      phone: '8584885450',
      gstin: '19AABCC1234H1Z5',
      dlNo: 'WB/HUG/DL/2025/20471',
      invoicePrefix: 'CRX',
      invoiceCounter: 0,
      isHeadOffice: true
    });
    console.log('Branch created:', branch.name);

    const admin = await User.create({
      name: 'Danish Shoaib',
      email: 'admin@calcuttarx.com',
      phone: '9876543210',
      password: 'password123',
      role: 'owner',
      company: company._id,
      branch: branch._id,
      permissions: { billing: true, purchase: true, inventory: true, returns: true, accounting: true, reports: true, staff: true, settings: true, compliance: true, allBranches: true }
    });
    console.log('Admin user created: admin@citypharmacy.com / password123');

    const cashier = await User.create({
      name: 'Cashier User',
      email: 'cashier@calcuttarx.com',
      phone: '9876543211',
      password: 'password123',
      role: 'cashier',
      company: company._id,
      branch: branch._id,
      permissions: { billing: true, purchase: false, inventory: false, returns: false, accounting: false, reports: false, staff: false, settings: false, compliance: false, allBranches: false }
    });
    console.log('Cashier user created: cashier@calcuttarx.com / password123');

    const medicines = await Medicine.insertMany([
      { name: 'Paracetamol 500mg', composition: 'Paracetamol IP 500mg', manufacturer: 'GSK Pharma', category: 'tablet', packSize: '10x10', hsn: '300490', gstRate: 5, schedule: 'OTC', mrp: 25.00, reorderLevel: 100, rackLocation: 'A-01', company: company._id },
      { name: 'Amoxicillin 250mg', composition: 'Amoxicillin Trihydrate IP 250mg', manufacturer: 'Cipla', category: 'capsule', packSize: '15x10', hsn: '300410', gstRate: 5, schedule: 'H', mrp: 85.00, reorderLevel: 50, rackLocation: 'B-02', company: company._id },
      { name: 'Azithromycin 500mg', composition: 'Azithromycin IP 500mg', manufacturer: 'Sun Pharma', category: 'tablet', packSize: '3x1', hsn: '300490', gstRate: 5, schedule: 'H', mrp: 120.00, reorderLevel: 30, rackLocation: 'B-03', company: company._id },
      { name: 'Cetirizine 10mg', composition: 'Cetirizine Hydrochloride IP 10mg', manufacturer: 'Dr Reddy\'s', category: 'tablet', packSize: '10x10', hsn: '300490', gstRate: 5, schedule: 'OTC', mrp: 35.00, reorderLevel: 80, rackLocation: 'A-02', company: company._id },
      { name: 'Omeprazole 20mg', composition: 'Omeprazole IP 20mg', manufacturer: 'Torrent Pharma', category: 'capsule', packSize: '15x10', hsn: '300490', gstRate: 5, schedule: 'OTC', mrp: 45.00, reorderLevel: 60, rackLocation: 'A-03', company: company._id },
      { name: 'Metformin 500mg', composition: 'Metformin Hydrochloride IP 500mg', manufacturer: 'USV Ltd', category: 'tablet', packSize: '10x10', hsn: '300490', gstRate: 5, schedule: 'H', mrp: 30.00, reorderLevel: 100, rackLocation: 'C-01', company: company._id },
      { name: 'Amlodipine 5mg', composition: 'Amlodipine Besylate IP 5mg', manufacturer: 'Pfizer', category: 'tablet', packSize: '10x10', hsn: '300490', gstRate: 5, schedule: 'H', mrp: 40.00, reorderLevel: 70, rackLocation: 'C-02', company: company._id },
      { name: 'Vitamin B Complex', composition: 'Vitamin B1, B6, B12', manufacturer: 'Abbott', category: 'tablet', packSize: '15x10', hsn: '300450', gstRate: 5, schedule: 'OTC', mrp: 65.00, reorderLevel: 40, rackLocation: 'D-01', company: company._id },
      { name: 'Cough Syrup DM', composition: 'Dextromethorphan HBr 10mg/5ml', manufacturer: 'Wockhardt', category: 'syrup', packSize: '100ml', hsn: '300490', gstRate: 5, schedule: 'H', mrp: 95.00, reorderLevel: 25, rackLocation: 'D-02', company: company._id },
      { name: 'Ciplox Eye Drops', composition: 'Ciprofloxacin HCl 0.3%', manufacturer: 'Cipla', category: 'drop', packSize: '5ml', hsn: '300420', gstRate: 5, schedule: 'H', mrp: 55.00, reorderLevel: 20, rackLocation: 'E-01', company: company._id },
      { name: 'Morphine Sulfate 10mg', composition: 'Morphine Sulfate IP 10mg', manufacturer: 'Veriton Pharma', category: 'injection', packSize: '1ml', hsn: '300490', gstRate: 5, schedule: 'X', mrp: 150.00, reorderLevel: 10, rackLocation: 'LOCKER-A', company: company._id },
      { name: 'Alprazolam 0.5mg', composition: 'Alprazolam IP 0.5mg', manufacturer: 'Intas Pharma', category: 'tablet', packSize: '10x10', hsn: '300490', gstRate: 5, schedule: 'X', mrp: 70.00, reorderLevel: 30, rackLocation: 'LOCKER-B', company: company._id },
      { name: 'Cough Syrup (OTC)', composition: 'Guaifenesin 100mg/5ml', manufacturer: 'Dabur', category: 'syrup', packSize: '100ml', hsn: '300490', gstRate: 5, schedule: 'OTC', mrp: 55.00, reorderLevel: 40, rackLocation: 'D-03', company: company._id },
      { name: 'Band Aid Roll', composition: 'Adhesive Bandage', manufacturer: 'Johnson & Johnson', category: 'other', packSize: '1 roll', hsn: '300590', gstRate: 5, schedule: 'OTC', mrp: 35.00, reorderLevel: 50, rackLocation: 'F-01', company: company._id },
      { name: 'Dettol Antiseptic', composition: 'Chloroxylenol IP 4.8%', manufacturer: 'Reckitt Benckiser', category: 'lotion', packSize: '100ml', hsn: '380894', gstRate: 5, schedule: 'OTC', mrp: 85.00, reorderLevel: 30, rackLocation: 'F-02', company: company._id }
    ]);
    console.log(`${medicines.length} medicines created`);

    const suppliers = await Supplier.insertMany([
      { name: 'MediPlus Distributors', company: 'MediPlus Pvt Ltd', gstin: '27AABCC5678H1Z5', dlNo: 'MH/PUNE/DL/2024/54321', phone: '9876543201', city: 'Pune', creditDays: 30, companyRef: company._id },
      { name: 'PharmaWholesale India', company: 'PharmaWholesale Ltd', gstin: '27AABCC9012H1Z5', dlNo: 'MH/MUM/DL/2024/98765', phone: '9876543202', city: 'Mumbai', creditDays: 45, companyRef: company._id },
      { name: 'HealthCare Supplies', company: 'HealthCare Trading Co', gstin: '27AABCC3456H1Z5', dlNo: 'MH/PUNE/DL/2024/24680', phone: '9876543203', city: 'Pune', creditDays: 15, companyRef: company._id }
    ]);
    console.log(`${suppliers.length} suppliers created`);

    const customers = await Customer.insertMany([
      { name: 'Rajesh Sharma', phone: '9999999901', type: 'retail', city: 'Pune', loyaltyPoints: 150, companyRef: company._id },
      { name: 'Priya Patel', phone: '9999999902', type: 'retail', city: 'Pune', loyaltyPoints: 75, companyRef: company._id },
      { name: 'Suresh Medicals', phone: '9999999903', gstin: '27AABCC7890H1Z5', type: 'wholesale', city: 'Pune', creditLimit: 50000, creditDays: 30, companyRef: company._id },
      { name: 'Aarav Health Store', phone: '9999999904', gstin: '27AABCC2345H1Z5', type: 'wholesale', city: 'Mumbai', creditLimit: 75000, creditDays: 45, companyRef: company._id },
      { name: 'Mrs. Meera Joshi', phone: '9999999905', type: 'retail', city: 'Pune', isChronicPatient: true, chronicConditions: ['Diabetes', 'Hypertension'], dob: new Date('1980-05-15'), loyaltyPoints: 320, companyRef: company._id }
    ]);
    console.log(`${customers.length} customers created`);

    const doctors = await Doctor.insertMany([
      { name: 'Dr. Sanjay Gupta', regNo: 'MH/12345', hospital: 'City Hospital', specialization: 'Cardiologist', phone: '8888888801', city: 'Pune', companyRef: company._id },
      { name: 'Dr. Anjali Mehta', regNo: 'MH/23456', hospital: 'Apollo Clinic', specialization: 'Physician', phone: '8888888802', city: 'Pune', companyRef: company._id },
      { name: 'Dr. Vikram Desai', regNo: 'MH/34567', hospital: 'KEM Hospital', specialization: 'Orthopedic', phone: '8888888803', city: 'Mumbai', companyRef: company._id }
    ]);
    console.log(`${doctors.length} doctors created`);

    console.log('\n✅ Seed data created successfully!');
    console.log('Login credentials:');
    console.log('  Admin:   admin@citypharmacy.com / password123');
    console.log('  Cashier: cashier@calcuttarx.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
