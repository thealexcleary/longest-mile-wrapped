// Generates a fake Longest Mile results spreadsheet (results.csv) for the
// Wrapped demo. 100 athletes, backyard-ultra-style elimination by round.
// One number does the real work: miles (rounds completed). Everything else on
// the site is derived from it. Run: node generate-results.js

const fs = require('fs');
const path = require('path');

// --- tiny seeded RNG so the demo data is stable across runs (screenshots match)
let seed = 20260808;
function rand() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}

const FIRST = [
  'Jack','Ethan','Liam','Noah','Oliver','Cooper','Lucas','Mason','Hunter','Riley',
  'Hamish','Angus','Declan','Marcus','Tyler','Blake','Cody','Reece','Kai','Nathan',
  'Charlotte','Ruby','Ava','Mia','Chloe','Zoe','Grace','Isla','Ella','Sienna',
  'Georgia','Holly','Maddie','Tahlia','Bree','Steph','Kate','Emma','Lauren','Jess',
  'Sam','Jordan','Alex','Casey','Dylan','Bailey','Harley','Ash','Robbie','Toni'
];
const LAST_INIT = 'ABCDEFGHKLMNPRSTW'.split('');

// gender is needed for the last-man / last-woman standing story + cohorts.
// First 20 names male, next 20 female, last 10 unisex (assigned randomly).
function genderFor(nameIdx) {
  if (nameIdx < 20) return 'M';
  if (nameIdx < 40) return 'F';
  return rand() < 0.5 ? 'M' : 'F';
}

function ageFor() {
  // weighted toward 25-45
  const r = rand();
  if (r < 0.12) return 16 + Math.floor(rand() * 4);      // 16-19
  if (r < 0.40) return 20 + Math.floor(rand() * 10);     // 20s
  if (r < 0.72) return 30 + Math.floor(rand() * 10);     // 30s
  if (r < 0.90) return 40 + Math.floor(rand() * 10);     // 40s
  if (r < 0.98) return 50 + Math.floor(rand() * 10);     // 50s
  return 60 + Math.floor(rand() * 6);                    // 60+
}

// Miles = rounds completed. Exponential-ish decay: lots of low, few deep.
// Scaled so the deepest of the field reach the 40s and the crowned winner ~50,
// matching the real event's expected winning distance.
function milesDraw() {
  const u = Math.max(rand(), 0.0001);
  let m = Math.ceil(-Math.log(u) * 6.4);
  if (m < 1) m = 1;
  if (m > 44) m = 44;
  return m;
}

const athletes = [];
const usedNames = new Set();
for (let i = 0; i < 100; i++) {
  let nameIdx = i % FIRST.length;
  let name;
  do {
    const li = LAST_INIT[Math.floor(rand() * LAST_INIT.length)];
    name = `${FIRST[nameIdx]} ${li}`;
  } while (usedNames.has(name));
  usedNames.add(name);
  athletes.push({
    bib: i + 1,
    name,
    gender: genderFor(nameIdx),
    age: ageFor(),
    miles: milesDraw(),
  });
}

// Force a clean, unique winner per gender by nudging the top few apart.
function crownTop(gender) {
  const pool = athletes.filter(a => a.gender === gender).sort((a, b) => b.miles - a.miles);
  // last one standing completes ~50 miles; runner-up sits just behind
  pool[0].miles = gender === 'M' ? 50 : 49;
  pool[0].is_winner = 1;
  if (pool[1]) pool[1].miles = Math.max(pool[1].miles, pool[0].miles - (gender === 'M' ? 4 : 3));
}
crownTop('M');
crownTop('F');

// finish_position: rank by miles desc, ties broken by bib for determinism.
athletes.sort((a, b) => b.miles - a.miles || a.bib - b.bib);
athletes.forEach((a, idx) => { a.finish_position = idx + 1; });
athletes.forEach(a => { if (!a.is_winner) a.is_winner = 0; });

// back to bib order for a tidy spreadsheet
athletes.sort((a, b) => a.bib - b.bib);

const header = 'bib,name,gender,age,miles,finish_position,is_winner';
const rows = athletes.map(a =>
  [a.bib, a.name, a.gender, a.age, a.miles, a.finish_position, a.is_winner].join(',')
);
const csv = [header, ...rows].join('\n') + '\n';

const out = path.join(__dirname, 'data', 'results.csv');
fs.writeFileSync(out, csv);

// Also emit results.js so the page works by double-click (file://) with no
// server — a <script> tag can load this where a fetch() of the CSV is blocked.
const js = 'window.LM_RESULTS_CSV = ' + JSON.stringify(csv) + ';\n';
fs.writeFileSync(path.join(__dirname, 'data', 'results.js'), js);

console.log(`Wrote ${athletes.length} athletes to ${out} (+ results.js)`);
console.log('Champions:', athletes.filter(a => a.is_winner).map(a => `${a.name} (${a.gender}, ${a.miles}mi, P${a.finish_position})`).join('  '));
