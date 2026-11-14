// Use: node scripts/testBinParse.js   (DB / internet nahi chahiye)
import { buildBinQuery, parseNearestBin } from '../utils/binQuery.js';

const lat = 22.5933;
const lng = 76.9132;
const near = { type: 'node', lat: lat + 0.002, lon: lng, tags: { amenity: 'waste_basket' } }; // ~222 m
const mid = { type: 'way', center: { lat, lon: lng + 0.004 }, tags: { amenity: 'recycling', name: 'Bazaar recycling' } }; // ~410 m
const far = { type: 'node', lat: lat + 0.02, lon: lng, tags: { amenity: 'waste_basket' } }; // ~2.2 km

const q = buildBinQuery(lat, lng);
const cases = [
  ['query me around aur amenity', q.includes('around:1000') && q.includes('waste_basket'), true],
  ['koi bin nahi -> null', parseNearestBin({ elements: [] }, lat, lng), null],
  ['json khaali -> null', parseNearestBin(undefined, lat, lng), null],
  ['radius ke bahar wala ignore', parseNearestBin({ elements: [far] }, lat, lng), null],
  ['sabse paas wala (node)', parseNearestBin({ elements: [mid, near, far] }, lat, lng)?.distanceM, 222],
  ['way ka center + naam', parseNearestBin({ elements: [mid] }, lat, lng)?.name, 'Bazaar recycling'],
  ['bina naam -> null name', parseNearestBin({ elements: [near] }, lat, lng)?.name, null],
];

let bad = 0;
for (const [name, got, want] of cases) {
  const ok = typeof want === 'number' ? Math.abs(got - want) <= 3 : got === want;
  if (!ok) bad++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ->  ${JSON.stringify(got)}`);
}
console.log(bad ? `\n${bad} case fail` : '\nSab cases pass');
process.exit(bad ? 1 : 0);