const axios = require('axios');
const cheerio = require('cheerio');

async function main() {
  const { data: html } = await axios.get('https://pharmeasy.in/search/all?name=a', {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    timeout: 10000
  });
  const $ = cheerio.load(html);
  const results = [];
  $('a[class*="medicineUnitWrapper"]').each((i, el) => {
    const name = $(el).find('h1[class*="medicineName"]').first().text().trim();
    if (name) results.push(name);
  });
  console.log(results.length, 'results for "a"');
  results.slice(0, 5).forEach(x => console.log(' -', x));
}
main();
