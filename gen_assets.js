const fs = require('fs');
const lines = fs.readFileSync('c:/Users/abk275181/Knowledge-Factory/public/sample_employees.csv', 'utf8').split(/\r?\n/).filter(l => l.trim());

const laptopModels = ['Z Book 15 Fury G8', 'EliteBook 850 G8', 'EliteBook 840 G8', 'Z Book Studio G8', 'ProBook 450 G8', 'Z Book Firefly 14 G8'];
const monitorModels = ['Z24n G2', 'E24 G4', 'Z27 G3', 'E27 G4', 'Z24f G3'];
const dockModels = ['Thunderbolt Dock WD19TBS', 'USB-C Dock WD19S', 'Thunderbolt Dock WD22TB4'];

function parseCSVLine(line) {
  const fields = []; let current = ''; let inQ = false;
  for (const ch of line) {
    if (ch === '"') inQ = !inQ;
    else if (ch === ',' && !inQ) { fields.push(current.trim()); current = ''; }
    else current += ch;
  }
  fields.push(current.trim());
  return fields;
}

let tag = 40030001;
const rows = ['Asset Tag,Name,Category,Model,Serial,Manufacturer,Assigned To,Employee ID,Location,Status,Specs'];

function rSerial(prefix, len) {
  let s = prefix;
  for (let i = 0; i < len; i++) s += '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 36)];
  return s;
}

for (let i = 1; i < lines.length; i++) {
  const fields = parseCSVLine(lines[i]);
  const name = fields[1];
  const empId = fields[0];
  const dept = fields[4] || '';
  const loc = fields[8] || 'EB India';
  if (!name) continue;

  const isDev = dept.toLowerCase().includes('engineer') || dept.toLowerCase().includes('devops') || dept.toLowerCase().includes('data');
  const laptopCat = isDev ? 'Laptops (Developer)' : 'Laptops (Business)';
  const laptop = isDev ? laptopModels[i % 3] : laptopModels[3 + (i % 3)];
  const monitor = monitorModels[i % 5];
  const specs = isDev ? 'i7-11800H 32GB RAM 512GB SSD' : 'i5-1135G7 16GB RAM 256GB SSD';
  const mSpecs = (monitor.includes('Z27') || monitor.includes('E27')) ? '27 inch 4K IPS' : '24 inch FHD IPS';

  // Laptop for every employee
  rows.push([tag, 'INL' + String(tag).slice(-5), laptopCat, laptop, rSerial('CND', 8), 'HP', name, empId, loc, 'assigned', specs].join(','));
  tag++;
  // Monitor for every employee
  rows.push([tag, '', 'Monitors', monitor, rSerial('6CM', 8), 'HP', name, empId, loc, 'assigned', mSpecs].join(','));
  tag++;
  // Docking station for every 3rd employee
  if (i % 3 === 0) {
    const dock = dockModels[i % 3];
    const mfr = dock.includes('WD') ? 'Dell' : 'Lenovo';
    rows.push([tag, '', 'Docking Stations', dock, rSerial('', 7), mfr, name, empId, loc, 'assigned', 'USB-C / Thunderbolt'].join(','));
    tag++;
  }
}

// Add 10 unassigned/spare/maintenance devices
for (let i = 0; i < 5; i++) {
  rows.push([tag, '', 'Laptops (Developer)', laptopModels[i % 3], rSerial('CND', 8), 'HP', '', '', '', 'available', 'i7-11800H 32GB RAM 512GB SSD'].join(','));
  tag++;
}
for (let i = 0; i < 3; i++) {
  rows.push([tag, '', 'Monitors', monitorModels[i % 5], rSerial('6CM', 8), 'HP', '', '', '', 'available', '24 inch FHD IPS'].join(','));
  tag++;
}
rows.push([tag, '', 'Docking Stations', 'Thunderbolt Dock WD19TBS', rSerial('', 7), 'Dell', '', '', '', 'maintenance', 'USB-C / Thunderbolt'].join(','));
tag++;
rows.push([tag, '', 'Laptops (Business)', 'EliteBook 840 G8', rSerial('CND', 8), 'HP', '', '', '', 'retired', 'i5-1135G7 16GB RAM 256GB SSD'].join(','));

// Override first 2 entries with Abhijith's real Snipe-IT data
rows[1] = '40030382,,Monitors,Z24n G2,6CM94712XC,HP,Abhijith K,EB-3297,Bangalore - 3rd Floor,assigned,24 inch IPS Display';
rows[2] = '40031198,INL00875,Laptops (Developer),Z Book 15 Fury G8,CND30234TV,HP,Abhijith K,EB-3297,Bangalore - 3rd Floor,assigned,i7-11800H 32GB RAM 512GB SSD';
// Add Abhijith's other 2 real devices right after
rows.splice(3, 0,
  '40030480,,Docking Stations,Thunderbolt Dock WD19TBS,651J883,Dell,Abhijith K,EB-3297,Bangalore - 3rd Floor,assigned,Thunderbolt 3 USB-C',
  '40031428,INL01053,Laptops (Developer),Z Book 15 Fury G8,CND3121X07,HP,Abhijith K,EB-3297,Bangalore - 3rd Floor,assigned,i7-11800H 32GB RAM 512GB SSD'
);

console.log('Total rows (inc header):', rows.length);
console.log('Devices:', rows.length - 1);
fs.writeFileSync('c:/Users/abk275181/Knowledge-Factory/public/sample_assets.csv', rows.join('\n'), 'utf8');
console.log('Written to sample_assets.csv');
