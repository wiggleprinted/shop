/**
 * _generate-index.js
 * 
 * Regenerates data/products/index.json by scanning all JSON files
 * in the data/products/ folder (excluding index.json itself).
 * 
 * Usage: node _generate-index.js
 */

const fs   = require('fs');
const path = require('path');

const productsDir = path.join(__dirname, 'data', 'products');
const indexFile   = path.join(productsDir, 'index.json');

const slugs = fs.readdirSync(productsDir)
  .filter(f => f.endsWith('.json') && f !== 'index.json')
  .map(f => path.basename(f, '.json'))
  .sort();

const output = JSON.stringify({ products: slugs }, null, 2);
fs.writeFileSync(indexFile, output, 'utf8');

console.log(`✅ index.json updated with ${slugs.length} products:`);
slugs.forEach(s => console.log(`   • ${s}`));
