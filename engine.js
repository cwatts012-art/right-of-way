/* Right of Way — rules engine (generated from src/ by build.sh) */
(function (root) {
'use strict';
// ===== Right of Way — static game data (rulebook v0.5) =====
const COLS = "ABCDEFGHIJKL";
const N = 12;
const PLAYER_COLORS = [
  { id: 'blue', name: 'Blue', hex: '#1f63b5', tint: '#dbe8f8', shape: 'circle' },
  { id: 'red', name: 'Red', hex: '#c0392b', tint: '#f8dcd8', shape: 'square' },
  { id: 'green', name: 'Green', hex: '#1e8a4c', tint: '#d6f0e0', shape: 'triangle' },
  { id: 'yellow', name: 'Yellow', hex: '#c99a06', tint: '#fbf0c8', shape: 'diamond' },
];
const DISTRICTS = ["Northgate", "Uptown", "Riverheights", "Westside", "Downtown", "Eastbank", "Southfield", "Old Town", "Rail Yards"];
const RIVER_DISTRICTS = [1, 2, 4, 5, 7, 8];
const DOWNTOWN = 4;
const BOARDS = {
  BP: 'Bike & Pedestrian', TR: 'Transit Riders', MO: 'Motorists', HO: 'Homeowners', BA: 'Business Association', WE: 'Waterfront & Environment'
};
const BOARD_TOKENS = { BP: 4, TR: 4, MO: 4, HO: 4, BA: 4, WE: 5 };
const CONFLICTS = [['BP', 'MO'], ['HO', 'TR'], ['WE', 'BA'], ['WE', 'MO']];
const INTRO_COUNCILS = [['HO', 'MO'], ['HO', 'WE'], ['WE', 'BP'], ['BP', 'TR'], ['BA', 'TR'], ['WE', 'BA'], ['MO', 'BA'], ['HO', 'BP'], ['MO', 'WE']];

// Zone types. rung = housing ladder index.
const ZT = {
  SFD: { name: 'Single-Family Detached', abbr: 'SFD', era: 1, tier: 1, cost: 2, lots: 1, pop: 2, workers: 1, tax: 2, res: true, rung: 0 },
  DUP: { name: 'Duplex', abbr: 'DUP', era: 1, tier: 1, cost: 3, lots: 1, pop: 2, workers: 1, tax: 1, res: true, rung: 1 },
  CC: { name: 'Cottage Court', abbr: 'CC', era: 1, tier: 2, cost: 4, lots: 1, pop: 3, workers: 1, tax: 1, res: true, rung: 2 },
  TH: { name: 'Townhomes', abbr: 'TH', era: 1, tier: 2, cost: 5, lots: 1, pop: 4, workers: 2, tax: 1, res: true, rung: 3 },
  MP: { name: 'Multiplex', abbr: 'MP', era: 1, tier: 2, cost: 6, lots: 1, pop: 5, workers: 2, tax: 2, res: true, rung: 4 },
  MR: { name: 'Mid-Rise', abbr: 'MR', era: 1, tier: 3, cost: 10, lots: 1, pop: 9, workers: 3, tax: 3, res: true, rung: 5 },
  HR: { name: 'High-Rise', abbr: 'HR', era: 2, tier: 4, cost: 16, lots: 1, pop: 14, workers: 4, tax: 4, res: true, rung: 6 },
  MU: { name: 'Mixed-Use', abbr: 'MU', era: 2, tier: 3, cost: 9, lots: 1, pop: 4, workers: 1, tax: 1, res: true, slots: 2, rate: 1, selfFillCap: 1 },
  NC: { name: 'Neighborhood Commercial', abbr: 'NC', era: 1, tier: 2, cost: 4, lots: 1, slots: 2, rate: 1 },
  OF: { name: 'Office', abbr: 'OFF', era: 2, tier: 4, cost: 14, lots: 1, slots: 5, rate: 3 },
  LI: { name: 'Light Industrial', abbr: 'LI', era: 1, tier: 2, cost: 5, lots: 1, slots: 3, rate: 2, ind: true },
  HI: { name: 'Heavy Industrial', abbr: 'HI', era: 1, tier: 3, cost: 8, lots: 1, slots: 4, rate: 2, ind: true },
  PK: { name: 'Park / Civic', abbr: 'PARK', era: 1, tier: 0, cost: 3, lots: 1, park: true },
  HQ: { name: 'Corporate HQ', abbr: 'HQ', era: 2, tier: 4, cost: 0, lots: 2, slots: 3, rate: 0, special: true },
  ST: { name: 'Stadium', abbr: 'STAD', era: 3, tier: 0, cost: 0, lots: 1, park: true, slots: 4, rate: 1, special: true },
};
const LADDER = ['SFD', 'DUP', 'CC', 'TH', 'MP', 'MR', 'HR'];
const ZONABLE = ['SFD', 'DUP', 'CC', 'TH', 'MP', 'MR', 'HR', 'MU', 'NC', 'OF', 'LI', 'HI', 'PK'];

const MODES = {
  bike: { name: 'Bike lane', era: 1 }, road: { name: 'Road', era: 1 }, bus: { name: 'Bus route', era: 1 },
  shuttle: { name: 'Ferry', era: 1 },
  lr: { name: 'Light rail', era: 2 }, hwy: { name: 'Freight road', era: 1 },
};
const FARE = { bus: 1, shuttle: 1, river: 1, lr: 2 }; // v0.7: light rail fare $2

const PERMITS = [
  ['VAR', 'Variance', 2, 'Upzone one rung ignoring transit requirement and Blocked standing (not to High-Rise/Office). Use with an Upzone action.'],
  ['FTG', 'Federal Transit Grant', 2, '−$6 off one light rail or ferry build action.'],
  ['XSH', 'Extra Shift', 2, 'Take one extra action this round.'],
  ['CMT', 'Community Meeting', 2, '+2 standing in one district (max +3).'],
  ['TAX', 'Tax Abatement', 1, 'Gain $5 immediately.'],
  ['CLT', 'Community Land Trust', 1, 'Next Cottage Court or Multiplex you zone costs $0 (+Downtown premium).'],
  ['BKS', 'Bike Share', 1, 'Build up to 4 bike lane edges free (free action).'],
  ['RID', 'Ridership Campaign', 1, 'This Income phase each rider token on your lines pays +$1.'],
];
const PERMIT_INFO = {}; PERMITS.forEach(p => PERMIT_INFO[p[0]] = { code: p[0], name: p[1], qty: p[2], text: p[3] });

const CONTRACTORS = {
  C1: { name: 'Blacktop & Sons Paving', mode: 'roads', star: true, ability: 'Road actions build up to 6 edges. Every Build Transit action may also build 1 road edge ($1).', drawback: 'Road upkeep is $1 per full 3 road edges.' },
  C2: { name: 'Spoke & Chain Trailbuilders', mode: 'bike', ability: 'Bike actions build up to 10 edges. Bike bridge edges: no build time, no surcharge.', drawback: 'Freight upgrades: at most 2 edges per action.' },
  C3: { name: 'Metro Coach Fleet Services', mode: 'bus', ability: 'Bus actions may add up to 4 stops/edges at once. Reroutes are free (4 edges, 2 stops).', drawback: 'Bus routes at most 6 edges.' },
  C4: { name: 'Ironline Rail Constructors', mode: 'light rail', ability: 'Light rail actions build up to 6 edges and 3 stations, with no build time.', drawback: 'Opening a bus route costs +$1.' },
  C5: { name: 'Tower Crane Company', mode: 'high-rise', star: true, ability: 'Mid-Rise, High-Rise and Office cost −$2 (zoning or upzoning into them).', drawback: 'Start with $2 less.' },
  C6: { name: 'Cargo Line Logistics', mode: 'freight', ability: 'Freight upgrades cost $1 per edge, up to 6 edges per action.', drawback: 'Bike actions build at most 3 edges.' },
  C7: { name: 'Bluewater Marine Works', mode: 'ferry', ability: 'Each ferry action may do two of: open route, add dock, add boat. Extra boats cost $2.', drawback: 'Road and light rail bridge surcharges +$2.' },
  C8: { name: 'Halvorsen Bridge Builders', mode: 'bridges', ability: 'Bridge edges need no build time; Bridge Site surcharges halved.', drawback: 'May never open ferry routes.' },
  C9: { name: 'Rapid Assembly Builders', mode: 'parallel crews', star: true, ability: 'Each Cleanup, remove 1 extra Construction marker from up to two of your projects.', drawback: 'Bonds cost $2 interest; start with $2 less.' },
  C10: { name: 'Twin Crews General Contracting', mode: 'multi-mode', star: true, ability: 'Once per round, a Build Transit action may be followed by a second build of a different mode (same action).', drawback: 'Your Upzones cost +$1.' },
};
const ENGINEERS = {
  E1: { name: 'Freight Buffer Design', mode: 'freight', ability: 'Your freight edges cause no noise penalty, never cancel waterfront bonuses, and don\'t anger Homeowners.', drawback: 'Freight upgrades +$1 per edge.' },
  E2: { name: 'Flowline Traffic Engineering', mode: 'roads', ability: 'Where you own 3+ road edges, the district congestion limit is 9. Car legs reach 8 edges.', drawback: 'Each road action +$1.' },
  E3: { name: 'Protected Lanes Design Group', mode: 'bike', ability: 'Bike lanes never anger Motorists/Business; Bike & Ped +1 is uncancellable; bike legs 5 edges; your bike-served zones are transit-served for Mid-Rise.', drawback: 'Bike lanes cost $1 per edge.' },
  E4: { name: 'Rapid Bus Design', mode: 'BRT', star: true, ability: 'Your bus stops count as light rail stations for zoning (density, TOD, Mixed-Use bonus, High-Rise from Era II).', drawback: 'Bus stops cost +$1.' },
  E5: { name: 'Station Area Planning Studio', mode: 'TOD', star: true, ability: 'Your light rail stations have a radius-2 walkshed for zoning (density, TOD, High-Rise/Office, HQ).', drawback: 'Stations cost +$2 each.' },
  E6: { name: 'Harbor Terminal Design', mode: 'ferry', ability: 'Boats carry 6; ignore Fog and River Ice; docks make waterfront Prime within radius 2.', drawback: 'Docks cost +$2 each.' },
  E7: { name: 'Complete Streets Collaborative', mode: 'roads⇄bike', star: true, ability: 'Your road edges also count as bike lanes for service, Livable and bike legs. No "3+ road edges" anger.', drawback: 'Road edges cost $2 each.' },
  E8: { name: 'Grade Separation Engineering', mode: 'light rail', ability: 'Light rail may cross on any crossing edge, may share freight edges, never angers Motorists.', drawback: 'Light rail edges cost $3 each.' },
  E9: { name: 'Transit Hub Planning', mode: 'hubs', ability: 'Your light rail stations that share an intersection with another line\'s stop or dock (any owner) are Hubs: job zones within radius 1 earn +$1 per filled slot, and you collect $2 per Hub each Income.', drawback: 'Your stations cost +$1 each.' },
  E10: { name: 'Living Shoreline Engineering', mode: 'shoreline', ability: 'Your bridges, docks and waterfront zones ignore Flood/Inspection; bridges and docks please Waterfront boards; your waterfront Parks make homes within 2 lots Prime.', drawback: 'Bridge surcharges +$2; waterfront zones +$1.' },
};

const MAYORS = {
  M1: { name: 'Dolores Reyes', platform: 'Neighborhoods First', policy: 'SFD and Duplex cost −$1. Upzones into Mid-Rise or higher cost +$1.', mandate: 'Own SFD + Duplex ≥ E+1', allies: ['HO', 'MO'] },
  M2: { name: 'Theo Vance', platform: 'Move the City', policy: 'Bus stops, docks and stations cost −$1.', mandate: 'Own operational stops + stations + docks ≥ 2E', allies: ['TR', 'BA'] },
  M3: { name: 'Priya Nandakumar', platform: 'Vision Zero', policy: 'Bike lanes cost $1 per 3 edges. Road actions of 3+ edges cost +$1.', mandate: 'Own bike edges ≥ 4E', allies: ['BP', 'WE'] },
  M4: { name: 'Hank Dobbs', platform: 'Keep It Moving', policy: 'Freight upgrades −$1 per edge (minimum $1). Bike lanes on existing road edges +$1 per action.', mandate: 'Road edges + 2× freight edges ≥ 5E', allies: ['MO', 'BA'] },
  M5: { name: 'Celeste Ward', platform: 'The River Belongs to Everyone', policy: 'Parks on waterfront lots cost $1. Industry on waterfront lots +$3.', mandate: 'Waterfront residential + docks + waterfront Parks ≥ E+1', allies: ['WE', 'TR'] },
  M6: { name: 'Marcus Bell', platform: 'Skyline Downtown', policy: 'Downtown lot premium waived. Office −$2.', mandate: 'Own zones in Downtown ≥ E', allies: ['BA', 'TR'] },
  M7: { name: 'Ruth Okonkwo', platform: 'Clean Air, Green City', policy: 'Heavy Industrial +$2. Parks −$1.', mandate: 'Own Parks ≥ E and no Heavy Industrial', allies: ['WE', 'BP'] },
  M8: { name: 'Gus Pappas', platform: 'Jobs, Jobs, Jobs', policy: 'Light and Heavy Industrial −$1. Tolls and port fees doubled.', mandate: 'Filled job slots in your zones ≥ 5E', allies: ['BA', 'MO'] },
  M9: { name: 'Lena Sorensen', platform: 'Missing Middle', policy: 'Cottage Court, Townhomes, Multiplex −$1. SFD +$1.', mandate: 'Own Cottage + Townhomes + Multiplex ≥ E+1', allies: ['BP', 'HO'] },
  M10: { name: 'Victor Kalu', platform: 'Rail Renaissance', era2: true, policy: 'Light rail edges −$1.', mandate: 'Own operational light rail stations ≥ 2E−2', allies: ['TR', 'BA'] },
  M11: { name: 'Bea Lindqvist', platform: 'Balanced Books', policy: 'Bond interest $2. Consult pays +$1 more.', mandate: 'No Bonds and cash ≥ 15E', allies: ['BA', 'HO'] },
  M12: { name: 'Ada Montoya', platform: 'Homes for All', policy: 'Upzone permit fee waived. Opposition campaigns +$2.', mandate: 'Population ≥ 15/30/50 (Era I/II/III)', allies: ['TR', 'BP'] },
};

const CORPS = {
  MER: { name: 'Meridian Biotech', req: 'An operational light rail station within radius 1.', pref: 'A Park or bike edge touches the site.' },
  LUM: { name: 'Lumen Logistics', req: 'A market-connected freight edge within radius 2, or Port access (waterfront site within radius 1 of a dock).', pref: 'A bus stop, station or dock within radius 1.', special: 'Traffic counts 4 (2 with nearby rail/dock).' },
  ARC: { name: 'Arcadia Software', req: 'In Downtown, or a light rail station within radius 1.', pref: 'You own a Mixed-Use or Mid-Rise orthogonally adjacent to the site.', special: 'Induced demand reaches radius 3 for Townhomes and higher.' },
};

// Events: [id, era, name, docket district index, text]
const EVENTS = [
  [1, 1, 'Pothole Season', 0, 'Pay an extra $1 per full 4 road edges you own.'],
  [2, 1, 'Missing Middle Initiative', 3, 'Cottage Court, Townhomes and Multiplex cost −$2 to build or upzone into.'],
  [3, 1, 'Gas Price Spike', 6, 'Road-only residential zones −1 Pop. Line owners collect +$1 from the bank per rider token.'],
  [4, 1, 'Bike Boom', 7, 'Livable zones +1 more Pop. Each player gains $1 per full 4 bike edges.'],
  [5, 1, 'State Freight Funds', 8, 'Player(s) with the fewest freight edges may upgrade up to 2 of their road edges to freight free (still a Build Transit action).'],
  [6, 1, 'Snowstorm', 1, 'Bike lanes give no Livable bonus this round.'],
  [7, 1, 'Fog Bank', 2, "Ferries don't run; riders excused; no ferry fares. Prime Waterfront from docks counts as ordinary."],
  [8, 1, 'Riverfront Cleanup', 5, 'Parks on waterfront lots cost $0. Every player with waterfront industry loses 1 standing in that district.'],
  [9, 1, 'Viral Bike Video', 4, 'In every district with a Bike & Ped board, each player with 3+ bike edges there gains +1 standing.'],
  [10, 2, 'Housing Crisis', 3, 'Residential Tax +$1 per zone. Upzone permit fee waived.'],
  [11, 2, 'Federal Infrastructure Bill', 4, 'Light rail edges cost −$1 each.'],
  [12, 2, 'Tech Campus', 5, 'The first Office built this round costs −$4, and its builder gains $3.'],
  [13, 2, 'NIMBY Revolt', 0, 'In districts with a Homeowners board, Upzones cost +$2 unless in a light rail walkshed.'],
  [14, 2, 'Transit Strike', 4, 'No fares are paid this round.'],
  [15, 2, 'Plant Relocation', 6, 'The Heavy Industrial zone with the most cubes loses all of them.'],
  [16, 2, 'River Flood', 7, "Bridges and ferries can't be used for new commutes; riders excused; waterfront bonuses lost this round."],
  [17, 2, 'Summer Waterfront Festival', 1, 'Waterfront residential +1 Pop. Ferry fares doubled.'],
  [18, 2, 'Bridge Inspection', 2, 'The busiest Bridge Site is closed (riders excused). Each ferry route collects +$1 per rider token.'],
  [19, 2, 'Election Year', 7, 'Outreach costs $1 less. Standing in the Docket district moves 1 toward 0 before the Hearing.'],
  [20, 3, 'Recession', 6, 'Every job zone earns −$1 (minimum $0).'],
  [21, 3, 'Population Boom', 3, 'Each fully employed residential zone gets +1 Pop.'],
  [22, 3, 'Heat Wave', 4, 'Mid-Rise and High-Rise not adjacent to a Park get −1 Pop (waterfront exempt).'],
  [23, 3, 'Ridership Surge', 5, 'Each line with 3+ rider tokens pays its owner $3.'],
  [24, 3, 'Historic Preservation', 7, 'Population leader makes one SFD/Duplex a Landmark (+1 Pop, never upzoned) and gains +1 in Homeowners districts.'],
  [25, 3, 'Congestion Pricing', 0, 'Road-only zones count double for congestion. Each player collects $1 per bus stop.'],
  [26, 3, 'Stadium Deal', 8, 'Blind bid; winner pays and places a free Stadium (Park + 4 job slots at $1).'],
  [27, 3, 'River Ice', 2, 'Ferries carry only 2 per boat.'],
  [28, 3, 'Harbor Dredging', 8, 'Port-access industry +$1/slot. In each Waterfront district, the player with the most port industry loses 1 standing.'],
];

// Board reactions: tag -> {board: +1/-1}
const REACT = {
  bike: { BP: 1 }, bike_on_road: { BP: 1, MO: -1, BA: -1 }, road12: { MO: 1 }, road3: { BP: -1, MO: 1 },
  bus: { TR: 1 }, ferry: { TR: 1, WE: 1 }, lr_on_road: { MO: -1 }, station: { TR: 1, BA: 1 },
  hwy_edge: { BP: -1, MO: 1, HO: -1, WE: -1, BA: 1 }, hwy_edge_quiet: { BP: -1, MO: 1, WE: -1, BA: 1 },
  interchange: { BP: -1, TR: -1, MO: 1, HO: -1, WE: -1 },
  z_SFD: { MO: 1, HO: 1 }, z_DUP: { BP: 1, HO: 1 }, z_CC: { BP: 1, HO: 1 }, z_TH: { BP: 1 }, z_MP: { BP: 1 },
  z_MR: { TR: 1, HO: -1 }, z_HR: { TR: 1, HO: -1 }, z_MU: { BP: 1, TR: 1, BA: 1 }, z_NC: { BP: 1, BA: 1 },
  z_OF: { HO: -1, BA: 1 }, z_LI: { BA: 1 }, z_HI: { BP: -1, HO: -1, BA: 1, WE: -1 }, z_PK: { BP: 1, HO: 1, WE: 1 },
  z_ST: { BP: 1, HO: 1, WE: 1 },
  wf_res: { WE: 1 }, wf_ind: { WE: -1 }, two_rung: { HO: -1 }, remove_transit: { TR: -1 }, demolish_job: { BA: -1 },
  shoreline: { WE: 1 }, road_diet: { BP: 1, MO: -1 }, teardown: { BP: 1, MO: -1, WE: 1 },
};
// ===== Board geometry =====
// Lots: "c:r" 0-based (A1 = 0:0). Intersections (nodes): "x:y" 0..12. Edges: "h:x:y" = (x,y)-(x+1,y); "v:x:y" = (x,y)-(x,y+1).
const lk = (c, r) => c + ':' + r;
const nk = (x, y) => x + ':' + y;
const parseK = k => k.split(':').map(Number);
const lotName = k => { const [c, r] = parseK(k); return COLS[c] + (r + 1); };
const nodeName = k => { const [x, y] = parseK(k); return '(' + x + ',' + y + ')'; };
function edgeNodes(e) { const [t, x, y] = e.split(':'); const X = +x, Y = +y; return t === 'h' ? [nk(X, Y), nk(X + 1, Y)] : [nk(X, Y), nk(X, Y + 1)]; }
function edgeKey(a, b) {
  const [x1, y1] = parseK(a), [x2, y2] = parseK(b);
  if (y1 === y2 && Math.abs(x1 - x2) === 1) return 'h:' + Math.min(x1, x2) + ':' + y1;
  if (x1 === x2 && Math.abs(y1 - y2) === 1) return 'v:' + x1 + ':' + Math.min(y1, y2);
  return null;
}
const edgeName = e => { const [a, b] = edgeNodes(e); return nodeName(a) + '–' + nodeName(b); };
function edgeLots(e) { // lots on either side (only those on board)
  const [t, x, y] = e.split(':'); const X = +x, Y = +y; const out = [];
  if (t === 'h') { if (Y - 1 >= 0) out.push(lk(X, Y - 1)); if (Y < N) out.push(lk(X, Y)); }
  else { if (X - 1 >= 0) out.push(lk(X - 1, Y)); if (X < N) out.push(lk(X, Y)); }
  return out;
}
function lotEdges(l) { const [c, r] = parseK(l); return ['h:' + c + ':' + r, 'h:' + c + ':' + (r + 1), 'v:' + c + ':' + r, 'v:' + (c + 1) + ':' + r]; }
function lotCorners(l) { const [c, r] = parseK(l); return [nk(c, r), nk(c + 1, r), nk(c, r + 1), nk(c + 1, r + 1)]; }
function nodeLots(n) { const [x, y] = parseK(n); const o = []; for (const [c, r] of [[x - 1, y - 1], [x, y - 1], [x - 1, y], [x, y]]) if (c >= 0 && r >= 0 && c < N && r < N) o.push(lk(c, r)); return o; }
function nodeEdges(n) {
  const [x, y] = parseK(n); const o = [];
  if (x > 0) o.push('h:' + (x - 1) + ':' + y); if (x < N) o.push('h:' + x + ':' + y);
  if (y > 0) o.push('v:' + x + ':' + (y - 1)); if (y < N) o.push('v:' + x + ':' + y);
  return o;
}
const lotDistrict = l => { const [c, r] = parseK(l); return Math.floor(r / 4) * 3 + Math.floor(c / 4); };
// walkshed: radius k around node (x,y) = lots c in [x-k-1, x+k], r likewise
function inWalk(n, l, k) { const [x, y] = parseK(n), [c, r] = parseK(l); return c >= x - k - 1 && c <= x + k && r >= y - k - 1 && r <= y + k; }
function walkLots(n, k) { const [x, y] = parseK(n); const o = []; for (let c = x - k - 1; c <= x + k; c++) for (let r = y - k - 1; r <= y + k; r++) if (c >= 0 && r >= 0 && c < N && r < N) o.push(lk(c, r)); return o; }
const lotAdj = l => { const [c, r] = parseK(l); return [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < N && b < N).map(([a, b]) => lk(a, b)); };
const lotCheb = (a, b) => { const [c1, r1] = parseK(a), [c2, r2] = parseK(b); return Math.max(Math.abs(c1 - c2), Math.abs(r1 - r2)); };

const BOARD = (() => {
  const river = new Set();
  [0, 1, 2, 3, 8, 9, 10, 11].forEach(r => river.add(lk(8, r)));
  [3, 4, 5, 6, 7, 8].forEach(r => river.add(lk(7, r)));
  const lots = []; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) lots.push(lk(c, r));
  const water = new Set(lots.filter(l => !river.has(l) && lotAdj(l).some(a => river.has(a))));
  // channel order of river lots
  // fix: rulebook lists I1-I4, H4-H9, I9-I12 (16 lots); channel adjacency I4-H4 and H9-I9
  const chan = ['8:0', '8:1', '8:2', '8:3', '7:3', '7:4', '7:5', '7:6', '7:7', '7:8', '8:8', '8:9', '8:10', '8:11'];
  const chanIdx = {}; chan.forEach((l, i) => chanIdx[l] = i);
  // banks via flood fill of land lots
  const bank = {}; let b = 0;
  for (const l of lots) {
    if (river.has(l) || bank[l] !== undefined) continue;
    const q = [l]; bank[l] = b;
    while (q.length) { const x = q.pop(); for (const a of lotAdj(x)) if (!river.has(a) && bank[a] === undefined) { bank[a] = b; q.push(a); } }
    b++;
  }
  // bank 0 contains A1 = west
  const edges = []; for (let y = 0; y <= N; y++) for (let x = 0; x < N; x++) edges.push('h:' + x + ':' + y);
  for (let x = 0; x <= N; x++) for (let y = 0; y < N; y++) edges.push('v:' + x + ':' + y);
  const nodes = []; for (let y = 0; y <= N; y++) for (let x = 0; x <= N; x++) nodes.push(nk(x, y));
  const crossing = new Set(edges.filter(e => { const L = edgeLots(e); return L.length >= 1 && L.every(l => river.has(l)); }));
  const bridgeSites = ['h:8:2', 'h:7:6', 'h:8:10'];
  const bridgeNames = { 'h:8:2': 'North Bridge', 'h:7:6': 'Central Bridge', 'h:8:10': 'South Bridge' };
  const riverbank = new Set(nodes.filter(n => { const L = nodeLots(n); return L.some(l => river.has(l)) && L.some(l => !river.has(l)); }));
  const connectors = ['6:0', '6:12', '0:6', '12:6'];
  function nodeBank(n) { const L = nodeLots(n).filter(l => !river.has(l)); return L.length ? bank[L[0]] : -1; }
  return { river, water, lots, edges, nodes, crossing, bridgeSites, bridgeNames, riverbank, connectors, bank, nodeBank, chan, chanIdx };
})();
// river-lot distance (inclusive count) between two riverbank nodes along the channel
function channelDist(a, b) {
  let best = 99;
  for (const la of nodeLots(a)) for (const lb of nodeLots(b)) {
    if (BOARD.chanIdx[la] === undefined || BOARD.chanIdx[lb] === undefined) continue;
    best = Math.min(best, Math.abs(BOARD.chanIdx[la] - BOARD.chanIdx[lb]) + 1);
  }
  return best;
}
const edgeDistricts = e => [...new Set(edgeLots(e).map(lotDistrict))];
const nodeDistricts = n => [...new Set(nodeLots(n).map(lotDistrict))];
// ===== RNG, state helpers =====
function rngNext(S) { // mulberry32 stored in state
  let t = (S.rng = (S.rng + 0x6D2B79F5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const rint = (S, n) => Math.floor(rngNext(S) * n);
function shuffle(S, a) { for (let i = a.length - 1; i > 0; i--) { const j = rint(S, i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const clone = o => JSON.parse(JSON.stringify(o));
function touch(S) { S.ver = (S.ver || 0) + 1; }
function P(S, pid) { return S.players[pid]; }
function hasEng(S, pid, e) { return S.players[pid] && S.players[pid].eng === e; }
function hasCon(S, pid, c) { return S.players[pid] && S.players[pid].con === c; }
function mayorIs(S, m) { return S.mayor === m; }
function eventIs(S, id) { return S.event && S.event.id === id; }
function log(S, msg, pid, cls) { S.log.push({ r: S.round, msg, pid: pid === undefined ? null : pid, cls: cls || '' }); if (S.log.length > 3000) S.log.splice(0, 500); }
function money(S, pid, amt, why) {
  const p = S.players[pid]; p.cash += amt;
  if (S.roundLedger && S.roundLedger[pid]) S.roundLedger[pid].items.push([why, amt]);
  log(S, `${p.name} ${amt >= 0 ? '+' : '−'}$${Math.abs(amt)}: ${why} (cash $${p.cash})`, pid, 'cash');
}
function standingName(v) { return v >= 3 ? 'Champion' : v === 2 ? 'Favored' : v <= -3 ? 'Blocked' : v === -2 ? 'Opposed' : 'Neutral'; }
function moveStanding(S, pid, d, delta, why) {
  const p = S.players[pid]; const old = p.standing[d];
  const nv = Math.max(-3, Math.min(3, old + delta));
  if (nv === old) { if (delta && why) log(S, `${p.name} standing in ${DISTRICTS[d]} stays ${fmtS(old)} (${why}, capped)`, pid, 'stand'); return; }
  p.standing[d] = nv; touch(S);
  log(S, `${p.name} standing in ${DISTRICTS[d]} ${fmtS(old)} → ${fmtS(nv)} ${standingName(nv) !== 'Neutral' ? '(' + standingName(nv) + ')' : ''}${why ? ' — ' + why : ''}`, pid, 'stand');
}
const fmtS = v => v > 0 ? '+' + v : '' + v;
function eraOfRound(S, r) { const e = S.opts.eraEnds; return r <= e[0] ? 1 : r <= e[1] ? 2 : 3; }
function availableEra(S, pid, eraNeeded, key) { return eraNeeded <= S.era || S.players[pid].pilot.includes(key); }
function opKey(kind, a, b) { return kind + '|' + a + (b !== undefined ? '|' + b : ''); }
function isOp(S, key) { return !S.build[key]; }
function addProject(S, pid, keys, markers, label) {
  if (markers <= 0 || !keys.length) return;
  const id = 'pj' + (S.nextId++);
  for (const k of keys) S.build[k] = { m: markers, proj: id, owner: pid };
  S.projects.push({ id, owner: pid, label, keys });
  log(S, `${label}: ${markers} Construction marker${markers > 1 ? 's' : ''} (operational in ${markers} round${markers > 1 ? 's' : ''})`, pid);
}
function projectMarkers(S, pj) { let m = 0; for (const k of pj.keys) if (S.build[k]) m = Math.max(m, S.build[k].m); return m; }
function reduceProject(S, pj, n) {
  for (const k of pj.keys) if (S.build[k]) { S.build[k].m -= n; if (S.build[k].m <= 0) delete S.build[k]; }
  if (projectMarkers(S, pj) === 0) S.projects = S.projects.filter(x => x !== pj);
  touch(S);
}
function lineLabel(S, L) {
  const n = { bus: 'Bus', shuttle: 'Ferry Shuttle', river: 'River Line', lr: 'Light Rail', hr: 'Heavy Rail' }[L.mode];
  return `${S.players[L.owner].name} ${n}${L.letter ? ' ' + L.letter : ''}`;
}
function zoneLabel(S, z) { return `${S.players[z.owner] ? S.players[z.owner].name + ' ' : ''}${ZT[z.type].name} ${z.lots.map(lotName).join('–')}`; }
function ownedEdges(S, pid, mode) { let n = 0; for (const k in S.edges) if (S.edges[k][mode] === pid) n++; return n; }
// ===== Service map: what is operational / where, memoized per state version =====
const _svcCache = new WeakMap();
function svc(S) {
  const c = _svcCache.get(S);
  if (c && c.ver === S.ver) return c.data;
  const data = buildSvc(S);
  _svcCache.set(S, { ver: S.ver, data });
  return data;
}
function lineClosed(S, L) {
  const fl = S.flags || {};
  if (L.mode === 'shuttle' || L.mode === 'river') {
    if (eventIs(S, 7) && !hasEng(S, L.owner, 'E6')) return true; // fog
    if (eventIs(S, 16) && !hasEng(S, L.owner, 'E10')) return true; // flood
    if (eventIs(S, 27) && L.mode === 'river' && !hasEng(S, L.owner, 'E6')) return true; // ice
  }
  return false;
}
function edgeClosed(S, e, owner) {
  if (!BOARD.crossing.has(e)) return false;
  if (owner !== undefined && hasEng(S, owner, 'E10')) return false;
  if (eventIs(S, 16)) return true;
  if (S.flags && S.flags.closedBridge === e) return true;
  return false;
}
function buildSvc(S) {
  const E = { road: new Set(), bike: new Set(), hwy: new Set(), lr: new Set(), hr: new Set() };
  const Eall = { road: new Set(), bike: new Set(), hwy: new Set() };
  for (const e in S.edges) {
    const x = S.edges[e];
    for (const m of ['road', 'bike', 'hwy', 'lr', 'hr']) if (x[m] !== undefined && x[m] !== null) {
      if (isOp(S, opKey('e', e, m))) E[m].add(e);
      if (Eall[m]) Eall[m].add(e);
    }
  }
  const bikeServe = new Set(E.bike);
  for (const e of E.road) if (hasEng(S, S.edges[e].road, 'E7')) bikeServe.add(e);
  const stops = [];
  for (const id in S.lines) {
    const L = S.lines[id];
    for (const n of L.stops) {
      const op = isOp(S, opKey('s', id, n));
      const mode = L.mode === 'shuttle' || L.mode === 'river' ? 'dock' : L.mode;
      stops.push({ node: n, mode, line: id, owner: L.owner, op, brt: mode === 'bus' && (L.brt || hasEng(S, L.owner, 'E4')), lmode: L.mode });
    }
  }
  // market-connected highway: BFS over operational highway edges from connectors
  const hadj = {};
  for (const e of E.hwy) { const [a, b] = edgeNodes(e); (hadj[a] = hadj[a] || []).push(b); (hadj[b] = hadj[b] || []).push(a); }
  const market = new Set(); const q = BOARD.connectors.filter(n => hadj[n]);
  q.forEach(n => market.add(n));
  while (q.length) { const n = q.pop(); for (const m of hadj[n] || []) if (!market.has(m)) { market.add(m); q.push(m); } }
  const ics = [];
  for (const n in S.ics) ics.push({ node: n, owner: S.ics[n], op: isOp(S, opKey('i', n)), market: market.has(n) });
  // interchange components via highway (for car legs)
  const icComp = {};
  for (const ic of ics) if (ic.op) {
    const seen = new Set([ic.node]); const qq = [ic.node];
    while (qq.length) { const n = qq.pop(); for (const m of hadj[n] || []) if (!seen.has(m)) { seen.add(m); qq.push(m); } }
    icComp[ic.node] = ics.filter(o => o.op && seen.has(o.node)).map(o => o.node);
  }
  // hubs: HR station (op) sharing node with another line's op stop or an interchange
  const hubs = [];
  for (const s of stops) if (s.mode === 'lr' && s.op && hasEng(S, s.owner, 'E9')) { // v0.7: Hubs via Transit Hub Planning (E9)
    if (stops.some(o => o.node === s.node && o.line !== s.line && o.op)) hubs.push(s);
  }
  return { E, Eall, bikeServe, stops, ics, market, hadj, icComp, hubs, opStops: stops.filter(s => s.op) };
}
// ---- lot service queries ----
function lotsBorder(lots) { const s = new Set(); for (const l of lots) for (const e of lotEdges(l)) s.add(e); return s; }
function roadServed(S, lots) { const sv = svc(S); for (const e of lotsBorder(lots)) if (sv.E.road.has(e)) return true; return false; }
function bikeServed(S, lots) { const sv = svc(S); for (const e of lotsBorder(lots)) if (sv.bikeServe.has(e)) return true; return false; }
function e3Served(S, lots) { // bike-served by an E3 / protected-network owner's lanes
  const sv = svc(S);
  for (const e of lotsBorder(lots)) {
    if (sv.E.bike.has(e)) { const o = S.edges[e].bike; if (hasEng(S, o, 'E3') || S.players[o].programs.protectedBike) return true; }
  }
  return false;
}
function stopRadius(s) { return s.mode === 'hr' ? 2 : 1; }
function anyLotIn(n, lots, k) { return lots.some(l => inWalk(n, l, k)); }
function transitServed(S, lots) { return svc(S).opStops.some(s => anyLotIn(s.node, lots, stopRadius(s))); }
function zoningRadius(S, s) { return hasEng(S, s.owner, 'E5') && (s.mode === 'lr' || s.mode === 'hr') ? 2 : 1; }
function lrZone(S, lots) { // light-rail-like zoning (LR station, BRT stop)
  return svc(S).opStops.some(s => (s.mode === 'lr' || s.brt) && anyLotIn(s.node, lots, s.mode === 'lr' ? zoningRadius(S, s) : 1));
}
function hrZone(S, lots) { return svc(S).opStops.some(s => s.mode === 'hr' && anyLotIn(s.node, lots, zoningRadius(S, s))); }
function busWalk(S, lots) { return svc(S).opStops.some(s => s.mode === 'bus' && anyLotIn(s.node, lots, 1)); }
function railR1(S, lots) { return svc(S).opStops.some(s => (s.mode === 'lr' || s.mode === 'hr') && anyLotIn(s.node, lots, zoningRadius(S, s))); }
function docksNear(S, lots, forPrime) {
  return svc(S).opStops.filter(s => s.mode === 'dock' && anyLotIn(s.node, lots, forPrime && hasEng(S, s.owner, 'E6') ? 2 : 1) && !(forPrime && lineClosed(S, S.lines[s.line]) && eventIs(S, 7)));
}
// v0.7 freight roads: market-connected freight edges (internal key 'hwy')
function marketFreight(S) { const sv = svc(S); return [...sv.E.hwy].filter(e => edgeNodes(e).every(n => sv.market.has(n))); }
function freightOnBorder(S, lots) { const b = lotsBorder(lots); return marketFreight(S).filter(e => b.has(e)); }
function freightNear(S, lots, k) { return marketFreight(S).filter(e => edgeNodes(e).some(n => anyLotIn(n, lots, k))); }
function icsNear(S, lots, k) { return svc(S).ics.filter(i => i.op && anyLotIn(i.node, lots, k)); }
function isWaterfront(lots) { return lots.some(l => BOARD.water.has(l)); }
function portAccess(S, lots) { return isWaterfront(lots) ? docksNear(S, lots, false) : []; }
function zoneDistrict(z) { return lotDistrict(z.lots[0]); }
function zonesAt(S, pred) { return Object.values(S.zones).filter(pred); }
function adjZones(S, z) {
  const out = new Set();
  for (const l of z.lots) for (const a of lotAdj(l)) { const id = S.lotZone[a]; if (id && id !== z.id) out.add(id); }
  return [...out].map(id => S.zones[id]);
}
function roadOnly(S, z) { return roadServed(S, z.lots) && !bikeServed(S, z.lots) && !transitServed(S, z.lots); }
// ===== Valuation: congestion, zone Pop/Tax/job income, player income =====
// v0.7 Municipal Overhead: keep all up to $30 gross, half of $31–60, a third above $60
function overhead(g) { return Math.min(g, 30) + Math.floor(Math.max(0, Math.min(g, 60) - 30) / 2) + Math.floor(Math.max(0, g - 60) / 3); }
function filledSlots(S) { const f = {}; for (const id in S.zones) for (const w of S.zones[id].workers || []) if (w.job) f[w.job] = (f[w.job] || 0) + 1; return f; }
function slotsOf(S, z) { return z.type === 'HQ' ? S.hq.slots : (ZT[z.type].slots || 0); }
function congestion(S) {
  const cnt = Array(9).fill(0); const limit = Array(9).fill(6);
  const mult = eventIs(S, 25) ? 2 : 1;
  for (const id in S.zones) {
    const z = S.zones[id]; const T = ZT[z.type];
    if (z.type === 'HQ') {
      const near = svc(S).opStops.some(s => (s.mode === 'lr' || s.mode === 'hr' || s.mode === 'dock') && anyLotIn(s.node, z.lots, 1));
      const lum = S.corp === 'LUM';
      cnt[zoneDistrict(z)] += near ? (lum ? 2 : 1) : (lum ? 4 : 3); continue;
    }
    if (T.park) continue;
    if (roadOnly(S, z)) cnt[zoneDistrict(z)] += mult;
  }
  for (const ic of svc(S).ics) for (const d of nodeDistricts(ic.node)) cnt[d] += hasEng(S, ic.owner, 'E9') ? 1 : 2;
  for (const pl of S.players) if (pl.eng === 'E2') {
    const per = Array(9).fill(0);
    for (const e in S.edges) if (S.edges[e].road === pl.id) for (const d of edgeDistricts(e)) per[d]++;
    per.forEach((v, d) => { if (v >= 3) limit[d] = 9; });
  }
  return { cnt, limit, congested: cnt.map((c, d) => c > limit[d]) };
}
function saturationRank(S) { // zone id -> copy index (1-based) within owner+type
  const rank = {}; const seen = {};
  const ids = Object.keys(S.zones).sort((a, b) => S.zones[a].seq - S.zones[b].seq);
  for (const id of ids) { const z = S.zones[id]; if (ZT[z.type].park || z.type === 'HQ') continue; const k = z.owner + '/' + z.type; seen[k] = (seen[k] || 0) + 1; rank[id] = seen[k]; }
  return rank;
}
function heavyNear(S, z) { return Object.values(S.zones).some(o => o.type === 'HI' && o.lots.some(a => z.lots.some(b => lotCheb(a, b) <= 2))); }
function hwyOnBorder(S, z, noisyOnly) {
  const sv = svc(S);
  for (const e of lotsBorder(z.lots)) if (sv.Eall.hwy.has(e)) { if (!noisyOnly || !hasEng(S, S.edges[e].hwy, 'E1')) return true; }
  return false;
}
function officeLR(S, z) { return svc(S).opStops.some(s => s.mode === 'lr' && anyLotIn(s.node, z.lots, 1)); }
function adjPark(S, z) { return adjZones(S, z).some(o => ZT[o.type].park); }
function waterfrontBonus(S, z) { // returns {val, why}
  if (!isWaterfront(z.lots)) return null;
  if (eventIs(S, 16) && !hasEng(S, z.owner, 'E10')) return { val: 0, why: 'flood' };
  if (hwyOnBorder(S, z, true)) return { val: 0, why: 'highway on border' };
  if (heavyNear(S, z)) return { val: 0, why: 'Heavy Industrial within 2 lots' };
  let prime = docksNear(S, z.lots, true).length > 0 && !(eventIs(S, 7) && docksNear(S, z.lots, true).every(s => !hasEng(S, s.owner, 'E6')));
  if (adjPark(S, z)) prime = true;
  if (!prime) prime = Object.values(S.zones).some(o => o.type === 'PK' && hasEng(S, o.owner, 'E10') && isWaterfront(o.lots) && o.lots.some(a => z.lots.some(b => lotCheb(a, b) <= 2)));
  let val = prime ? 2 : 1;
  const li = adjZones(S, z).filter(o => o.type === 'LI').length;
  val = Math.max(0, val - li);
  return { val, why: (prime ? 'Prime waterfront' : 'waterfront') + (li ? ` −${li} adj. LI` : '') };
}
function inducedSet(S) { // zone ids receiving HQ induced demand
  const out = new Set(); if (!S.hq || !S.hq.zid || !S.zones[S.hq.zid]) return out;
  const hq = S.zones[S.hq.zid]; const per = {};
  const ids = Object.keys(S.zones).sort((a, b) => S.zones[a].seq - S.zones[b].seq);
  for (const id of ids) {
    const z = S.zones[id]; if (!ZT[z.type].res) continue;
    const rad = S.corp === 'ARC' && ZT[z.type].rung >= 3 ? 3 : 2;
    if (!z.lots.some(a => hq.lots.some(b => lotCheb(a, b) <= rad))) continue;
    per[z.owner] = (per[z.owner] || 0) + 1; if (per[z.owner] <= 4) out.add(id);
  }
  return out;
}
function evalCity(S) {
  const cg = congestion(S); const rank = saturationRank(S); const filled = filledSlots(S); const ind = inducedSet(S);
  const sv = svc(S); const Z = {};
  for (const id in S.zones) {
    const z = S.zones[id]; const T = ZT[z.type]; const d = zoneDistrict(z);
    const r = { pop: 0, parts: [], tax: 0, taxParts: [], job: 0, jobParts: [], filled: filled[id] || 0, slots: slotsOf(S, z) };
    const ro = roadOnly(S, z);
    if (T.res) {
      r.pop = T.pop; r.parts.push([T.abbr, T.pop]);
      if (z.type !== 'HR') {
        const bike = bikeServed(S, z.lots) && !eventIs(S, 6); const park = adjPark(S, z);
        if (bike || park) { const v = (z.type === 'CC' ? 2 : 1) + (eventIs(S, 4) ? 1 : 0); r.pop += v; r.parts.push(['Livable', v]); }
      }
      let tb = 0;
      if ((z.type === 'TH' || z.type === 'MP') && busWalk(S, z.lots)) tb = 1;
      if (['TH', 'MP', 'MR', 'HR'].includes(z.type) && lrZone(S, z.lots)) tb = 1;
      if ((z.type === 'MR' || z.type === 'HR') && hrZone(S, z.lots)) tb = 1;
      if (tb) { r.pop += 1; r.parts.push(['transit density', 1]); }
      r.tax = T.tax; r.taxParts.push([T.abbr, T.tax]);
      const wf = waterfrontBonus(S, z);
      if (wf && wf.val > 0) { r.pop += wf.val; r.parts.push([wf.why, wf.val]); r.tax += 1; r.taxParts.push(['waterfront', 1]); }
      if (wf && eventIs(S, 17)) { r.pop += 1; r.parts.push(['Waterfront Festival', 1]); }
      if (eventIs(S, 10)) { r.tax += 1; r.taxParts.push(['Housing Crisis', 1]); }
      if (ind.has(id)) { r.pop += 1; r.parts.push(['HQ induced demand', 1]); }
      if (z.landmark) { r.pop += 1; r.parts.push(['Landmark', 1]); }
      if (eventIs(S, 21) && z.workers.every(w => w.job)) { r.pop += 1; r.parts.push(['Population Boom', 1]); }
      if (rank[id] >= 4) { r.pop -= 1; r.parts.push(['saturation (4th+ copy)', -1]); }
      if (ro && cg.congested[d]) { r.pop -= 1; r.parts.push(['congestion', -1]); }
      if (ro && eventIs(S, 3)) { r.pop -= 1; r.parts.push(['Gas Price Spike', -1]); }
      if ((z.type === 'MR' || z.type === 'HR') && eventIs(S, 22) && !adjPark(S, z) && !isWaterfront(z.lots)) { r.pop -= 1; r.parts.push(['Heat Wave', -1]); }
      const hiAdj = adjZones(S, z).filter(o => o.type === 'HI').length;
      if (hiAdj) { r.pop -= hiAdj; r.parts.push(['Heavy Industrial nuisance', -hiAdj]); }
      if (hwyOnBorder(S, z, true) && r.pop > 1) { r.pop -= 1; r.parts.push(['highway noise', -1]); }
      if (z.unemp) { const v = Math.min(r.pop, 2 * z.unemp); r.pop -= v; r.parts.push([`unemployment (${z.unemp} cube)`, -v]); }
      r.pop = Math.max(0, r.pop);
    }
    // v0.5b: Parks give their owner no Pop of their own (they still make neighbours Livable / Prime).
    if (r.slots && z.type !== 'HQ') {
      const f = r.filled; let rate = T.rate || 0;
      let inc = f * rate; r.jobParts.push([`${f}×$${rate}`, f * rate]);
      if (z.type === 'ST' && !roadServed(S, z.lots)) { inc = 0; r.jobParts = [['not road-served', 0]]; }
      if (z.type === 'NC' && bikeServed(S, z.lots)) { inc += 1; r.jobParts.push(['bike retail', 1]); }
      if (T.ind) {
        const fr = freightFor(S, z);
        if (fr) { const per = z.type === 'HI' ? 2 : 1; inc += per * f; r.jobParts.push([fr.kind + ` +$${per}/slot`, per * f]); r.freight = fr; }
        if (eventIs(S, 28) && portAccess(S, z.lots).length) { inc += f; r.jobParts.push(['Harbor Dredging', f]); }
      }
      if (sv.hubs.some(h => anyLotIn(h.node, z.lots, 1))) { inc += f; r.jobParts.push(['Hub +$1/slot', f]); }
      if (z.type === 'MU' && lrZone(S, z.lots)) { inc += f; r.jobParts.push(['light rail +$1/slot', f]); }
      // v0.5c: Office +$1/filled slot with an operational light rail station within radius 1 (stacks with Hub +$1)
      if (z.type === 'OF' && officeLR(S, z)) { inc += f; r.jobParts.push(['Office near light rail +$1/slot', f]); }
      if (rank[id] >= 4) { inc -= 1; r.jobParts.push(['saturation', -1]); }
      if (ro && cg.congested[d]) { inc -= 1; r.jobParts.push(['congestion', -1]); }
      if (eventIs(S, 20)) { inc -= 1; r.jobParts.push(['Recession', -1]); }
      r.job = Math.max(0, inc);
    }
    Z[id] = r;
  }
  return { Z, cg };
}
function freightFor(S, z) { // best freight source; prefers own
  const T = ZT[z.type]; if (!T.ind) return null;
  const opts = [];
  for (const e of freightOnBorder(S, z.lots)) opts.push({ kind: 'highway', owner: S.edges[e].hwy, node: edgeNodes(e)[0] });
  for (const dk of portAccess(S, z.lots)) opts.push({ kind: 'port', owner: dk.owner, node: dk.node });
  if (!opts.length) return null;
  opts.sort((a, b) => (a.owner === z.owner ? 0 : 1) - (b.owner === z.owner ? 0 : 1));
  return opts[0];
}
function riderTokens(S) { // lineId -> [{pid, rival}]
  const t = {};
  for (const id in S.zones) for (const w of S.zones[id].workers || []) if (w.job && w.route) for (const lid of w.route) {
    const L = S.lines[lid]; if (!L) continue;
    const rival = L.owner !== S.zones[id].owner;
    if (rival || L.mode === 'shuttle' || L.mode === 'river') (t[lid] = t[lid] || []).push({ pid: S.zones[id].owner, rival, zone: id });
  }
  return t;
}
function playerPop(S, pid, ev) {
  ev = ev || evalCity(S); let pop = 0; const parts = [];
  for (const id in S.zones) { const z = S.zones[id]; if (z.owner !== pid) continue; const v = ev.Z[id].pop; if (v || ZT[z.type].res) { pop += v; parts.push([zoneLabel(S, z), v]); } }
  if (S.hq && S.hq.host === pid && !S.hq.bonusLost && S.hq.zid) { pop += 4; parts.push(['HQ Relocation bonus', 4]); }
  return { pop, parts };
}
function upkeepOf(S, pid) {
  const p = S.players[pid]; const items = [];
  const roads = ownedEdges(S, pid, 'road'), bikes = ownedEdges(S, pid, 'bike'), hw = ownedEdges(S, pid, 'hwy');
  const rdiv = p.con === 'C1' ? 3 : 4;
  if (roads) items.push([`roads ${roads} ($1/${rdiv})`, Math.floor(roads / rdiv)]);
  if (bikes) items.push([`bike ${bikes} ($1/8)`, Math.floor(bikes / 8)]);
  const ics = Object.values(S.ics).filter(o => o === pid).length;
  if (hw) items.push([`freight ${hw} edges ($1/4)`, Math.floor(hw / 4)]);
  for (const id in S.lines) {
    const L = S.lines[id]; if (L.owner !== pid) continue;
    if (L.mode === 'bus') items.push([`${lineLabel(S, L)}: ${L.stops.length} stops`, L.stops.length]);
    if (L.mode === 'shuttle' || L.mode === 'river') items.push([`${lineLabel(S, L)}: ${L.stops.length} docks, ${L.boats} boats`, L.stops.length + L.boats - 1]);
    if (L.mode === 'lr') items.push([`light rail ${L.stops.length} stations ($1/2)`, Math.ceil(L.stops.length / 2)]); // v0.7: $1 per 2 stations (round up)
    if (L.mode === 'hr') items.push([`heavy rail ${L.stops.length} stations`, 2 * L.stops.length]);
  }
  if (eventIs(S, 1) && roads >= 4) items.push(['Pothole Season', Math.floor(roads / 4)]);
  return items.filter(i => i[1] !== 0 || i[0].startsWith('road'));
}
function bondRate(S, pid) { return (hasCon(S, pid, 'C9') || mayorIs(S, 'M11')) ? 2 : 1; }
// Full income statement for every player (does not mutate)
function incomeStatement(S) {
  const ev = evalCity(S); const tokens = riderTokens(S); const out = {};
  for (const p of S.players) out[p.id] = { tax: 0, taxParts: [], wages: 0, jobs: 0, jobParts: [], gross: 0, afterOH: 0, transfers: [], upkeep: [], interest: 0, net: 0 };
  for (const id in S.zones) {
    const z = S.zones[id]; const r = ev.Z[id]; const o = out[z.owner]; if (!o) continue;
    if (r.tax) { o.tax += r.tax; o.taxParts.push([zoneLabel(S, z), r.tax]); }
    if (r.job) { o.jobs += r.job; o.jobParts.push([zoneLabel(S, z), r.job]); }
    for (const w of z.workers || []) if (w.job) o.wages += 1;
    if (r.freight && r.freight.owner !== z.owner) {
      const fee = mayorIs(S, 'M8') ? 2 : 1;
      out[z.owner].transfers.push([`${r.freight.kind === 'port' ? 'port fee' : 'toll'} to ${S.players[r.freight.owner].name} (${lotName(z.lots[0])})`, -fee]);
      out[r.freight.owner].transfers.push([`${r.freight.kind === 'port' ? 'port fee' : 'toll'} from ${S.players[z.owner].name} (${lotName(z.lots[0])})`, fee]);
    }
  }
  const strike = eventIs(S, 14);
  for (const lid in tokens) {
    const L = S.lines[lid]; const closed = lineClosed(S, L);
    for (const t of tokens[lid]) {
      if (!t.rival || strike || closed) continue;
      let f = FARE[L.mode]; if (eventIs(S, 17) && (L.mode === 'shuttle' || L.mode === 'river')) f *= 2;
      out[t.pid].transfers.push([`fare to ${S.players[L.owner].name} (${lineLabel(S, L)})`, -f]);
      out[L.owner].transfers.push([`fare from ${S.players[t.pid].name} (${lineLabel(S, L)})`, f]);
    }
    const n = tokens[lid].length;
    if (eventIs(S, 3) && n) out[L.owner].transfers.push([`Gas Price Spike: ${n} rider tokens`, n]);
    if (S.flags.ridership && S.flags.ridership.includes(L.owner) && n) out[L.owner].transfers.push([`Ridership Campaign: ${n} tokens`, n]);
    if (eventIs(S, 23) && n >= 3) out[L.owner].transfers.push([`Ridership Surge (${lineLabel(S, L)})`, 3]);
    if (eventIs(S, 18) && (L.mode === 'shuttle' || L.mode === 'river') && n) out[L.owner].transfers.push([`Bridge Inspection ferry bonus`, n]);
  }
  for (const h of svc(S).hubs) out[h.owner].transfers.push([`Hub station retail ${nodeName(h.node)}`, 2]);
  for (const p of S.players) {
    const o = out[p.id];
    const champ = p.standing.filter(v => v >= 3).length; if (champ) o.transfers.push([`Civic grant (${champ} Champion district${champ > 1 ? 's' : ''})`, champ]);
    if (eventIs(S, 25)) { const n = Object.values(S.lines).filter(L => L.owner === p.id && L.mode === 'bus').reduce((a, L) => a + L.stops.length, 0); if (n) o.transfers.push(['Congestion Pricing: bus stops', n]); }
    if (eventIs(S, 4)) { const n = Math.floor(ownedEdges(S, p.id, 'bike') / 4); if (n) o.transfers.push(['Bike Boom', n]); }
    o.gross = o.tax + o.wages + o.jobs; o.afterOH = overhead(o.gross);
    o.upkeep = upkeepOf(S, p.id);
    o.interest = p.bonds * bondRate(S, p.id);
    o.net = o.afterOH + o.transfers.reduce((a, t) => a + t[1], 0) - o.upkeep.reduce((a, t) => a + t[1], 0) - o.interest;
  }
  return { out, ev };
}
function progressOf(S, pid, pop, cash) {
  const p = S.players[pid]; pop = pop === undefined ? playerPop(S, pid).pop : pop; cash = cash === undefined ? p.cash : cash;
  return pop / S.opts.popTarget + cash / cashTarget(S);
}
function cashTarget(S) { return S.players.length === 2 ? S.opts.cashTarget2 : S.opts.cashTarget; }
// ===== Commuting: route finding, assignment, persistence =====
function graphAdj(S, mode, ownerFilter) {
  // adjacency over operational edges usable for commuting (closures excluded)
  const sv = svc(S); const adj = {};
  const set = mode === 'bike' ? sv.bikeServe : sv.E[mode];
  for (const e of set) {
    const own = mode === 'bike' ? (S.edges[e].bike !== undefined && sv.E.bike.has(e) ? S.edges[e].bike : S.edges[e].road) : S.edges[e][mode];
    if (edgeClosed(S, e, own)) continue;
    const [a, b] = edgeNodes(e); (adj[a] = adj[a] || []).push(b); (adj[b] = adj[b] || []).push(a);
  }
  return adj;
}
function commuteCtx(S) {
  const c = _svcCache.get(S); if (c && c.ver === S.ver && c.cc) return c.cc;
  const sv = svc(S);
  const cc = { road: graphAdj(S, 'road'), bike: graphAdj(S, 'bike'), lines: {}, tokens: riderTokens(S) };
  for (const id in S.lines) {
    const L = S.lines[id]; if (lineClosed(S, L)) continue;
    const st = L.stops.filter(n => isOp(S, opKey('s', id, n)));
    if (L.mode === 'bus' && L.edges.some(e => !sv.E.road.has(e) || edgeClosed(S, e))) continue;
    if ((L.mode === 'lr' || L.mode === 'hr') && L.edges.some(e => edgeClosed(S, e, L.owner) && L.mode === 'lr')) continue;
    if (st.length < 2) continue;
    let cap = Infinity;
    if (L.mode === 'shuttle' || L.mode === 'river') {
      let per = hasEng(S, L.owner, 'E6') || L.fast ? 6 : 4;
      if (eventIs(S, 27) && L.mode === 'shuttle' && !hasEng(S, L.owner, 'E6')) per = 2;
      cap = per * L.boats;
    }
    cc.lines[id] = { L, stops: st, r: L.mode === 'hr' ? 2 : 1, cap, used: (cc.tokens[id] || []).length };
  }
  if (c && c.ver === S.ver) c.cc = cc;
  return cc;
}
function bfsRange(adj, starts, budget, S, useHwy) {
  const dist = {}; const q = [];
  for (const s of starts) if (dist[s] === undefined) { dist[s] = 0; q.push(s); }
  const sv = useHwy ? svc(S) : null;
  for (let i = 0; i < q.length; i++) {
    const n = q[i]; const d = dist[n];
    if (useHwy && sv.icComp[n]) for (const m of sv.icComp[n]) if (dist[m] === undefined) { dist[m] = d; q.splice(i + 1, 0, m); }
    if (d >= budget) continue;
    for (const m of adj[n] || []) if (dist[m] === undefined) { dist[m] = d + 1; q.push(m); }
  }
  return dist;
}
function borderNodes(S, lots, mode) {
  const sv = svc(S); const set = mode === 'bike' ? sv.bikeServe : sv.E.road; const out = new Set();
  for (const e of lotsBorder(lots)) if (set.has(e)) edgeNodes(e).forEach(n => out.add(n));
  return [...out];
}
function legRange(S, pid, mode) {
  const p = S.players[pid];
  if (mode === 'road') return p.eng === 'E2' ? 8 : 6;
  return p.programs.protectedBike ? 6 : p.eng === 'E3' ? 5 : 4;
}
// One-leg reach from a zone: map node -> list of leg descriptors {mode, line}
function legEnds(S, pid, lots, isInd) {
  const cc = commuteCtx(S); const ends = {};
  const add = (n, d) => (ends[n] = ends[n] || []).push(d);
  const rs = borderNodes(S, lots, 'road');
  if (rs.length) { const dist = bfsRange(cc.road, rs, legRange(S, pid, 'road'), S, true); for (const n in dist) add(n, { mode: 'road' }); }
  if (!isInd) {
    const bs = borderNodes(S, lots, 'bike');
    if (bs.length) { const dist = bfsRange(cc.bike, bs, legRange(S, pid, 'bike'), S, false); for (const n in dist) add(n, { mode: 'bike' }); }
  }
  for (const id in cc.lines) {
    const X = cc.lines[id];
    if (!X.stops.some(n => anyLotIn(n, lots, X.r))) continue;
    for (const n of X.stops) add(n, { mode: 'line', line: id, board: X.stops.filter(s => anyLotIn(s, lots, X.r)) });
  }
  return ends;
}
// Find best route home->job for owner pid. Returns {route:[lineIds], fare} or null.
function findRoute(S, home, job, pid, cache) {
  if (home.id === job.id) return { route: [], fare: 0, walk: true };
  if (home.lots.some(a => job.lots.some(b => lotAdj(a).includes(b)))) return { route: [], fare: 0, walk: true };
  const cc = commuteCtx(S);
  const jInd = !!ZT[job.type].ind;
  const fw = cache && cache['f' + home.id] || legEnds(S, pid, home.lots, false);
  const bw = cache && cache['b' + job.id] || legEnds(S, pid, job.lots, jInd);
  if (cache) { cache['f' + home.id] = fw; cache['b' + job.id] = bw; }
  const fareOf = lines => lines.reduce((a, id) => a + (S.lines[id].owner !== pid ? FARE[S.lines[id].mode] : 0), 0);
  const okCap = lines => lines.every(id => cc.lines[id].used < cc.lines[id].cap);
  let best = null;
  const consider = (lines) => { if (!okCap(lines)) return; const f = fareOf(lines); if (!best || f < best.fare || (f === best.fare && lines.length < best.route.length)) best = { route: lines, fare: f }; };
  // single leg
  for (const m of jInd ? ['road'] : ['road', 'bike']) {
    if (borderNodes(S, job.lots, m).some(n => fw[n] && fw[n].some(a => a.mode === m))) { consider([]); break; }
  }
  for (const id in cc.lines) {
    const X = cc.lines[id];
    const on = X.stops.filter(s => anyLotIn(s, home.lots, X.r)), off = X.stops.filter(s => anyLotIn(s, job.lots, X.r));
    if (on.length && off.length && on.some(a => off.some(b => b !== a))) consider([id]);
  }
  if (best && best.fare === 0) return best;
  // two legs: transfer at node n
  for (const n in fw) {
    const b = bw[n]; if (!b) continue;
    for (const a of fw[n]) for (const c of b) {
      if (a.mode !== 'line' && c.mode !== 'line') continue; // road+bike chaining not allowed (walk/networks only one leg)
      if (a.mode === 'line' && c.mode === 'line' && a.line === c.line) continue;
      if (a.mode === 'line' && a.board.length === 1 && a.board[0] === n) continue;
      if (c.mode === 'line' && c.board.length === 1 && c.board[0] === n) continue;
      const lines = []; if (a.mode === 'line') lines.push(a.line); if (c.mode === 'line') lines.push(c.line);
      consider(lines);
    }
  }
  return best;
}
function openSlots(S, filled) {
  const o = {}; for (const id in S.zones) { const z = S.zones[id]; const s = slotsOf(S, z); if (s) o[id] = s - (filled[id] || 0); } return o;
}
function jobValue(S, pid, job, route) {
  let v = 1 - route.fare; // wage minus fares
  if (job.owner === pid) v += (ZT[job.type].rate || 0) + 0.5 + (ZT[job.type].ind ? 0.3 : 0);
  if (job.type === 'HQ') v += 0.2;
  return v;
}
// Assign any unplaced cubes of player pid (or all if pid null) to best valid jobs.
function autoAssign(S, pid) {
  const pids = pid === null || pid === undefined ? S.order.slice() : [pid];
  const cache = {};
  for (const q of pids) {
    const filled = filledSlots(S); const open = openSlots(S, filled);
    const homes = Object.values(S.zones).filter(z => z.owner === q && ZT[z.type].res && z.workers.some(w => !w.job));
    for (const h of homes) {
      for (const w of h.workers) {
        if (w.job) continue;
        let best = null;
        for (const jid in open) {
          if (open[jid] <= 0 || selfCapBlocks(h, jid, w)) continue; const j = S.zones[jid];
          const r = findRoute(S, h, j, q, cache); if (!r) continue;
          const v = jobValue(S, q, j, r) - 0.001 * zoneDistance(h, j);
          if (!best || v > best.v) best = { v, jid, r };
        }
        if (best) { w.job = best.jid; w.route = best.r.route; open[best.jid]--; touch(S); }
      }
    }
  }
}
// v0.5b: at most selfFillCap residents of a zone may fill that same zone's job slots (Mixed-Use: 1).
function selfCapBlocks(home, jid, w) { if (home.id !== jid) return false; const cap = ZT[home.type].selfFillCap === undefined ? Infinity : ZT[home.type].selfFillCap; return home.workers.filter(o => o !== w && o.job === home.id).length >= cap; }
function zoneDistance(a, b) { return Math.min(...a.lots.flatMap(x => b.lots.map(y => lotCheb(x, y)))); }
// Re-validate persistent commutes; drop broken ones (weather/closures excuse instead).
function validateCommutes(S) {
  const cache = {}; let dropped = 0;
  for (const id in S.zones) {
    const z = S.zones[id];
    for (const w of z.workers || []) {
      if (!w.job) continue;
      const j = S.zones[w.job];
      if (!j) { w.job = null; w.route = []; dropped++; continue; }
      // closed lines on stored route -> excused (keep)
      if ((w.route || []).some(lid => S.lines[lid] && lineClosed(S, S.lines[lid]))) { w.excused = true; continue; }
      if ((w.route || []).length && (w.route || []).every(lid => S.lines[lid])) {
        // quick check: still valid?
      }
      const r = findRoute(S, z, j, z.owner, cache);
      if (!r) {
        if (S.flags.closedBridge || eventIs(S, 16)) { w.excused = true; continue; }
        w.job = null; w.route = []; dropped++;
      } else w.route = r.route;
    }
  }
  for (const id in S.zones) { const z = S.zones[id]; for (const w of z.workers || []) if (w.job === z.id && selfCapBlocks(z, z.id, w)) { w.job = null; w.route = []; dropped++; } }
  // overfilled jobs (zone shrank / slots changed)
  const filled = filledSlots(S);
  for (const jid in filled) { const j = S.zones[jid]; const over = filled[jid] - slotsOf(S, j); if (over > 0) { let k = over; for (const id in S.zones) for (const w of S.zones[id].workers) if (k > 0 && w.job === jid) { w.job = null; w.route = []; k--; } } }
  if (dropped) touch(S);
  return dropped;
}
function setWorkers(z) { const n = ZT[z.type].workers || 0; z.workers = z.workers || []; while (z.workers.length < n) z.workers.push({ job: null, route: [] }); while (z.workers.length > n) z.workers.pop(); }
// Manual recommute: move worker index wi of zone to job (validated)
function manualCommute(S, pid, zid, wi, jobId) {
  const z = S.zones[zid]; if (!z || z.owner !== pid) throw new Error('Not your zone');
  const w = z.workers[wi]; if (!w) throw new Error('No such worker');
  if (!jobId) { w.job = null; w.route = []; touch(S); return; }
  const j = S.zones[jobId]; const filled = filledSlots(S);
  const cur = w.job === jobId ? 1 : 0;
  if ((filled[jobId] || 0) - cur >= slotsOf(S, j)) throw new Error('No open slot');
  if (selfCapBlocks(z, jobId, w)) throw new Error(`At most ${ZT[z.type].selfFillCap} ${ZT[z.type].name} resident may work in its own job slots`);
  const r = findRoute(S, z, j, pid); if (!r) throw new Error('No valid route');
  w.job = jobId; w.route = r.route; touch(S);
  log(S, `${S.players[pid].name} recommutes a ${ZT[z.type].abbr} ${lotName(z.lots[0])} worker to ${zoneLabel(S, j)}${r.route.length ? ' via ' + r.route.map(l => lineLabel(S, S.lines[l])).join(' + ') : ''}`, pid);
}
function validJobsFor(S, zid) {
  const z = S.zones[zid]; const out = []; const filled = filledSlots(S); const cache = {};
  for (const id in S.zones) { const j = S.zones[id]; const s = slotsOf(S, j); if (!s) continue; const r = findRoute(S, z, j, z.owner, cache); if (r) out.push({ id, open: s - (filled[id] || 0), fare: r.fare, route: r.route }); }
  return out;
}

// Move own cubes from rival/HQ jobs to own open job slots when a route exists (a free Recommute any player would make)
function optimizeCommutes(S, pid) {
  const filled = filledSlots(S); const open = openSlots(S, filled); const cache = {};
  const ownJobs = Object.keys(open).filter(id => open[id] > 0 && S.zones[id].owner === pid && S.zones[id].type !== 'HQ');
  if (!ownJobs.length) return;
  for (const z of Object.values(S.zones)) {
    if (z.owner !== pid || !ZT[z.type].res) continue;
    for (const w of z.workers) {
      if (!w.job || S.zones[w.job].owner === pid) continue;
      const cur = findRoute(S, z, S.zones[w.job], pid, cache); const curV = cur ? jobValue(S, pid, S.zones[w.job], cur) : -9;
      for (const jid of ownJobs) {
        if (open[jid] <= 0 || selfCapBlocks(z, jid, w)) continue; const r = findRoute(S, z, S.zones[jid], pid, cache); if (!r) continue;
        if (jobValue(S, pid, S.zones[jid], r) > curV + 0.4) { open[w.job] = (open[w.job] || 0) + 1; w.job = jid; w.route = r.route; open[jid]--; touch(S); break; }
      }
    }
  }
}
// ===== Actions: preview (legality + cost) and apply =====
function addTag(m, d, t) { (m[d] = m[d] || new Set()).add(t); }
function boardReact(S, pid, d, tags) { // returns {net, pleased:[], angered:[]}
  const pleased = [], angered = [];
  for (const b of S.councils[d]) {
    let pl = false, an = false;
    for (const t of tags) { const r = REACT[t]; if (!r || !r[b]) continue; if (r[b] > 0) pl = true; else an = true; }
    if (an) angered.push(b); else if (pl) pleased.push(b);
  }
  let net = Math.max(-1, Math.min(1, pleased.length - angered.length));
  if (tags.has('bike_prot') && S.councils[d].includes('BP')) net = 1; // E3 uncancellable
  return { net, pleased, angered };
}
function tagsAnger(S, d, tags) { return S.councils[d].some(b => [...tags].some(t => REACT[t] && REACT[t][b] < 0)); }
function standingMods(S, pid, tagMap, kind, out, opts) {
  // kind: 'build' (Build Transit / Zone / Upzone). Adds lines to out.breakdown, errors to out.errors.
  let mod = 0;
  for (const d in tagMap) {
    const s = S.players[pid].standing[d]; const angers = tagsAnger(S, d, tagMap[d]);
    if (s >= 3) { mod -= 2; out.breakdown.push([`Champion in ${DISTRICTS[d]}`, -2]); }
    else if (s === 2) { mod -= 1; out.breakdown.push([`Favored in ${DISTRICTS[d]}`, -1]); }
    else if (s === -2) { mod += 2; out.breakdown.push([`Opposed in ${DISTRICTS[d]}`, 2]); if (angers) { mod += 2; out.breakdown.push([`public-hearing cost (angers a ${DISTRICTS[d]} board)`, 2]); } }
    else if (s <= -3) {
      mod += 2; out.breakdown.push([`Blocked in ${DISTRICTS[d]}`, 2]);
      if (angers && !(opts && opts.variance)) out.errors.push(`Permit denied: you are Blocked in ${DISTRICTS[d]} and this angers its ${S.councils[d].map(b => BOARDS[b]).join(' / ')} board`);
    }
  }
  return mod;
}
function applyReactions(S, pid, tagMap, label) {
  for (const d in tagMap) {
    const r = boardReact(S, pid, +d, tagMap[d]);
    const why = `${label}: ` + (r.pleased.length ? 'pleases ' + r.pleased.join('+') : '') + (r.pleased.length && r.angered.length ? ', ' : '') + (r.angered.length ? 'angers ' + r.angered.join('+') : '') + (!r.pleased.length && !r.angered.length ? 'no reaction' : '');
    if (r.net) moveStanding(S, pid, +d, r.net, why);
  }
}
function finalizeCost(out, base, mod) {
  out.base = base; out.mod = mod;
  out.cost = base + mod;
  if (out.paid && out.cost < 1) { out.breakdown.push(['minimum $1 per paid action', 1 - out.cost]); out.cost = 1; }
  if (!out.paid) out.cost = Math.max(0, out.cost);
}
// ---------- TRANSIT ----------
function perActionLimits(S, pid, mode) {
  const c = S.players[pid].con;
  switch (mode) {
    case 'bike': return { edges: c === 'C2' ? 10 : c === 'C6' ? 3 : 6 };
    case 'road': return { edges: c === 'C1' ? 6 : 4 };
    case 'hwy': return { edges: c === 'C6' ? 6 : c === 'C2' ? 2 : 4 };
    case 'lr': return { edges: c === 'C4' ? 6 : 4, stations: c === 'C4' ? 3 : 2 };
    case 'hr': return { edges: c === 'C5' ? 8 : 6, stations: 3 };
    case 'bus': return { add: c === 'C3' ? 4 : 2, len: c === 'C3' ? 6 : 8 };
  }
  return {};
}
function bridgeSurcharge(S, pid, base, mode) {
  const c = S.players[pid].con; let v = base;
  if (c === 'C2' && mode === 'bike') return 0;
  if (c === 'C7' && (mode === 'road' || mode === 'lr')) v += 2;
  if (hasEng(S, pid, 'E10')) v += 2;
  if (c === 'C8') v = Math.floor(v / 2);
  return v;
}
function connectedTo(newEdges, anchorNodes) { // every new edge reachable from anchors through new edges
  const nodesOf = e => edgeNodes(e); const reached = new Set(anchorNodes); const left = new Set(newEdges); let progress = true;
  if (!anchorNodes.length && newEdges.length) { const [a, b] = nodesOf(newEdges[0]); reached.add(a); reached.add(b); left.delete(newEdges[0]); }
  while (progress) { progress = false; for (const e of [...left]) { const [a, b] = nodesOf(e); if (reached.has(a) || reached.has(b)) { reached.add(a); reached.add(b); left.delete(e); progress = true; } } }
  return left.size === 0;
}
function ownNodes(S, pid, mode) { const s = new Set(); for (const e in S.edges) if (S.edges[e][mode] === pid) edgeNodes(e).forEach(n => s.add(n)); return [...s]; }
function lineGraphDist(edges, a) { const adj = {}; for (const e of edges) { const [x, y] = edgeNodes(e); (adj[x] = adj[x] || []).push(y); (adj[y] = adj[y] || []).push(x); } const d = { [a]: 0 }; const q = [a]; while (q.length) { const n = q.shift(); for (const m of adj[n] || []) if (d[m] === undefined) { d[m] = d[n] + 1; q.push(m); } } return d; }
function linesOf(S, pid, modes) { return Object.values(S.lines).filter(L => L.owner === pid && modes.includes(L.mode)); }
function buildMarkers(S, pid, mode, isBridge) {
  const c = S.players[pid].con;
  if (isBridge && c === 'C8') return 0;
  switch (mode) {
    case 'bike': case 'road': return isBridge ? (mode === 'bike' && c === 'C2' ? 0 : 1) : 0;
    case 'lr': return c === 'C4' ? 0 : 1;
    case 'hwy': return 0;
    case 'hr': if (c === 'C5') return S.era >= 3 ? 0 : 1; return S.era >= 3 ? 1 : 2;
  }
  return 0;
}
function previewTransit(S, pid, spec) {
  const out = { ok: false, errors: [], breakdown: [], tags: {}, cost: 0, paid: true, kind: 'transit', spec };
  const p = S.players[pid]; const mode = spec.mode; const edges = (spec.edges || []).slice(); const lim = perActionLimits(S, pid, mode);
  const vance = mayorIs(S, 'M2') ? -1 : 0; let base = 0;
  const free = spec.free; // 'BKS' | 'SHF' | 'HEX'
  if (!MODES[mode]) out.errors.push(`${mode} is not a v0.7 transit mode`);
  if (MODES[mode] && !availableEra(S, pid, MODES[mode].era, mode)) out.errors.push(`${MODES[mode].name} is not available until Era ${MODES[mode].era} (or a Pilot Program).`);
  if (p.bonus && spec.bonus) {
    if (p.bonus.mode && p.bonus.mode !== mode) out.errors.push(`Bonus build must be ${p.bonus.mode}`);
    if (p.bonus.except && p.bonus.except === mode) out.errors.push(`Twin Crews: second build must be a different mode`);
  }
  for (const e of edges) if (!BOARD.edges.includes(e)) out.errors.push('bad edge ' + e);
  if (new Set(edges).size !== edges.length) out.errors.push('Duplicate edges');
  const bridgeEdges = edges.filter(e => BOARD.crossing.has(e));
  const tagE = (e, t) => edgeDistricts(e).forEach(d => addTag(out.tags, d, t));
  const tagN = (n, t) => nodeDistricts(n).forEach(d => addTag(out.tags, d, t));
  const ex = e => S.edges[e] || {};
  out.markers = []; // [{key, n}]
  if (mode === 'bike' || mode === 'road') {
    let max = (spec.bonus && p.bonus && p.bonus.max) || lim.edges; if (free === 'BKS') max = 4;
    if (!edges.length) out.errors.push('Select at least one edge');
    if (edges.length > max) out.errors.push(`At most ${max} edges per action`);
    for (const e of edges) {
      if (ex(e)[mode] !== undefined) out.errors.push(`${edgeName(e)} already has a ${mode}`);
      if (BOARD.crossing.has(e) && !BOARD.bridgeSites.includes(e)) out.errors.push(`${edgeName(e)} crosses the river away from a Bridge Site`);
      if (mode === 'bike' && ex(e).hwy !== undefined) out.errors.push(`Bike lanes cannot share an edge with a freight road`);
    }
    if (mode === 'bike') {
      if (!connectedTo(edges, ownNodes(S, pid, 'bike'))) out.errors.push('Bike edges must connect to each other or your existing bike network');
      const n = edges.length;
      if (free === 'BKS') { out.paid = false; out.breakdown.push(['Bike Share permit: free', 0]); }
      else {
        let c = p.eng === 'E3' ? n : mayorIs(S, 'M3') ? Math.ceil(n / 3) : Math.ceil(n / 2);
        out.breakdown.push([`${n} bike edges (${p.eng === 'E3' ? '$1/edge Protected Lanes' : mayorIs(S, 'M3') ? '$1 per 3, Vision Zero' : '$1 per 2'})`, c]); base += c;
        const onRoad = edges.filter(e => ex(e).road !== undefined);
        if (mayorIs(S, 'M4') && onRoad.length) { base += 1; out.breakdown.push(['Dobbs: bike lanes on road edges', 1]); }
      }
      for (const e of edges) tagE(e, p.eng === 'E3' ? 'bike_prot' : ex(e).road !== undefined ? 'bike_on_road' : 'bike');
      if (p.eng === 'E3') for (const e of edges) tagE(e, 'bike');
    } else {
      const per = p.eng === 'E7' ? 2 : 1; base += per * edges.length; out.breakdown.push([`${edges.length} road edges × $${per}`, per * edges.length]);
      if (p.eng === 'E2' && edges.length) { base += 1; out.breakdown.push(['Flowline (+$1 per road action)', 1]); }
      if (mayorIs(S, 'M3') && edges.length >= 3) { base += 1; out.breakdown.push(['Vision Zero: 3+ road edges', 1]); }
      const t = edges.length >= 3 && p.eng !== 'E7' ? 'road3' : 'road12'; for (const e of edges) tagE(e, t);
    }
    for (const e of bridgeEdges) { const s = bridgeSurcharge(S, pid, mode === 'bike' ? 2 : 4, mode); if (free !== 'BKS' && s) { base += s; out.breakdown.push([`${BOARD.bridgeNames[e] || 'bridge'} surcharge`, s]); } if (hasEng(S, pid, 'E10')) tagE(e, 'shoreline'); }
    for (const e of edges) { const m = buildMarkers(S, pid, mode, BOARD.crossing.has(e)); if (m) out.markers.push({ key: opKey('e', e, mode), n: m }); }
  }
  else if (mode === 'hwy') { // v0.7 FREIGHT ROAD: upgrade your own road edges; no interchanges, no build time
    let maxE = lim.edges; if (free === 'SHF') maxE = Math.min(maxE, 2);
    if (!edges.length) out.errors.push('Select road edges to upgrade to freight');
    if (edges.length > maxE) out.errors.push(`At most ${maxE} freight edges per action`);
    for (const e of edges) {
      const x = ex(e);
      if (x.road !== pid) out.errors.push(`${edgeName(e)}: freight upgrades need your own road edge`);
      if (x.hwy !== undefined) out.errors.push(`${edgeName(e)} is already freight`);
      if (x.bike !== undefined) out.errors.push(`Freight roads cannot share an edge with a bike lane`);
      if (x.lr !== undefined && !hasEng(S, x.lr, 'E8')) out.errors.push(`Freight roads cannot share an edge with light rail`);
    }
    const anchors = ownNodes(S, pid, 'hwy').concat(BOARD.connectors);
    if (edges.length && !connectedTo(edges, anchors)) out.errors.push('Freight must start at an Outside Market connector (M) or extend your freight road');
    let pe = (p.con === 'C6' ? 1 : 2) + (p.eng === 'E1' ? 1 : 0) + (mayorIs(S, 'M4') ? -1 : 0); pe = Math.max(1, pe);
    if (free === 'SHF') { out.paid = false; out.breakdown.push(['State Freight Funds: free upgrade', 0]); }
    else if (edges.length) { base += pe * edges.length; out.breakdown.push([`${edges.length} freight upgrades × $${pe}`, pe * edges.length]); }
    for (const e of edges) tagE(e, p.eng === 'E1' ? 'hwy_edge_quiet' : 'hwy_edge');
  }
  else if (mode === 'lr' || mode === 'hr') {
    const st = spec.stations || []; const L = linesOf(S, pid, [mode])[0];
    if (edges.length > lim.edges) out.errors.push(`At most ${lim.edges} edges per action`);
    if (st.length > lim.stations) out.errors.push(`At most ${lim.stations} stations per action`);
    if (!edges.length && !st.length) out.errors.push('Select track edges and/or stations');
    for (const e of edges) {
      const x = ex(e);
      if (x[mode] !== undefined) out.errors.push(`${edgeName(e)} already has ${MODES[mode].name}`);
      if (mode === 'lr') {
        if (x.hwy !== undefined && p.eng !== 'E8') out.errors.push(`Light rail cannot share a freight edge`);
        if (BOARD.crossing.has(e)) { if (p.eng !== 'E8' && !BOARD.bridgeSites.includes(e)) out.errors.push(`Light rail crosses only at Bridge Sites`); }
      }
    }
    const lineEdges = (L ? L.edges : []).concat(edges);
    if (L) { if (!connectedTo(edges, [...new Set(L.edges.flatMap(edgeNodes))].concat(L.stops))) out.errors.push('New track must extend your existing line'); }
    else if (!connectedTo(edges, [])) out.errors.push('Track edges must be connected');
    const lineNodes = new Set(lineEdges.flatMap(edgeNodes));
    const allSt = (L ? L.stops : []).concat(st);
    for (const n of st) {
      if (!lineNodes.has(n)) out.errors.push(`Station ${nodeName(n)} must be on the line`);
      if (L && L.stops.includes(n)) out.errors.push(`Station already at ${nodeName(n)}`);
    }
    for (const n of st) { const d = lineGraphDist(lineEdges, n); for (const o of allSt) if (o !== n && d[o] !== undefined && d[o] < 2) out.errors.push(`Stations must be at least 2 edges apart (${nodeName(n)})`); }
    if (!L && lineEdges.length && allSt.length === 0) out.breakdown.push(['(no stations yet — riders need 2 stations)', 0]);
    let pe = mode === 'lr' ? (p.eng === 'E8' ? 3 : 2) : 4; let ps = (mode === 'lr' ? 2 : 4) + (p.eng === 'E5' ? 2 : 0) + (p.eng === 'E9' ? 1 : 0) + vance;
    if (mayorIs(S, 'M10')) pe -= 1; if (eventIs(S, 11)) pe -= 1; pe = Math.max(0, pe);
    if (edges.length) { base += pe * edges.length; out.breakdown.push([`${edges.length} track edges × $${pe}`, pe * edges.length]); }
    if (st.length) { base += ps * st.length; out.breakdown.push([`${st.length} stations × $${ps}`, ps * st.length]); }
    for (const e of bridgeEdges) {
      const s = mode === 'hr' ? 5 : bridgeSurcharge(S, pid, 5, 'lr');
      base += s; out.breakdown.push([mode === 'hr' ? 'tunnel' : 'light rail bridge', s]);
      if (hasEng(S, pid, 'E10') && mode === 'lr') tagE(e, 'shoreline');
    }
    if (spec.grant) { base -= 6; out.breakdown.push(['Federal Transit Grant', -6]); }
    if (mode === 'lr') for (const e of edges) if (ex(e).road !== undefined && p.eng !== 'E8') tagE(e, 'lr_on_road');
    for (const n of st) tagN(n, 'station');
    for (const e of edges) { const m = buildMarkers(S, pid, mode, BOARD.crossing.has(e) && mode === 'lr'); if (m) out.markers.push({ key: opKey('e', e, mode), n: m }); }
    out.lineId = L ? L.id : null;
    for (const n of st) { const m = buildMarkers(S, pid, mode, false); if (m) out.markers.push({ key: 'S:' + n, n: m }); }
  }
  else if (mode === 'bus') {
    const st = spec.stations || []; const L = spec.line ? S.lines[spec.line] : null;
    if (spec.line && (!L || L.owner !== pid || L.mode !== 'bus')) out.errors.push('Not your bus route');
    if (!L && linesOf(S, pid, ['bus']).length >= 2) out.errors.push('Line limit: you already run 2 bus routes');
    const sv = svc(S);
    for (const e of edges) if (!sv.E.road.has(e)) out.errors.push(`Bus routes run on existing operational roads (${edgeName(e)})`);
    const routeEdges = (L ? L.edges : []).concat(edges.filter(e => !L || !L.edges.includes(e)));
    if (routeEdges.length > lim.len) out.errors.push(`Route at most ${lim.len} edges`);
    if (!connectedTo(routeEdges, [])) out.errors.push('Route edges must be connected');
    const rn = new Set(routeEdges.flatMap(edgeNodes));
    const allSt = (L ? L.stops : []).concat(st);
    if (allSt.length > 4) out.errors.push('At most 4 stops per route');
    for (const n of st) { if (!rn.has(n)) out.errors.push(`Stop ${nodeName(n)} must be on the route`); if (L && L.stops.includes(n)) out.errors.push('Stop exists'); }
    for (const n of st) { const d = lineGraphDist(routeEdges, n); for (const o of allSt) if (o !== n && d[o] !== undefined && d[o] < 2) out.errors.push(`Stops must be at least 2 edges apart`); }
    if (!L) { if (!st.length) out.errors.push('A new route needs at least 1 stop'); if (!edges.length) out.errors.push('Select route edges along roads'); }
    else if (edges.length + st.length > lim.add) out.errors.push(`Add at most ${lim.add} stops/edges per action`);
    if (L && L.brt && edges.length) out.errors.push('BRT routes cannot be changed');
    const ps = 1 + (p.eng === 'E4' ? 1 : 0) + vance;
    if (!L) { base += 2; out.breakdown.push(['open route', 2]); if (p.con === 'C4') { base += 1; out.breakdown.push(['Ironline drawback', 1]); } }
    if (st.length) { base += ps * st.length; out.breakdown.push([`${st.length} stops × $${ps}`, ps * st.length]); }
    for (const n of st) tagN(n, 'bus'); if (!st.length) for (const e of edges) tagE(e, 'bus');
    out.lineId = L ? L.id : null; out.routeEdges = routeEdges;
  }
  else if (mode === 'shuttle' || mode === 'river') {
    // spec.ops: [{op:'open', docks:[...]}, {op:'dock', line, node}, {op:'boat', line}]
    const ops = spec.ops || []; const maxOps = p.con === 'C7' ? 2 : 1;
    if (!ops.length) out.errors.push('Choose a ferry build');
    if (ops.length > maxOps) out.errors.push(`At most ${maxOps} ferry build(s) per action`);
    const dockCost = 2 + (p.eng === 'E6' ? 2 : 0) + vance;
    const docksTaken = n => Object.values(S.lines).some(L => (L.mode === 'shuttle' || L.mode === 'river') && L.owner !== pid && L.stops.includes(n));
    let opens = 0;
    for (const o of ops) {
      if (o.op === 'open') {
        opens++;
        if (p.con === 'C8') out.errors.push('Halvorsen: you may never open ferry routes');
        if (linesOf(S, pid, ['shuttle', 'river']).length + opens > 2) out.errors.push('Line limit: 2 ferry routes');
        const kind = o.kind || mode; const d = o.docks || [];
        if (kind === 'river') out.errors.push('v0.7: River Lines are merged into the Ferry (add docks to a ferry route)');
        for (const n of d) { if (!BOARD.riverbank.has(n)) out.errors.push(`${nodeName(n)} is not a riverbank intersection`); if (docksTaken(n)) out.errors.push(`Another player's dock is at ${nodeName(n)}`); }
        if (kind === 'shuttle') {
          if (d.length !== 2) out.errors.push('A new Ferry opens with exactly 2 docks');
          else { if (BOARD.nodeBank(d[0]) === BOARD.nodeBank(d[1])) out.errors.push('Shuttle docks must be on opposite banks'); if (channelDist(d[0], d[1]) > 2) out.errors.push('Shuttle docks at most 2 river lots apart'); }
          base += 2 + dockCost * d.length; out.breakdown.push(['open Ferry', 2], [`${d.length} docks × $${dockCost}`, dockCost * d.length]);
        } else {
          if (d.length < 2 || d.length > 4) out.errors.push('A River Line has 2–4 docks');
          for (let i = 1; i < d.length; i++) if (channelDist(d[i - 1], d[i]) > 6) out.errors.push('Consecutive River Line docks at most 6 river lots apart');
          base += 3 + dockCost * d.length; out.breakdown.push(['open River Line', 3], [`${d.length} docks × $${dockCost}`, dockCost * d.length]);
        }
        if (new Set(d).size !== d.length) out.errors.push('Duplicate dock');
        for (const n of d) { tagN(n, 'ferry'); if (p.eng === 'E10') tagN(n, 'shoreline'); }
      } else if (o.op === 'dock') {
        const L = S.lines[o.line];
        if (!L || L.owner !== pid || !(L.mode === 'shuttle' || L.mode === 'river')) out.errors.push('Docks can be added to your ferry route only');
        else { if (L.stops.length >= 4) out.errors.push('A ferry route has at most 4 docks'); if (!BOARD.riverbank.has(o.node)) out.errors.push('Not a riverbank intersection'); if (docksTaken(o.node)) out.errors.push('Occupied by a rival dock'); if (L.stops.includes(o.node)) out.errors.push('Dock exists'); if (channelDist(L.stops[L.stops.length - 1], o.node) > 6) out.errors.push('Too far from the last dock (max 6 river lots)'); }
        base += dockCost; out.breakdown.push(['add dock', dockCost]); tagN(o.node, 'ferry'); if (p.eng === 'E10') tagN(o.node, 'shoreline');
      } else if (o.op === 'boat') {
        const L = S.lines[o.line];
        if (!L || L.owner !== pid || !(L.mode === 'shuttle' || L.mode === 'river')) out.errors.push('Not your ferry route');
        else { if (L.boats + ops.filter(x => x.op === 'boat' && x.line === o.line).length > 3) out.errors.push('Boat limit reached (3)'); tagN(L.stops[0], 'ferry'); }
        const bc = p.con === 'C7' ? 2 : 3; base += bc; out.breakdown.push(['add boat', bc]);
      }
    }
    if (spec.grant) { base -= 6; out.breakdown.push(['Federal Transit Grant', -6]); }
  }
  if (spec.grant && !p.permits.includes('FTG')) out.errors.push('You do not hold a Federal Transit Grant');
  if (spec.grant && !['lr', 'hr', 'shuttle', 'river'].includes(mode)) out.errors.push('Grant applies to light rail, heavy rail or ferry builds');
  if (free === 'SHF' && !(S.flags.stateHwy || []).includes(pid)) out.errors.push('State Highway Funds not available to you');
  const mod = standingMods(S, pid, out.tags, 'build', out);
  finalizeCost(out, base, mod);
  if (out.cost > p.cash) out.errors.push(`Costs $${out.cost}; you have $${p.cash}`);
  out.ok = out.errors.length === 0;
  return out;
}
function nextLetter(S, pid, modes) { const used = linesOf(S, pid, modes).map(L => L.letter); return ['A', 'B'].find(l => !used.includes(l)) || 'A'; }
function applyTransit(S, pid, pv) {
  const spec = pv.spec; const mode = spec.mode; const p = S.players[pid];
  if (pv.cost) money(S, pid, -pv.cost, `${MODES[mode].name} build`);
  if (spec.grant) { p.permits.splice(p.permits.indexOf('FTG'), 1); }
  const keys = [];
  const markerFor = k => (pv.markers.find(m => m.key === k) || {}).n || 0;
  let desc = '';
  if (mode === 'bike' || mode === 'road' || mode === 'hwy') {
    for (const e of spec.edges || []) { S.edges[e] = S.edges[e] || {}; S.edges[e][mode] = pid; }
    for (const n of spec.ics || []) S.ics[n] = pid;
    desc = `${(spec.edges || []).length} ${MODES[mode].name.toLowerCase()} edge(s)${(spec.ics || []).length ? ' + interchange ' + spec.ics.map(nodeName).join(',') : ''}`;
  } else if (mode === 'lr' || mode === 'hr') {
    let L = linesOf(S, pid, [mode])[0];
    if (!L) { const id = 'L' + (S.nextId++); L = S.lines[id] = { id, owner: pid, mode, edges: [], stops: [], boats: 0 }; }
    for (const e of spec.edges || []) { S.edges[e] = S.edges[e] || {}; S.edges[e][mode] = pid; L.edges.push(e); }
    for (const n of spec.stations || []) L.stops.push(n);
    pv.markers.forEach(m => { if (m.key.startsWith('S:')) m.key = opKey('s', L.id, m.key.slice(2)); });
    desc = `${MODES[mode].name}: ${(spec.edges || []).length} edges, stations ${(spec.stations || []).map(nodeName).join(', ') || 'none'}`;
  } else if (mode === 'bus') {
    let L = spec.line ? S.lines[spec.line] : null;
    if (!L) { const id = 'L' + (S.nextId++); L = S.lines[id] = { id, owner: pid, mode: 'bus', letter: nextLetter(S, pid, ['bus']), edges: [], stops: [], boats: 0 }; }
    for (const e of spec.edges || []) if (!L.edges.includes(e)) L.edges.push(e);
    for (const n of spec.stations || []) L.stops.push(n);
    desc = `${lineLabel(S, L)}: stops ${L.stops.map(nodeName).join(', ')}`;
  } else {
    for (const o of spec.ops) {
      if (o.op === 'open') { const id = 'L' + (S.nextId++); const kind = o.kind || mode; S.lines[id] = { id, owner: pid, mode: kind, letter: nextLetter(S, pid, ['shuttle', 'river']), edges: [], stops: o.docks.slice(), boats: 1 }; desc += `${lineLabel(S, S.lines[id])} docks ${o.docks.map(nodeName).join(' ↔ ')}. `; }
      if (o.op === 'dock') { S.lines[o.line].stops.push(o.node); desc += `dock ${nodeName(o.node)}. `; }
      if (o.op === 'boat') { S.lines[o.line].boats++; desc += `boat on ${lineLabel(S, S.lines[o.line])}. `; }
    }
  }
  // construction
  const byN = {}; for (const m of pv.markers) (byN[m.n] = byN[m.n] || []).push(m.key);
  for (const n in byN) addProject(S, pid, byN[n], +n, `${p.name} ${MODES[mode].name}`);
  log(S, `${p.name} builds ${desc}`, pid, 'action');
  applyReactions(S, pid, pv.tags, MODES[mode].name);
  touch(S);
}
// ---------- ZONING ----------
function zoneReqCheck(S, pid, type, lots, opts) { // returns list of unmet requirement strings
  const bad = []; const R = roadServed(S, lots), B = bikeServed(S, lots), Tz = transitServed(S, lots);
  const e3 = e3Served(S, lots);
  switch (type) {
    case 'SFD': if (!R) bad.push('needs a road on its border'); break;
    case 'DUP': case 'CC': case 'TH': case 'NC': if (!R && !B) bad.push('needs a road or bike edge on its border'); break;
    case 'MP': if (!R && !B) bad.push('needs a road or bike edge'); if (!B && !Tz) bad.push('needs a bike edge or transit service'); break;
    case 'MR': if (!Tz && !e3) bad.push('needs transit service (bus stop, dock or station within radius 1)'); break;
    case 'HR': if (!railR1(S, lots) && !(lrZone(S, lots) && S.era >= 2)) bad.push('needs a light or heavy rail station within radius 1'); break;
    case 'MU': if (!Tz && !B) bad.push('needs transit service or a bike edge'); break;
    case 'OF': {
      const dt = lots.every(l => lotDistrict(l) === DOWNTOWN);
      if (!railR1(S, lots)) bad.push('needs a light rail station within radius 1'); break; // v0.7: any district
    }
    case 'LI': if (!R) bad.push('needs a road on its border'); break;
    case 'HI': if (!R) bad.push('needs a road on its border'); if (!freightOnBorder(S, lots).length && !portAccess(S, lots).length) bad.push('needs a market-connected freight road on its border, or Port access'); break;
  }
  return bad;
}
function typeCostMods(S, pid, type, lots, out, isUpzone) {
  let m = 0; const add = (why, v) => { m += v; out.breakdown.push([why, v]); };
  const wf = isWaterfront(lots); const T = ZT[type];
  if (mayorIs(S, 'M1') && (type === 'SFD' || type === 'DUP')) add('Reyes: SFD/Duplex', -1);
  if (mayorIs(S, 'M1') && isUpzone && T.rung >= 5) add('Reyes: upzone into Mid-Rise+', 1);
  if (mayorIs(S, 'M9') && ['CC', 'TH', 'MP'].includes(type)) add('Sorensen: Missing Middle', -1);
  if (mayorIs(S, 'M9') && type === 'SFD') add('Sorensen: SFD', 1);
  if (mayorIs(S, 'M6') && type === 'OF') add('Bell: Office', -2);
  if (S.players[pid].con === 'C5' && ['MR', 'HR', 'OF'].includes(type)) add('Tower Crane Company', -2);
  if (mayorIs(S, 'M7') && type === 'HI') add('Okonkwo: Heavy Industrial', 2);
  if (mayorIs(S, 'M7') && type === 'PK') add('Okonkwo: Parks', -1);
  if (mayorIs(S, 'M8') && T.ind) add('Pappas: industry', -1);
  if (mayorIs(S, 'M5') && T.ind && wf) add('Ward: waterfront industry', 3);
  if (eventIs(S, 2) && ['CC', 'TH', 'MP'].includes(type)) add('Missing Middle Initiative', -2);
  if (eventIs(S, 12) && type === 'OF' && !S.flags.techUsed) add('Tech Campus: first Office', -4);
  if (hasEng(S, pid, 'E10') && wf) add('Living Shoreline: waterfront zone', 1);
  return m;
}
function lotsFree(S, pid, lots, errs) {
  for (const l of lots) {
    if (!BOARD.lots.includes(l)) { errs.push('bad lot'); continue; }
    if (BOARD.river.has(l)) errs.push(`${lotName(l)} is river`);
    if (S.lotZone[l]) errs.push(`${lotName(l)} is occupied`);
    if (S.reserves[l] && S.reserves[l].pid !== pid) errs.push(`${lotName(l)} is Reserved by ${S.players[S.reserves[l].pid].name}`);
    if (S.hqSites && S.hqSites.includes(l)) errs.push('Reserved site');
  }
}
function previewZone(S, pid, spec) {
  const out = { ok: false, errors: [], breakdown: [], tags: {}, paid: true, kind: 'zone', spec };
  const p = S.players[pid]; const type = spec.type; const T = ZT[type]; const lots = spec.lots || [];
  if (!T || !ZONABLE.includes(type)) { out.errors.push('Unknown zone type'); return out; }
  if (lots.length !== T.lots) out.errors.push(`${T.name} covers ${T.lots} lot(s)`);
  if (lots.length === 2 && !lotAdj(lots[0]).includes(lots[1])) out.errors.push('Lots must be orthogonally adjacent');
  lotsFree(S, pid, lots, out.errors);
  if (!availableEra(S, pid, T.era, type)) out.errors.push(`${T.name} is not available until Era ${T.era}`);
  if (spec.permit === 'CLT' && !['CC', 'MP'].includes(type)) out.errors.push('Community Land Trust: Cottage Court or Multiplex only');
  if (spec.permit && !p.permits.includes(spec.permit)) out.errors.push('You do not hold that permit');
  if (spec.permit === 'PRP' && (type !== 'OF' || lots.some(l => lotDistrict(l) === DOWNTOWN))) out.errors.push('Prime Parcel: Office outside Downtown');
  if (lots.length && out.errors.length === 0) out.errors.push(...zoneReqCheck(S, pid, type, lots, { prime: spec.permit === 'PRP' }).map(s => `${T.name} ${s}`));
  let base = spec.permit === 'CLT' ? 0 : T.cost; out.breakdown.push([spec.permit === 'CLT' ? 'Community Land Trust' : T.name, base]);
  if (!(eventIs(S, 8) && type === 'PK' && isWaterfront(lots)) && !(mayorIs(S, 'M5') && type === 'PK' && isWaterfront(lots))) {
    if (spec.permit !== 'CLT') base += typeCostMods(S, pid, type, lots, out, false);
  } else { const v = eventIs(S, 8) ? 0 : 1; out.breakdown.push([eventIs(S, 8) ? 'Riverfront Cleanup: waterfront Park free' : 'Ward: waterfront Park $1', v - base]); base = v; if (!v) out.paid = false; }
  const dtLots = lots.filter(l => lotDistrict(l) === DOWNTOWN).length;
  if (dtLots && !mayorIs(S, 'M6')) { base += 2 * dtLots; out.breakdown.push(['Downtown lot premium', 2 * dtLots]); }
  if (dtLots && mayorIs(S, 'M6')) out.breakdown.push(['Bell waives Downtown premium', 0]);
  const d = lotDistrict(lots[0] || '0:0');
  addTag(out.tags, d, 'z_' + type);
  if (T.res && isWaterfront(lots)) addTag(out.tags, d, 'wf_res');
  if (T.ind && isWaterfront(lots)) addTag(out.tags, d, 'wf_ind');
  if (lots.length === 2 && lotDistrict(lots[1]) !== d) { addTag(out.tags, lotDistrict(lots[1]), 'z_' + type); }
  if (spec.permit === 'CLT') out.paid = base > 0;
  const mod = standingMods(S, pid, out.tags, 'build', out);
  finalizeCost(out, base, mod);
  if (out.cost > p.cash) out.errors.push(`Costs $${out.cost}; you have $${p.cash}`);
  out.ok = out.errors.length === 0; return out;
}
function newZone(S, pid, type, lots) {
  const id = 'Z' + (S.nextId++); const z = { id, seq: S.nextId, type, owner: pid, lots: lots.slice(), workers: [], decline: false, unemp: 0 };
  setWorkers(z); S.zones[id] = z; for (const l of lots) { S.lotZone[l] = id; delete S.reserves[l]; } touch(S); return z;
}
function hqPledgeProgress(S, pid, z, popGain) {
  if (!S.hq || S.hq.host !== pid || !S.hq.zid || S.hq.remaining <= 0 || S.hq.done) return;
  const hq = S.zones[S.hq.zid];
  if (!z.lots.some(a => hq.lots.some(b => lotCheb(a, b) <= 2))) return;
  S.hq.remaining = Math.max(0, S.hq.remaining - popGain);
  log(S, `HQ Housing Pledge: ${popGain} Pop counted, ${S.hq.remaining} remaining`, pid);
}
function applyZone(S, pid, pv) {
  const spec = pv.spec; const p = S.players[pid];
  if (pv.cost) money(S, pid, -pv.cost, `zone ${ZT[spec.type].name} ${spec.lots.map(lotName).join('–')}`);
  if (spec.permit) p.permits.splice(p.permits.indexOf(spec.permit), 1);
  const z = newZone(S, pid, spec.type, spec.lots);
  log(S, `${p.name} zones ${ZT[spec.type].name} on ${spec.lots.map(lotName).join('–')}`, pid, 'action');
  if (spec.type === 'OF' && eventIs(S, 12) && !S.flags.techUsed) { S.flags.techUsed = true; money(S, pid, 3, 'Tech Campus bonus'); }
  applyReactions(S, pid, pv.tags, ZT[spec.type].name);
  if (ZT[spec.type].res) hqPledgeProgress(S, pid, z, ZT[spec.type].pop);
  autoAssign(S, pid);
  return z;
}
// ---------- UPZONE ----------
function upzoneTargets(S, pid, z) {
  const T = ZT[z.type]; const out = [];
  if (z.landmark) return out;
  if (T.rung !== undefined) {
    const tod = lrZone(S, z.lots) || hrZone(S, z.lots);
    const champ = S.players[pid].standing[zoneDistrict(z)] >= 3 && !S.players[pid].fastTrackUsed;
    if (LADDER[T.rung + 1]) out.push({ to: LADDER[T.rung + 1], rungs: 1 });
    if (LADDER[T.rung + 2] && (tod || champ)) out.push({ to: LADDER[T.rung + 2], rungs: 2, tod, fast: !tod && champ });
  }
  if (z.type === 'NC') out.push({ to: 'MU', rungs: 1 });
  if (z.type === 'MU') out.push({ to: 'OF', rungs: 1 });
  if (z.type === 'LI') { out.push({ to: 'HI', rungs: 1 }); out.push({ to: 'NC', rungs: 1, brown: true }); out.push({ to: 'MU', rungs: 1, brown: true }); }
  return out;
}
function previewUpzone(S, pid, spec) {
  const out = { ok: false, errors: [], breakdown: [], tags: {}, paid: true, kind: 'upzone', spec };
  const p = S.players[pid]; const z = S.zones[spec.zid];
  if (!z || z.owner !== pid) { out.errors.push('Choose one of your zones'); return out; }
  const tg = upzoneTargets(S, pid, z).find(t => t.to === spec.to);
  if (!tg) { out.errors.push(`Cannot upzone ${ZT[z.type].name} to ${ZT[spec.to] ? ZT[spec.to].name : spec.to}`); return out; }
  const NT = ZT[spec.to]; const newLots = z.type === 'SFD' ? [z.lots[0]] : z.lots;
  if (!availableEra(S, pid, NT.era, spec.to)) out.errors.push(`${NT.name} is not available until Era ${NT.era}`);
  const variance = spec.variance && p.permits.includes('VAR');
  if (spec.variance && !p.permits.includes('VAR')) out.errors.push('No Variance permit');
  if (variance && (spec.to === 'HR' || spec.to === 'OF' || tg.rungs > 1)) out.errors.push('Variance: one rung, not High-Rise/Office');
  if (!variance) out.errors.push(...zoneReqCheck(S, pid, spec.to, newLots).map(s => `${NT.name} ${s}`));
  const fast = tg.rungs === 2 && tg.fast;
  let base = NT.cost - ZT[z.type].cost; out.breakdown.push([`${ZT[z.type].abbr} → ${NT.abbr} (difference)`, base]);
  if (tg.brown) { base += 2; out.breakdown.push(['brownfield conversion', 2]); }
  const feeWaived = mayorIs(S, 'M12') || eventIs(S, 10) || fast;
  if (!feeWaived) { base += 1; out.breakdown.push(['permit fee', 1]); } else out.breakdown.push([fast ? 'Fast-track: no fee' : 'permit fee waived', 0]);
  if (p.con === 'C10') { base += 1; out.breakdown.push(['Twin Crews drawback', 1]); }
  base += typeCostMods(S, pid, spec.to, newLots, { breakdown: out.breakdown }, true);
  // remove waterfront +1 E10 double counting on upzone: keep simple (charged again)
  const d = zoneDistrict(z);
  if (eventIs(S, 13) && S.councils[d].includes('HO') && !(lrZone(S, z.lots) || hrZone(S, z.lots) || railR1(S, z.lots))) { base += 2; out.breakdown.push(['NIMBY Revolt', 2]); }
  if (spec.splitDuplex && z.type === 'SFD') {
    const l2 = z.lots[1]; if (!roadServed(S, [l2]) && !bikeServed(S, [l2])) out.errors.push('Lot split Duplex needs road/bike access'); else { base += 3; out.breakdown.push([`lot split: Duplex on ${lotName(l2)}`, 3]); addTag(out.tags, lotDistrict(l2), 'z_DUP'); }
  }
  addTag(out.tags, d, 'z_' + spec.to);
  if (NT.res && isWaterfront(newLots)) addTag(out.tags, d, 'wf_res');
  if (tg.rungs === 2) addTag(out.tags, d, 'two_rung');
  const mod = standingMods(S, pid, out.tags, 'build', out, { variance });
  finalizeCost(out, base, mod);
  if (out.cost > p.cash) out.errors.push(`Costs $${out.cost}; you have $${p.cash}`);
  out.rungs = tg.rungs; out.fast = fast; out.variance = variance;
  out.ok = out.errors.length === 0; return out;
}
function applyUpzone(S, pid, pv) {
  const spec = pv.spec; const p = S.players[pid]; const z = S.zones[spec.zid];
  const old = z.type; money(S, pid, -pv.cost, `upzone ${ZT[old].abbr}→${ZT[spec.to].abbr} ${lotName(z.lots[0])}`);
  if (pv.variance) p.permits.splice(p.permits.indexOf('VAR'), 1);
  if (pv.fast) p.fastTrackUsed = true;
  if (old === 'SFD') { const l2 = z.lots[1]; z.lots = [z.lots[0]]; delete S.lotZone[l2]; if (spec.splitDuplex) newZone(S, pid, 'DUP', [l2]); }
  z.type = spec.to; z.decline = false; setWorkers(z);
  // job zone shrinking? (LI->NC reduces slots) handled by validateCommutes
  log(S, `${p.name} upzones ${lotName(z.lots[0])}: ${ZT[old].name} → ${ZT[spec.to].name}${pv.rungs === 2 ? ' (two rungs' + (pv.fast ? ', Fast-track' : ', TOD') + ')' : ''}`, pid, 'action');
  applyReactions(S, pid, pv.tags, 'Upzone');
  if (ZT[spec.to].res) hqPledgeProgress(S, pid, z, ZT[spec.to].pop - (ZT[old].pop || 0) + (spec.splitDuplex ? 2 : 0));
  touch(S); validateCommutes(S); autoAssign(S, pid);
}
// ---------- OTHER ACTIONS ----------
function hasPresence(S, pid, d) {
  if (Object.values(S.zones).some(z => z.owner === pid && z.lots.some(l => lotDistrict(l) === d))) return true;
  for (const e in S.edges) { const x = S.edges[e]; if (['road', 'bike', 'hwy', 'lr', 'hr'].some(m => x[m] === pid) && edgeDistricts(e).includes(d)) return true; }
  if (Object.values(S.lines).some(L => L.owner === pid && L.stops.some(n => nodeDistricts(n).includes(d)))) return true;
  if (Object.entries(S.ics).some(([n, o]) => o === pid && nodeDistricts(n).includes(d))) return true;
  return false;
}
function previewSimple(S, pid, a) {
  const out = { ok: false, errors: [], breakdown: [], cost: 0, gain: 0, kind: a.type, spec: a }; const p = S.players[pid];
  switch (a.type) {
    case 'outreach': {
      if (p.outreachUsed) out.errors.push('Outreach is once per round');
      const d = a.district; if (d === undefined || d < 0 || d > 8) { out.errors.push('Choose a district'); break; }
      if (a.target === undefined || a.target === null) {
        let c = hasPresence(S, pid, d) ? 2 : 4; if (eventIs(S, 19)) c -= 1; out.cost = c; out.breakdown.push([`Community outreach in ${DISTRICTS[d]}${c >= 3 ? ' (no presence)' : ''}`, c]);
        if (p.standing[d] >= 3) out.errors.push('Already at +3');
      } else {
        if (a.target === pid || !S.players[a.target]) out.errors.push('Choose a rival');
        if (p.standing[d] < 1) out.errors.push(`Opposition needs your standing +1 or higher in ${DISTRICTS[d]}`);
        let c = 3 + (mayorIs(S, 'M12') ? 2 : 0) - (eventIs(S, 19) ? 1 : 0); out.cost = c; out.breakdown.push([`Opposition campaign vs ${S.players[a.target] ? S.players[a.target].name : '?'}`, c]);
      }
      break;
    }
    case 'finance':
      if (a.repay) { if (!p.bonds) out.errors.push('No Bonds to repay'); out.cost = 8; out.breakdown.push(['repay Bond', 8]); }
      else { if (p.bonds >= 3) out.errors.push('Max 3 Bonds'); out.gain = 8; out.breakdown.push(['take Bond', -8]); }
      break;
    case 'pilot': {
      out.errors.push('Pilot Programs were removed in v0.7');
      if (p.pilotUsed) out.errors.push('Pilot Program once per round');
      const k = a.key; const era = MODES[k] ? MODES[k].era : ZT[k] ? ZT[k].era : 0;
      if (!era) out.errors.push('Choose a mode or zone type');
      else if (era !== S.era + 1) out.errors.push('Pilot Programs unlock a next-era item');
      if (p.pilot.includes(k)) out.errors.push('Already unlocked');
      out.cost = 5; out.breakdown.push([`Pilot Program: ${MODES[k] ? MODES[k].name : ZT[k] ? ZT[k].name : k}`, 5]); break;
    }
    case 'consult': out.gain = (p.consultR === S.round ? 0 : 1) + (mayorIs(S, 'M11') ? 1 : 0); out.breakdown.push([p.consultR === S.round ? 'Consult (already used this round: $0)' : 'Consult', -out.gain]); break; // v0.7: $1 first Consult each round, then $0
    case 'program': {
      if (S.era < 3) out.errors.push('Era III programs start in Era III');
      if (a.prog !== 'brt') out.errors.push('v0.7: BRT is the only Era III program');
      if (a.prog === 'brt') { const L = S.lines[a.line]; if (!L || L.owner !== pid || L.mode !== 'bus') out.errors.push('Choose your bus route'); else { if (L.brt) out.errors.push('Already BRT'); out.cost = 3 * L.stops.length; out.breakdown.push([`BRT: ${L.stops.length} stops × $3`, out.cost]); } }
      else if (a.prog === 'protected') { if (ownedEdges(S, pid, 'bike') < 8) out.errors.push('Need 8 bike edges'); if (p.programs.protectedBike) out.errors.push('Already done'); out.cost = 4; out.breakdown.push(['Protected Bike Network', 4]); }
      else if (a.prog === 'fast') { const L = S.lines[a.line]; if (!L || L.owner !== pid || !(L.mode === 'shuttle' || L.mode === 'river')) out.errors.push('Choose your ferry route'); else if (L.fast) out.errors.push('Already fast'); out.cost = 3; out.breakdown.push(['Fast Ferries', 3]); }
      else if (a.prog === 'diet') {
        const es = a.edges || []; if (!es.length || es.length > 4) out.errors.push('Choose 1–4 of your road edges');
        for (const e of es) { const x = S.edges[e] || {}; if (x.road !== pid) out.errors.push('Not your road'); if (x.bike !== undefined || x.hwy !== undefined) out.errors.push('Edge already has bike/highway'); if (Object.values(S.lines).some(L => L.mode === 'bus' && L.edges.includes(e))) out.errors.push('A bus route uses this edge'); }
        out.breakdown.push(['Road Diet (free)', 0]); out.tags = {}; es.forEach(e => edgeDistricts(e).forEach(d => addTag(out.tags, d, 'road_diet')));
      }
      else if (a.prog === 'teardown') {
        const es = a.edges || []; if (!es.length || es.length > 2) out.errors.push('Choose 1–2 of your highway edges');
        for (const e of es) if (!S.edges[e] || S.edges[e].hwy !== pid) out.errors.push('Not your highway');
        out.cost = 2; out.breakdown.push(['Highway Teardown', 2]); out.tags = {}; es.forEach(e => edgeDistricts(e).forEach(d => addTag(out.tags, d, 'teardown')));
      } else out.errors.push('Unknown program');
      if (out.tags && Object.keys(out.tags).length) { const m = standingMods(S, pid, out.tags, 'build', out); out.cost = Math.max(out.cost ? 1 : 0, out.cost + m); }
      break;
    }
    default: out.errors.push('Unknown action');
  }
  if (out.cost > p.cash) out.errors.push(`Costs $${out.cost}; you have $${p.cash}`);
  out.ok = out.errors.length === 0; return out;
}
function applySimple(S, pid, pv) {
  const a = pv.spec; const p = S.players[pid];
  switch (a.type) {
    case 'outreach':
      p.outreachUsed = true; money(S, pid, -pv.cost, a.target === undefined || a.target === null ? `Outreach in ${DISTRICTS[a.district]}` : `Opposition campaign vs ${S.players[a.target].name}`);
      if (a.target === undefined || a.target === null) moveStanding(S, pid, a.district, 1, 'Community outreach');
      else moveStanding(S, a.target, a.district, -1, `Opposition campaign by ${p.name}`);
      break;
    case 'finance':
      if (a.repay) { p.bonds--; money(S, pid, -8, 'repay Bond'); } else { p.bonds++; money(S, pid, 8, 'take Bond'); }
      break;
    case 'pilot': p.pilotUsed = true; p.pilot.push(a.key); money(S, pid, -5, `Pilot Program (${a.key})`); break;
    case 'consult': money(S, pid, pv.gain, 'Consult'); p.consultR = S.round; break;
    case 'program':
      if (pv.cost) money(S, pid, -pv.cost, 'Era III program');
      if (a.prog === 'brt') { S.lines[a.line].brt = true; log(S, `${p.name} upgrades ${lineLabel(S, S.lines[a.line])} to BRT`, pid, 'action'); }
      if (a.prog === 'protected') { p.programs.protectedBike = true; log(S, `${p.name} completes a Protected Bike Network`, pid, 'action'); }
      if (a.prog === 'fast') { S.lines[a.line].fast = true; log(S, `${p.name} buys Fast Ferries`, pid, 'action'); }
      if (a.prog === 'diet') { for (const e of a.edges) { delete S.edges[e].road; S.edges[e].bike = pid; } log(S, `${p.name} Road Diet: ${a.edges.length} roads → bike lanes`, pid, 'action'); applyReactions(S, pid, pv.tags, 'Road Diet'); }
      if (a.prog === 'teardown') {
        for (const e of a.edges) delete S.edges[e].hwy;
        const lot = a.edges.flatMap(edgeLots).find(l => !BOARD.river.has(l) && !S.lotZone[l]);
        if (lot) newZone(S, pid, 'PK', [lot]);
        log(S, `${p.name} tears down ${a.edges.length} highway edge(s)${lot ? ' and opens a Park on ' + lotName(lot) : ''}`, pid, 'action'); applyReactions(S, pid, pv.tags, 'Highway Teardown');
      }
      touch(S); validateCommutes(S); break;
  }
  touch(S);
}
// ---------- DEMOLISH (free, once per turn) ----------
function previewDemolish(S, pid, a) {
  const out = { ok: false, errors: [], breakdown: [], cost: 0, tags: {}, kind: 'demolish', spec: a };
  out.errors.push('Demolish was removed in v0.7');
  if (a.zid) { const z = S.zones[a.zid]; if (!z || z.owner !== pid || z.type === 'HQ') out.errors.push('Choose one of your zones'); else if (slotsOf(S, z)) addTag(out.tags, zoneDistrict(z), 'demolish_job'); }
  else if (a.edge) { const x = S.edges[a.edge]; if (!x || x[a.mode] !== pid) out.errors.push('Not your piece'); if (a.mode === 'road' && Object.values(S.lines).some(L => L.mode === 'bus' && L.edges.includes(a.edge))) out.errors.push('A bus route runs on this road'); if (a.mode === 'lr' || a.mode === 'hr') out.errors.push('Rail lines cannot be moved or removed'); }
  else if (a.line) { const L = S.lines[a.line]; if (!L || L.owner !== pid) out.errors.push('Not your line'); else L.stops.forEach(n => nodeDistricts(n).forEach(d => addTag(out.tags, d, 'remove_transit'))); }
  else if (a.ic) { if (S.ics[a.ic] !== pid) out.errors.push('Not your interchange'); else nodeDistricts(a.ic).forEach(d => addTag(out.tags, d, 'remove_transit')); }
  else out.errors.push('Choose what to demolish');
  if (a.edge && !out.errors.length) edgeDistricts(a.edge).forEach(d => addTag(out.tags, d, 'remove_transit'));
  out.ok = out.errors.length === 0; return out;
}
function applyDemolish(S, pid, pv) {
  const a = pv.spec; const p = S.players[pid]; p.demolishUsed = true;
  if (a.zid) { const z = S.zones[a.zid]; for (const l of z.lots) delete S.lotZone[l]; delete S.zones[a.zid]; log(S, `${p.name} demolishes ${ZT[z.type].name} ${lotName(z.lots[0])} (no refund)`, pid, 'action'); }
  else if (a.edge) { delete S.edges[a.edge][a.mode]; log(S, `${p.name} demolishes ${a.mode} ${edgeName(a.edge)}`, pid, 'action'); }
  else if (a.line) { log(S, `${p.name} closes ${lineLabel(S, S.lines[a.line])}`, pid, 'action'); delete S.lines[a.line]; }
  else if (a.ic) { delete S.ics[a.ic]; log(S, `${p.name} removes interchange ${nodeName(a.ic)}`, pid, 'action'); }
  touch(S); applyReactions(S, pid, pv.tags, 'Demolish'); validateCommutes(S);
}
// ===== Game flow: setup, rounds, phases =====
const DEFAULT_OPTS = { victory: 'networth', nwRate: 1, bondValue: 8, naiveAI: false, popTarget: 85, cashTarget: 145, cashTarget2: 135, popMinForCash: 30, cashMinForPop: 10, rounds: 10, eraEnds: [3, 6, 10], hqRound: 5, electionRounds: [3, 6], mandateRounds: [3, 6, 9], pledgeRound: 6, council: 'draw', elections: true, startCash: 15 };
const QUICK_OPTS = { popTarget: 55, cashTarget: 95, cashTarget2: 90, popMinForCash: 20, cashMinForPop: 10, rounds: 6, eraEnds: [2, 4, 6], hqRound: 3, electionRounds: [2, 4], mandateRounds: [2, 4, 5], pledgeRound: 4, startCash: 20 };
function councilLegal(d, a, b) { if (a === b) return false; if ((a === 'WE' || b === 'WE') && !RIVER_DISTRICTS.includes(d)) return false; return true; }
function hasConflict(c) { return c.some(([a, b]) => CONFLICTS.some(([x, y]) => (a === x && b === y) || (a === y && b === x))); }
function councilDraw(S) {
  const cup = []; for (const k in BOARD_TOKENS) for (let i = 0; i < BOARD_TOKENS[k]; i++) cup.push(k);
  shuffle(S, cup);
  const order = [0, 3, 6, 1, 2, 4, 5, 7, 8]; const C = Array(9).fill(null).map(() => []);
  for (const d of order) {
    const aside = [];
    while (C[d].length < 2) {
      const t = cup.shift();
      if ((t === 'WE' && !RIVER_DISTRICTS.includes(d)) || C[d].includes(t)) aside.push(t); else C[d].push(t);
    }
    cup.push(...aside); shuffle(S, cup);
  }
  S.councils = C; S.unusedTokens = cup;
  repairCouncils(S, true);
}
function repairCouncils(S, conflictToo) {
  const C = S.councils;
  for (const t of Object.keys(BOARDS)) {
    if (C.some(c => c.includes(t))) continue;
    const counts = {}; C.flat().forEach(x => counts[x] = (counts[x] || 0) + 1);
    const common = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    let done = false;
    for (const cm of common) { for (let d = 0; d < 9 && !done; d++) { const i = C[d].indexOf(cm); if (i < 0) continue; const other = C[d][1 - i]; if (councilLegal(d, t, other) && S.unusedTokens.includes(t)) { C[d][i] = t; S.unusedTokens.splice(S.unusedTokens.indexOf(t), 1, cm); done = true; log(S, `Council coverage check: ${BOARDS[t]} swapped in for ${BOARDS[cm]} in ${DISTRICTS[d]}`); } } if (done) break; }
  }
  if (conflictToo && !hasConflict(C)) {
    outer: for (let d = 0; d < 9; d++) for (let i = 0; i < 2; i++) for (const t of [...new Set(S.unusedTokens)]) {
      const other = C[d][1 - i]; const old = C[d][i];
      if (!councilLegal(d, t, other)) continue;
      if (!CONFLICTS.some(([x, y]) => (t === x && other === y) || (t === y && other === x))) continue;
      C[d][i] = t; if (!Object.keys(BOARDS).every(k => C.some(c => c.includes(k)))) { C[d][i] = old; continue; }
      S.unusedTokens.splice(S.unusedTokens.indexOf(t), 1, old); log(S, `Council conflict check: ${BOARDS[t]} seated in ${DISTRICTS[d]} to create a conflicting pair`); break outer;
    }
  }
}
function newGame(o) {
  const quick = !!o.quick;
  const opts = Object.assign({}, DEFAULT_OPTS, quick ? QUICK_OPTS : {}, o.opts || {});
  opts.quick = quick; opts.council = o.council || 'draw'; opts.elections = o.elections !== false;
  const S = { v: 'row-0.7', opts, rng: (o.seed === undefined ? Math.floor(Math.random() * 2 ** 31) : o.seed) | 0, seed: o.seed, round: 0, era: 1, phase: 'setup', queue: [], secret: {}, players: [], order: [], edges: {}, ics: {}, lines: {}, zones: {}, lotZone: {}, reserves: {}, build: {}, projects: [], nextId: 1, log: [], flags: {}, reports: [], ver: 1, hq: { slots: 0 }, winner: null };
  o.players.forEach((pp, i) => S.players.push({ id: i, name: pp.name || PLAYER_COLORS[i].name, color: PLAYER_COLORS[i].id, kind: pp.kind || 'human', persona: pp.persona || 'balanced', cash: opts.startCash, bonds: 0, eng: null, con: null, standing: Array(9).fill(0), permits: [], pilot: [], programs: {}, home: null, actionsLeft: 0, popHist: [], progHist: [] }));
  S.order = shuffle(S, S.players.map(p => p.id));
  if (opts.council === 'intro') { S.councils = INTRO_COUNCILS.map(x => x.slice()); const used = {}; S.councils.flat().forEach(t => used[t] = (used[t] || 0) + 1); S.unusedTokens = []; for (const k in BOARD_TOKENS) for (let i = used[k] || 0; i < BOARD_TOKENS[k]; i++) S.unusedTokens.push(k); }
  else councilDraw(S);
  log(S, 'Councils seated: ' + S.councils.map((c, d) => `${DISTRICTS[d]} ${c.join('+')}`).join(' · '));
  // decks
  const md = shuffle(S, Object.keys(MAYORS)); let i = md.findIndex(m => !MAYORS[m].era2); S.mayor = md.splice(i, 1)[0]; S.mayorDeck = md;
  S.corp = shuffle(S, Object.keys(CORPS))[0];
  S.eventDeck = { 1: [], 2: [], 3: [] }; for (const e of EVENTS) S.eventDeck[e[1]].push(e[0]); for (const k in S.eventDeck) shuffle(S, S.eventDeck[k]);
  S.permitDeck = []; for (const p of PERMITS) for (let j = 0; j < p[2]; j++) S.permitDeck.push(p[0]); shuffle(S, S.permitDeck); S.permitDiscard = [];
  log(S, `First Mayor: ${MAYORS[S.mayor].name}, "${MAYORS[S.mayor].platform}". Corporation coming in Round ${opts.hqRound}: ${CORPS[S.corp].name}.`);
  // partners: deal 2 + 2
  const E = shuffle(S, Object.keys(ENGINEERS)), C = shuffle(S, Object.keys(CONTRACTORS));
  for (const pid of S.order) S.queue.push({ type: 'partners', pid, secret: true, offer: { eng: [E.pop(), E.pop()], con: [C.pop(), C.pop()] } });
  S.phase = 'setup_partners';
  return S;
}
function pending(S) { return S.queue[0] || null; }
// ---------- home district placement ----------
function homeLayouts(S, d) {
  const out = []; const dc = d % 3, dr = Math.floor(d / 3);
  for (let r = dr * 4; r < dr * 4 + 4; r++) for (let c = dc * 4; c < dc * 4 + 4; c++) {
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      const a = lk(c, r), b = lk(c + dx, r + dy); if (lotDistrict(b) !== d) continue;
      if ([a, b].some(l => BOARD.river.has(l) || S.lotZone[l])) continue;
      // roads: the edges along one side of both lots + an extension
      let roads;
      if (dx) roads = ['h:' + c + ':' + (r + 1), 'h:' + (c + 1) + ':' + (r + 1), 'v:' + c + ':' + r];
      else roads = ['v:' + (c + 1) + ':' + r, 'v:' + (c + 1) + ':' + (r + 1), 'h:' + c + ':' + r];
      if (roads.some(e => BOARD.crossing.has(e) || (S.edges[e] && S.edges[e].road !== undefined))) continue;
      const wf = [a, b].some(l => BOARD.water.has(l));
      const centr = Math.abs(c - (dc * 4 + 1.5)) + Math.abs(r - (dr * 4 + 1.5));
      out.push({ dup: a, nc: b, roads, score: centr + (wf ? -0.5 : 0) });
    }
  }
  return out.sort((x, y) => x.score - y.score);
}
function placeHome(S, pid, a) {
  const p = S.players[pid]; const d = a.district;
  if (d === DOWNTOWN || d < 0 || d > 8 || S.players.some(o => o.home === d)) throw new Error('District unavailable');
  let lay = null;
  if (a.dup && a.nc) {
    lay = { dup: a.dup, nc: a.nc, roads: a.roads || [] };
    const errs = []; lotsFree(S, pid, [a.dup, a.nc], errs);
    if (errs.length || !lotAdj(a.dup).includes(a.nc) || lotDistrict(a.dup) !== d || lotDistrict(a.nc) !== d) throw new Error('Invalid home layout');
    if (lay.roads.length > 3 || !lay.roads.length) throw new Error('Place 1–3 road edges');
  } else lay = homeLayouts(S, d)[a.variant || 0];
  if (!lay) throw new Error('No room in district');
  p.home = d;
  const dz = newZone(S, pid, 'DUP', [lay.dup]); const nz = newZone(S, pid, 'NC', [lay.nc]);
  for (const e of lay.roads) { S.edges[e] = S.edges[e] || {}; S.edges[e].road = pid; }
  dz.workers[0].job = nz.id; dz.workers[0].route = [];
  p.standing[d] = 1; touch(S);
  log(S, `${p.name} claims ${DISTRICTS[d]} as home: Duplex ${lotName(lay.dup)}, Neighborhood Commercial ${lotName(lay.nc)}, ${lay.roads.length} roads. Standing +1.`, pid);
}
function petition(S, pid, a) {
  const p = S.players[pid]; if (a.slot === null || a.slot === undefined) { log(S, `${p.name} keeps the ${DISTRICTS[p.home]} council`, pid); return; }
  const d = p.home; const old = S.councils[d][a.slot]; const other = S.councils[d][1 - a.slot];
  const cup = S.unusedTokens.concat([old]); shuffle(S, cup);
  const idx = cup.findIndex(t => councilLegal(d, t, other));
  const t = cup.splice(idx, 1)[0]; S.councils[d][a.slot] = t; S.unusedTokens = cup;
  log(S, `${p.name} petitions ${DISTRICTS[d]}: ${BOARDS[old]} → ${BOARDS[t]}`, pid);
  repairCouncils(S, false); touch(S);
}
// ---------- main dispatcher ----------
function act(S, pid, a) {
  const pd = pending(S);
  if (!pd) throw new Error('Nothing pending');
  const p = S.players[pid];
  if (a && a.type === 'recommute' && S.phase === 'actions') { manualCommute(S, pid, a.zid, a.wi, a.job); return { ok: true, free: true }; }
  if (pd.pid !== pid) throw new Error(`Waiting for ${S.players[pd.pid].name}`);
  switch (pd.type) {
    case 'partners': {
      if (!pd.offer.eng.includes(a.eng) || !pd.offer.con.includes(a.con)) throw new Error('Choose one of each from your offer');
      p.eng = a.eng; p.con = a.con; if (a.con === 'C5' || a.con === 'C9') p.cash -= 2;
      S.queue.shift(); if (!S.queue.length) { S.players.forEach(q => log(S, `${q.name} hires ${CONTRACTORS[q.con].name} and ${ENGINEERS[q.eng].name}${q.con === 'C5' || q.con === 'C9' ? ' (starts $2 lower)' : ''}`, q.id)); }
      break;
    }
    case 'home': placeHome(S, pid, a); S.queue.shift(); break;
    case 'petition': petition(S, pid, a); S.queue.shift(); break;
    case 'bid': case 'election': case 'hq': case 'stadium': {
      validateSecret(S, pid, pd.type, a);
      S.secret[pd.type] = S.secret[pd.type] || {}; S.secret[pd.type][pid] = a; S.queue.shift();
      if (pd.type === 'hq' && a.site && !a.pass) S.hqSites = (S.hqSites || []).concat(a.site);
      break;
    }
    case 'permit': {
      const i = S.permitMarket.indexOf(a.code); if (i < 0) throw new Error('Not in market');
      S.permitMarket.splice(i, 1); log(S, `${p.name} takes ${PERMIT_INFO[a.code].name}`, pid);
      if (a.code === 'TAX') { money(S, pid, 5, 'Tax Abatement permit'); S.permitDiscard.push('TAX'); }
      else { p.permits.push(a.code); while (p.permits.length > 2) { const x = p.permits.shift(); S.permitDiscard.push(x); log(S, `${p.name} discards ${PERMIT_INFO[x].name} (max 2 held)`, pid); } }
      S.queue.shift(); break;
    }
    case 'stadium_place': {
      const errs = []; lotsFree(S, pid, [a.lot], errs); if (errs.length) throw new Error(errs[0]);
      newZone(S, pid, 'ST', [a.lot]); log(S, `${p.name} places the Stadium on ${lotName(a.lot)}`, pid); S.queue.shift(); break;
    }
    case 'action': return doAction(S, pid, a);
    default: throw new Error('Unknown pending ' + pd.type);
  }
  touch(S); advance(S); return { ok: true };
}
function validateSecret(S, pid, type, a) {
  const p = S.players[pid];
  if (type === 'bid' || type === 'stadium') { if (!(a.amount >= 0 && a.amount <= p.cash && Number.isInteger(a.amount))) throw new Error('Bid must be $0–your cash'); }
  if (type === 'election') { if (![0, 1].includes(a.candidate)) throw new Error('Choose a candidate'); if (!(a.amount >= 0 && a.amount <= Math.min(6, p.cash))) throw new Error('Contribution $0–$6'); }
  if (type === 'hq' && !a.pass) {
    const e = hqSiteErrors(S, pid, a.site || []); if (e.length) throw new Error(e[0]);
    if (![0, 2, 4, 6, 8, 10].includes(a.pledge)) throw new Error('Pledge 0,2,4,6,8,10');
    if (!(a.incentive >= 0 && a.incentive <= 9 && a.incentive <= p.cash)) throw new Error('Incentive $0–$9');
  }
}
function doAction(S, pid, a) {
  const p = S.players[pid]; let pv;
  const FREE = ['permit', 'demolish', 'recommute', 'skipBonus'];
  if (p.bonus && !FREE.includes(a.type) && !(a.type === 'transit' && a.spec.bonus)) throw new Error('Finish or skip your bonus build first');
  switch (a.type) {
    case 'transit': pv = previewTransit(S, pid, a.spec); if (!pv.ok) throw new Error(pv.errors[0]); applyTransit(S, pid, pv); break;
    case 'zone': pv = previewZone(S, pid, a.spec); if (!pv.ok) throw new Error(pv.errors[0]); applyZone(S, pid, pv); break;
    case 'upzone': pv = previewUpzone(S, pid, a.spec); if (!pv.ok) throw new Error(pv.errors[0]); applyUpzone(S, pid, pv); break;
    case 'landAssembly': {
      throw new Error('Land Assembly was removed in v0.7');
      const z = S.zones[a.zid]; if (!p.permits.includes('LAS')) throw new Error('No Land Assembly permit');
      if (!z || z.owner === pid || !['SFD', 'DUP'].includes(z.type)) throw new Error("Choose a rival's SFD or Duplex");
      const pay = ZT[z.type].cost + 3; if (p.cash < pay) throw new Error('Not enough cash');
      p.cash -= pay; S.players[z.owner].cash += pay; p.permits.splice(p.permits.indexOf('LAS'), 1);
      log(S, `${p.name} uses Land Assembly on ${zoneLabel(S, z)}, paying ${S.players[z.owner].name} $${pay}`, pid, 'action');
      const lots = z.lots; for (const l of lots) delete S.lotZone[l]; delete S.zones[z.id];
      const nz = newZone(S, pid, 'DUP', [lots[0]]); touch(S); validateCommutes(S); autoAssign(S, pid); break;
    }
    case 'outreach': case 'finance': case 'pilot': case 'consult': case 'program':
      pv = previewSimple(S, pid, a); if (!pv.ok) throw new Error(pv.errors[0]); applySimple(S, pid, pv); break;
    case 'demolish': pv = previewDemolish(S, pid, a); if (!pv.ok) throw new Error(pv.errors[0]); applyDemolish(S, pid, pv); autoAssign(S, pid); return { ok: true, free: true };
    case 'recommute': manualCommute(S, pid, a.zid, a.wi, a.job); return { ok: true, free: true };
    case 'permit': usePermit(S, pid, a); return { ok: true, free: true };
    case 'skipBonus': if (!p.bonus) throw new Error('No bonus'); p.bonus = null; log(S, `${p.name} skips the bonus build`, pid); endAction(S, pid, false); return { ok: true };
    default: throw new Error('Unknown action');
  }
  // bonus builds (Blacktop C1, Twin Crews C10)
  const wasBonus = a.type === 'transit' && a.spec.bonus;
  if (wasBonus) { p.bonus = null; endAction(S, pid, false); return { ok: true }; }
  if (a.type === 'transit' && !a.spec.free) {
    if (p.con === 'C1' && a.spec.mode !== 'road') { p.bonus = { mode: 'road', max: 1, label: 'Blacktop & Sons: build 1 road edge ($1) as part of this action' }; touch(S); return { ok: true, bonus: true }; }
    if (p.con === 'C10' && !p.twinUsed) { p.twinUsed = true; p.bonus = { except: a.spec.mode, label: 'Twin Crews: build a second, different mode in this action' }; touch(S); return { ok: true, bonus: true }; }
  }
  endAction(S, pid, true); return { ok: true };
}
function endAction(S, pid, main) {
  const p = S.players[pid];
  p.actionsLeft--; p.demolishUsed = false; S.queue.shift();
  if (p.extraNow && p.actionsLeft > 0) { p.extraNow = false; S.queue.unshift({ type: 'action', pid }); touch(S); return; }
  nextActor(S); touch(S); advance(S);
}
function nextActor(S) {
  const n = S.order.length;
  for (let k = 1; k <= n; k++) {
    const pid = S.order[(S.turnIdx + k) % n];
    if (S.players[pid].actionsLeft > 0) { S.turnIdx = (S.turnIdx + k) % n; S.queue.unshift({ type: 'action', pid }); return; }
  }
  S.phase = 'commute';
}
function usePermit(S, pid, a) {
  const p = S.players[pid]; const code = a.code; const i = p.permits.indexOf(code);
  if (i < 0) throw new Error('You do not hold that permit');
  const done = () => { p.permits.splice(p.permits.indexOf(code), 1); S.permitDiscard.push(code); log(S, `${p.name} uses ${PERMIT_INFO[code].name}`, pid, 'action'); touch(S); };
  switch (code) {
    case 'DEV': { const errs = []; if (!a.lots || a.lots.length < 1 || a.lots.length > 2) throw new Error('Choose 1–2 empty lots'); lotsFree(S, pid, a.lots, errs); if (errs.length) throw new Error(errs[0]); for (const l of a.lots) S.reserves[l] = { pid, until: S.round + 1 }; done(); break; }
    case 'XSH': p.actionsLeft++; p.extraNow = true; done(); break;
    case 'CMT': if (a.district === undefined) throw new Error('Choose a district'); done(); moveStanding(S, pid, a.district, 2, 'Community Meeting'); break;
    case 'HEX': { const pv = previewTransit(S, pid, { mode: 'hwy', edges: [], ics: [a.node], free: 'HEX' }); if (!pv.ok) throw new Error(pv.errors[0]); done(); applyTransit(S, pid, pv); break; }
    case 'EXP': { const pj = S.projects.find(x => x.owner === pid && (!a.proj || x.id === a.proj)); if (!pj) throw new Error('No project under construction'); done(); reduceProject(S, pj, 1); log(S, `Express Permit: ${pj.label} advances`, pid); break; }
    case 'BKS': { const pv = previewTransit(S, pid, { mode: 'bike', edges: a.edges || [], free: 'BKS' }); if (!pv.ok) throw new Error(pv.errors[0]); done(); applyTransit(S, pid, pv); break; }
    case 'RID': S.flags.ridership = (S.flags.ridership || []).concat([pid]); done(); break;
    default: throw new Error(`${PERMIT_INFO[code].name} is used together with an action (see the action panel)`);
  }
  autoAssign(S, pid);
}
// ---------- HQ ----------
function hqSiteErrors(S, pid, site) {
  const e = [];
  if (site.length !== 2 || !lotAdj(site[0]).includes(site[1])) { e.push('Site: 2 orthogonally adjacent lots'); return e; }
  lotsFree(S, pid, site, e);
  if (site.some(l => S.players[pid].standing[lotDistrict(l)] <= -3)) e.push('You are Blocked in that district');
  if (!hqReqMet(S, site)) e.push(`Site requirement: ${CORPS[S.corp].req}`);
  return e;
}
function hqReqMet(S, site) {
  if (S.corp === 'MER') return railR1(S, site);
  if (S.corp === 'LUM') return freightNear(S, site, 2).length > 0 || portAccess(S, site).length > 0;
  if (S.corp === 'ARC') return site.some(l => lotDistrict(l) === DOWNTOWN) || hrZone(S, site);
}
function hqScore(S, pid, a) {
  const site = a.site; const ev = evalCity(S); const rows = []; const d = lotDistrict(site[0]);
  let homes = 0; for (const id in S.zones) { const z = S.zones[id]; if (z.owner === pid && ZT[z.type].res && z.lots.some(x => site.some(y => lotCheb(x, y) <= 2))) homes += ev.Z[id].pop; }
  rows.push([`Homes nearby (${homes} Pop)`, Math.floor(homes / 2)]);
  rows.push([`Housing Pledge ${a.pledge}`, Math.min(5, Math.floor(a.pledge / 2))]);
  rows.push([`Standing ×2 in ${DISTRICTS[d]}`, 2 * S.players[pid].standing[d]]);
  const sv = svc(S); const modes = new Set();
  for (const e of lotsBorder(site)) if (sv.E.bike.has(e)) modes.add('bike');
  for (const s of sv.opStops) if (anyLotIn(s.node, site, s.mode === 'lr' || s.mode === 'hr' ? zoningRadius(S, s) : 1)) modes.add(s.mode === 'dock' ? 'ferry' : s.mode);
  if (freightNear(S, site, 2).length) modes.add('freight');
  rows.push([`Transit modes (${[...modes].join(', ') || 'none'})`, 2 * modes.size]);
  rows.push(['Mayor ally seated', MAYORS[S.mayor].allies.some(b => S.councils[d].includes(b)) ? 3 : 0]);
  let pref = false;
  if (S.corp === 'MER') pref = site.some(l => lotAdj(l).some(x => S.lotZone[x] && ZT[S.zones[S.lotZone[x]].type].park)) || [...lotsBorder(site)].some(e => sv.E.bike.has(e));
  if (S.corp === 'LUM') pref = sv.opStops.some(s => anyLotIn(s.node, site, 1));
  if (S.corp === 'ARC') pref = site.some(l => lotAdj(l).some(x => S.lotZone[x] && S.zones[S.lotZone[x]].owner === pid && ['MU', 'MR'].includes(S.zones[S.lotZone[x]].type)));
  rows.push(['Corporate preference', pref ? 2 : 0]);
  rows.push([`Incentive $${a.incentive}`, Math.min(3, Math.floor(a.incentive / 3))]);
  return { rows, total: rows.reduce((s, r) => s + r[1], 0), homesPledge: Math.floor(homes / 2) + Math.min(5, Math.floor(a.pledge / 2)) };
}
function resolveHQ(S) {
  const sec = S.secret.hq || {}; delete S.secret.hq; S.hqSites = null;
  const bids = Object.entries(sec).filter(([, a]) => !a.pass).map(([pid, a]) => ({ pid: +pid, a, sc: hqScore(S, +pid, a) }));
  S.hq.bids = bids.map(b => ({ pid: b.pid, site: b.a.site, pledge: b.a.pledge, incentive: b.a.incentive, rows: b.sc.rows, total: b.sc.total }));
  if (!bids.length) { log(S, `${CORPS[S.corp].name} found no qualifying site and goes elsewhere.`, null, 'event'); S.hq.none = true; return; }
  for (const b of bids) log(S, `HQ bid — ${S.players[b.pid].name}: site ${b.a.site.map(lotName).join('–')}, score ${b.sc.total} (${b.sc.rows.map(r => r[0] + ' ' + r[1]).join('; ')})`, b.pid, 'event');
  bids.sort((x, y) => y.sc.total - x.sc.total || y.sc.homesPledge - x.sc.homesPledge || tieMetric(S, x.pid) - tieMetric(S, y.pid));
  const w = bids[0]; const pid = w.pid; const p = S.players[pid];
  if (w.a.incentive) money(S, pid, -w.a.incentive, 'HQ Incentive package');
  const n = S.players.length; S.hq.slots = n <= 2 ? 2 : n === 3 ? 3 : 5;
  const z = newZone(S, pid, 'HQ', w.a.site); S.hq.zid = z.id; S.hq.host = pid; S.hq.pledge = w.a.pledge; S.hq.remaining = w.a.pledge;
  log(S, `${CORPS[S.corp].name} chooses ${p.name}'s site ${w.a.site.map(lotName).join('–')}! ${p.name} is Host: +4 Pop Relocation bonus; Pledge ${w.a.pledge} Pop due by Round ${S.opts.pledgeRound} City Hall.`, pid, 'event');
  const tags = {}; const d = lotDistrict(w.a.site[0]); addTag(tags, d, 'z_OF'); if (isWaterfront(w.a.site)) addTag(tags, d, 'wf_ind');
  applyReactions(S, pid, tags, 'HQ (Office reactions)');
}
// ---------- phases ----------
function advance(S) {
  let guard = 0;
  while (!S.queue.length && S.phase !== 'over' && guard++ < 50) stepPhase(S);
}
function stepPhase(S) {
  switch (S.phase) {
    case 'setup_partners':
      S.phase = 'setup_home';
      for (const pid of S.order.slice().reverse()) S.queue.push({ type: 'home', pid });
      break;
    case 'setup_home':
      S.phase = 'setup_petition'; break; // v0.7: Petitions removed
    case 'setup_petition': startRound(S); break;
    case 'event': phaseEvent(S); break;
    case 'stadium': resolveStadium(S); S.phase = 'hq_check'; break;
    case 'hq_check':
      if (S.round === S.opts.hqRound) { S.phase = 'hq'; for (const pid of S.order) S.queue.push({ type: 'hq', pid, secret: true }); }
      else S.phase = 'bid_start';
      break;
    case 'hq': resolveHQ(S); S.phase = 'bid_start'; break;
    case 'bid_start':
      S.permitMarket = []; for (let i = 0; i < S.players.length + 1; i++) { if (!S.permitDeck.length) { S.permitDeck = shuffle(S, S.permitDiscard); S.permitDiscard = []; } if (S.permitDeck.length) S.permitMarket.push(S.permitDeck.pop()); }
      S.phase = 'bid'; for (const pid of S.order) S.queue.push({ type: 'bid', pid, secret: true }); break;
    case 'bid': resolveBids(S); break;
    case 'permits': S.permitDiscard.push(...S.permitMarket); S.permitMarket = []; startActions(S); break;
    case 'commute': phaseCommute(S); S.phase = 'hearing'; break;
    case 'hearing': phaseHearing(S); S.phase = 'income'; break;
    case 'income': phaseIncome(S); S.phase = 'victory'; break;
    case 'victory': phaseVictory(S); if (S.phase !== 'over') S.phase = 'cityhall'; break;
    case 'cityhall': phaseCityHall(S); break;
    case 'election': resolveElection(S); S.phase = 'cleanup'; break;
    case 'cleanup': phaseCleanup(S); break;
  }
}
function startRound(S) {
  S.round++; const oldEra = S.era; S.era = eraOfRound(S, S.round);
  if (S.era !== oldEra) log(S, `=== Era ${['', 'I', 'II', 'III'][S.era]} begins ===`, null, 'era');
  log(S, `--- Round ${S.round} ---`, null, 'round');
  S.flags = {}; S.phase = 'event';
  S.players.forEach(p => { p.outreachUsed = false; p.pilotUsed = false; p.fastTrackUsed = false; p.twinUsed = false; p.bonus = null; p.extraNow = false; p.demolishUsed = false; p.popStart = playerPop(S, p.id).pop; p.cashStart = p.cash; });
  S.roundLedger = {}; S.players.forEach(p => S.roundLedger[p.id] = { start: p.cash, items: [] });
}
function phaseEvent(S) {
  const deck = S.eventDeck[S.era]; const id = deck.shift(); const e = EVENTS.find(x => x[0] === id);
  S.event = { id, name: e[2], docket: e[3], text: e[4] };
  log(S, `Event: ${e[2]} — ${e[4]} Docket: ${DISTRICTS[e[3]]}.`, null, 'event');
  S.phase = 'hq_check';
  switch (id) {
    case 5: { const c = S.players.map(p => ownedEdges(S, p.id, 'hwy')); const m = Math.min(...c); S.flags.stateHwy = S.players.filter(p => c[p.id] === m).map(p => p.id); break; }
    case 8: for (const z of Object.values(S.zones)) if (ZT[z.type].ind && isWaterfront(z.lots)) moveStanding(S, z.owner, zoneDistrict(z), -1, 'Riverfront Cleanup'); break;
    case 9: for (let d = 0; d < 9; d++) if (S.councils[d].includes('BP')) for (const p of S.players) { let n = 0; for (const e in S.edges) if (S.edges[e].bike === p.id && edgeDistricts(e).includes(d)) n++; if (n >= 3) moveStanding(S, p.id, d, 1, 'Viral Bike Video'); } break;
    case 15: { const filled = filledSlots(S); const his = Object.values(S.zones).filter(z => z.type === 'HI').sort((a, b) => (filled[b.id] || 0) - (filled[a.id] || 0)); if (his.length && filled[his[0].id]) { for (const z of Object.values(S.zones)) for (const w of z.workers) if (w.job === his[0].id) { w.job = null; w.route = []; } log(S, `Plant Relocation: ${zoneLabel(S, his[0])} loses all its workers`, null, 'event'); touch(S); } break; }
    case 18: { let best = null, bn = -1; for (const b of BOARD.bridgeSites) { const x = S.edges[b] || {}; const n = ['road', 'bike', 'lr', 'hwy'].filter(m => x[m] !== undefined).length; if (n > bn) { bn = n; best = b; } } if (bn > 0) { S.flags.closedBridge = best; log(S, `${BOARD.bridgeNames[best]} closed for inspection`, null, 'event'); } break; }
    case 24: { const pops = S.players.map(p => playerPop(S, p.id).pop); const lead = pops.indexOf(Math.max(...pops)); const z = Object.values(S.zones).find(z => z.owner === lead && ['SFD', 'DUP'].includes(z.type) && !z.landmark); if (z) { z.landmark = true; log(S, `${zoneLabel(S, z)} becomes a Landmark`, lead, 'event'); } for (let d = 0; d < 9; d++) if (S.councils[d].includes('HO')) moveStanding(S, lead, d, 1, 'Historic Preservation'); touch(S); break; }
    case 26: S.phase = 'stadium'; for (const pid of S.order) S.queue.push({ type: 'stadium', pid, secret: true }); break;
  }
  touch(S);
}
function resolveStadium(S) {
  const sec = S.secret.stadium || {}; delete S.secret.stadium;
  const bids = S.order.map(pid => ({ pid, amt: (sec[pid] || { amount: 0 }).amount }));
  bids.sort((a, b) => b.amt - a.amt || tieMetric(S, a.pid) - tieMetric(S, b.pid));
  const w = bids[0]; log(S, `Stadium bids: ${bids.map(b => S.players[b.pid].name + ' $' + b.amt).join(', ')}`, null, 'event');
  if (w.amt) money(S, w.pid, -w.amt, 'Stadium bid');
  S.queue.push({ type: 'stadium_place', pid: w.pid });
}
function resolveBids(S) {
  const sec = S.secret.bid || {}; delete S.secret.bid; const prev = S.order.slice();
  const bids = S.order.map(pid => ({ pid, amt: sec[pid].amount }));
  bids.sort((a, b) => b.amt - a.amt || tieMetric(S, a.pid) - tieMetric(S, b.pid) || prev.indexOf(a.pid) - prev.indexOf(b.pid));
  S.lastBids = bids;
  for (const b of bids) if (b.amt) money(S, b.pid, -b.amt, 'Zoning Board bid');
  S.order = bids.map(b => b.pid);
  log(S, `Zoning Board: bids ${bids.map(b => S.players[b.pid].name + ' $' + b.amt).join(', ')}. Turn order: ${S.order.map(p => S.players[p].name).join(', ')}.`, null, 'phase');
  S.phase = 'permits'; for (const pid of S.order) S.queue.push({ type: 'permit', pid });
}
function startActions(S) {
  S.phase = 'actions'; S.players.forEach(p => p.actionsLeft = 3); S.turnIdx = 0;
  S.queue.push({ type: 'action', pid: S.order[0] });
}
function phaseCommute(S) {
  validateCommutes(S); autoAssign(S, null); for (const pid of S.order) if (S.players[pid].kind === 'ai') optimizeCommutes(S, pid);
  for (const z of Object.values(S.zones)) {
    if (!ZT[z.type].res) continue;
    const un = z.workers.filter(w => !w.job && !w.excused).length; z.unemp = un;
    if (un) {
      if (z.decline) {
        const T = ZT[z.type]; let to = null;
        if (T.rung !== undefined && T.rung >= 2) to = LADDER[T.rung - 1]; else if (z.type === 'MU') to = 'NC';
        if (to) { log(S, `${zoneLabel(S, z)} declines → ${ZT[to].name}`, z.owner, 'bad'); z.type = to; setWorkers(z); }
        else { log(S, `${zoneLabel(S, z)} is abandoned and removed (decline)`, z.owner, 'bad'); for (const l of z.lots) delete S.lotZone[l]; delete S.zones[z.id]; }
        z.decline = false;
      } else { z.decline = true; log(S, `${zoneLabel(S, z)}: ${un} unemployed cube(s) — Decline marker (−${2 * un} Pop this round)`, z.owner, 'bad'); }
    } else z.decline = false;
  }
  touch(S); validateCommutes(S);
}
function phaseHearing(S) {
  const d = S.event.docket; log(S, `Public Hearing in ${DISTRICTS[d]} (${S.councils[d].map(b => BOARDS[b]).join(' + ')})`, null, 'phase');
  if (eventIs(S, 19)) for (const p of S.players) if (p.standing[d]) moveStanding(S, p.id, d, p.standing[d] > 0 ? -1 : 1, 'Election Year');
  const inD = l => lotDistrict(l) === d;
  const edgeCount = (pid, m) => { let n = 0; for (const e in S.edges) if (S.edges[e][m] === pid && edgeDistricts(e).includes(d)) n++; return n; };
  const zonesOf = pid => Object.values(S.zones).filter(z => z.owner === pid && z.lots.some(inD));
  const cg = congestion(S); const filled = filledSlots(S);
  const strictMax = (vals, needOne) => { const m = Math.max(...vals); if (needOne && m < 1) return []; const w = vals.map((v, i) => v === m ? i : -1).filter(i => i >= 0); return w; };
  const gain = (vals, why) => { const w = strictMax(vals, true); if (w.length === 1) moveStanding(S, S.players[w[0]].id, d, 1, why); };
  const lose = (vals, why) => { const w = strictMax(vals, true); for (const i of w) moveStanding(S, S.players[i].id, d, -1, why); };
  const ps = S.players;
  for (const b of S.councils[d]) {
    if (b === 'BP') { gain(ps.map(p => edgeCount(p.id, 'bike')), 'Bike & Ped hearing: most bike edges'); lose(ps.map(p => edgeCount(p.id, 'hwy')), 'Bike & Ped hearing: most highway edges'); }
    if (b === 'TR') { gain(ps.map(p => svc(S).opStops.filter(s => s.owner === p.id && nodeDistricts(s.node).includes(d)).length), 'Transit Riders hearing: most stops/stations/docks'); lose(ps.map(p => zonesOf(p.id).filter(z => !ZT[z.type].park && z.type !== 'HQ' && roadOnly(S, z)).length), 'Transit Riders hearing: most road-only zones'); }
    if (b === 'MO') { gain(ps.map(p => edgeCount(p.id, 'road')), 'Motorists hearing: most road edges'); if (cg.congested[d]) for (const p of ps) if (zonesOf(p.id).some(z => roadOnly(S, z))) moveStanding(S, p.id, d, -1, 'Motorists hearing: congestion'); }
    if (b === 'HO') { gain(ps.map(p => zonesOf(p.id).filter(z => ZT[z.type].res && ZT[z.type].tier <= 2).length), 'Homeowners hearing: most T1–T2 homes'); lose(ps.map(p => zonesOf(p.id).filter(z => ZT[z.type].tier >= 3).length), 'Homeowners hearing: most T3–T4 zones'); }
    if (b === 'BA') { gain(ps.map(p => zonesOf(p.id).reduce((a, z) => a + (filled[z.id] || 0), 0)), 'Business hearing: most filled job slots'); for (const p of ps) if (zonesOf(p.id).some(z => z.decline)) moveStanding(S, p.id, d, -1, 'Business hearing: Decline marker'); }
    if (b === 'WE') { gain(ps.map(p => zonesOf(p.id).filter(z => ZT[z.type].park).length + svc(S).opStops.filter(s => s.owner === p.id && s.mode === 'dock' && nodeDistricts(s.node).includes(d)).length), 'Waterfront hearing: most Parks + docks'); for (const p of ps) if (zonesOf(p.id).some(z => ZT[z.type].ind && isWaterfront(z.lots))) moveStanding(S, p.id, d, -1, 'Waterfront hearing: waterfront industry'); }
  }
}
function phaseIncome(S) {
  if (eventIs(S, 28)) for (const d of RIVER_DISTRICTS) if (S.councils[d].includes('WE')) {
    const c = S.players.map(p => Object.values(S.zones).filter(z => z.owner === p.id && ZT[z.type].ind && zoneDistrict(z) === d && portAccess(S, z.lots).length).length);
    const m = Math.max(...c); if (m > 0) { const w = c.map((v, i) => v === m ? i : -1).filter(i => i >= 0); if (w.length === 1) moveStanding(S, w[0], d, -1, 'Harbor Dredging'); }
  }
  const { out, ev } = incomeStatement(S); const rep = { round: S.round, rows: {} };
  for (const p of S.players) {
    const o = out[p.id]; const before = p.cash;
    const tr = o.transfers.reduce((a, t) => a + t[1], 0), up = o.upkeep.reduce((a, t) => a + t[1], 0);
    p.cash += o.afterOH + tr - up - o.interest;
    log(S, `${p.name} income: tax $${o.tax} + wages $${o.wages} + jobs $${o.jobs} = $${o.gross} gross → $${o.afterOH} after Overhead; transfers ${tr >= 0 ? '+' : '−'}$${Math.abs(tr)}; upkeep −$${up}; interest −$${o.interest} ⇒ net ${o.net >= 0 ? '+' : '−'}$${Math.abs(o.net)} (cash $${p.cash})`, p.id, 'cash');
    let forced = 0; while (p.cash < 0) { p.bonds++; p.cash += 8; forced++; }
    if (forced) log(S, `${p.name} is forced to take ${forced} Bond(s) to cover debt`, p.id, 'bad');
    rep.rows[p.id] = Object.assign({}, o, { cashStart: p.cashStart, cashBeforeIncome: before, cashAfter: p.cash, forcedBonds: forced, ledger: S.roundLedger[p.id] });
  }
  S.lastIncome = rep;
}
// Net Worth variant: cash + Pop x rate - bonds x bondValue (repayment value, default $8)
// mid-game tie metric (bids, elections, HQ): Net Worth in v0.6; Progress in the Race to Target variant
function tieMetric(S, pid) { return S.opts.victory === 'networth' ? netWorth(S, pid) : progressOf(S, pid); }
function netWorth(S, pid, pop) { const p = S.players[pid]; pop = pop === undefined ? playerPop(S, pid).pop : pop; return p.cash + pop * S.opts.nwRate - p.bonds * S.opts.bondValue; }
function phaseVictory(S) {
  const ev = evalCity(S); const res = [];
  if (S.opts.victory === 'networth') {
    for (const p of S.players) { const pp = playerPop(S, p.id, ev); p.pop = pp.pop; p.popParts = pp.parts; p.popHist.push(pp.pop); const nw = netWorth(S, p.id, pp.pop); p.nw = nw; (p.nwHist = p.nwHist || []).push(nw); p.progHist.push(progressOf(S, p.id, pp.pop, p.cash));
      if (S.lastIncome) Object.assign(S.lastIncome.rows[p.id], { popStart: p.popStart, popAfter: pp.pop, progress: p.progHist.slice(-1)[0], netWorth: nw }); }
    S.reports.push(S.lastIncome);
    if (S.round >= S.opts.rounds) {
      const ranked = S.players.map(p => p.id).sort((a, b) => S.players[b].nw - S.players[a].nw || tieBreak(S, a, b)); const w = S.players[ranked[0]];
      endGame(S, ranked[0], `highest Net Worth after Round ${S.round}: $${w.nw} = $${w.cash} cash + ${w.pop} Pop × $${S.opts.nwRate}${w.bonds ? ` − ${w.bonds} Bond × $${S.opts.bondValue}` : ''}`);
    }
    return;
  }
  for (const p of S.players) {
    const pp = playerPop(S, p.id, ev); p.pop = pp.pop; p.popParts = pp.parts; p.popHist.push(pp.pop);
    const prog = progressOf(S, p.id, pp.pop, p.cash); p.progHist.push(prog);
    if (S.lastIncome) Object.assign(S.lastIncome.rows[p.id], { popStart: p.popStart, popAfter: pp.pop, progress: prog });
    const popWin = pp.pop >= S.opts.popTarget && p.cash >= S.opts.cashMinForPop;
    const cashWin = p.cash >= cashTarget(S) && pp.pop >= S.opts.popMinForCash;
    if (popWin || cashWin) res.push({ pid: p.id, over: Math.max(popWin ? pp.pop / S.opts.popTarget : 0, cashWin ? p.cash / cashTarget(S) : 0), kind: popWin && (!cashWin || pp.pop / S.opts.popTarget >= p.cash / cashTarget(S)) ? 'Population' : 'Treasury' });
  }
  S.reports.push(S.lastIncome);
  if (res.length) { res.sort((a, b) => b.over - a.over || tieBreak(S, a.pid, b.pid)); endGame(S, res[0].pid, `${res[0].kind} Victory (${Math.round(res[0].over * 100)}% of target)`); return; }
  if (S.round >= S.opts.rounds) {
    const ranked = S.players.map(p => p.id).sort((a, b) => S.players[b].progHist.slice(-1)[0] - S.players[a].progHist.slice(-1)[0] || tieBreak(S, a, b));
    endGame(S, ranked[0], `highest Progress after Round ${S.round} (${Math.round(S.players[ranked[0]].progHist.slice(-1)[0] * 100)}%)`);
  }
}
function tieBreak(S, a, b) {
  const st = p => S.players[p].standing.reduce((x, y) => x + y, 0); if (st(b) !== st(a)) return st(b) - st(a);
  const f = filledSlots(S); const js = p => Object.values(S.zones).filter(z => z.owner === p).reduce((x, z) => x + (f[z.id] || 0), 0);
  if (js(b) !== js(a)) return js(b) - js(a); return S.players[a].bonds - S.players[b].bonds;
}
function endGame(S, pid, why) { S.winner = { pid, why }; S.phase = 'over'; S.queue = []; log(S, `🏆 ${S.players[pid].name} wins — ${why}!`, pid, 'win'); }
function mandateCount(S, pid, m, E) {
  const zs = Object.values(S.zones).filter(z => z.owner === pid); const cnt = t => zs.filter(z => t.includes(z.type)).length;
  const ops = svc(S).opStops.filter(s => s.owner === pid);
  switch (m) {
    case 'M1': return [cnt(['SFD', 'DUP']), E + 1];
    case 'M2': return [ops.length, 2 * E];
    case 'M3': return [ownedEdges(S, pid, 'bike'), 4 * E];
    case 'M4': return [ownedEdges(S, pid, 'road') + 2 * ownedEdges(S, pid, 'hwy'), 5 * E];
    case 'M5': return [zs.filter(z => isWaterfront(z.lots) && (ZT[z.type].res || z.type === 'PK')).length + ops.filter(s => s.mode === 'dock').length, E + 1];
    case 'M6': return [zs.filter(z => z.lots.some(l => lotDistrict(l) === DOWNTOWN)).length, E];
    case 'M7': return [cnt(['HI']) ? -1 : cnt(['PK']), E];
    case 'M8': { const f = filledSlots(S); return [zs.reduce((a, z) => a + (f[z.id] || 0), 0), 5 * E]; }
    case 'M9': return [cnt(['CC', 'TH', 'MP']), E + 1];
    case 'M10': return [ops.filter(s => s.mode === 'lr' || s.mode === 'hr').length, 2 * E - 2];
    case 'M11': return [S.players[pid].bonds ? -1 : S.players[pid].cash, 15 * E];
    case 'M12': return [playerPop(S, pid).pop, [15, 30, 50][E - 1]];
  }
}
function allyDistrictFor(S, pid, allies) {
  let best = -1, bv = 99;
  for (let d = 0; d < 9; d++) if (S.councils[d].some(b => allies.includes(b)) && S.players[pid].standing[d] < 3) { const v = -S.players[pid].standing[d] * 0 + (hasPresence(S, pid, d) ? 0 : 1) * 10 + (2 - S.players[pid].standing[d]); if (v < bv) { bv = v; best = d; } }
  return best;
}
function phaseCityHall(S) {
  S.phase = 'cleanup';
  if (!S.opts.mandateRounds.includes(S.round)) return;
  const m = S.mayor; const E = S.era; const M = MAYORS[m];
  log(S, `City Hall: Mandate Review for ${M.name} — ${M.mandate}`, null, 'phase');
  const met = [];
  for (const p of S.players) { const [c, need] = mandateCount(S, p.id, m, E); if (c >= need && c >= 0) { met.push({ pid: p.id, c }); money(S, p.id, 4, `Mandate met (${c}/${need})`); } else log(S, `${p.name}: Mandate not met (${Math.max(c, 0)}/${need})`, p.id); }
  if (met.length) { const mx = Math.max(...met.map(x => x.c)); const top = met.filter(x => x.c === mx); if (top.length === 1) { money(S, top[0].pid, 3, 'Top supporter'); const d = allyDistrictFor(S, top[0].pid, M.allies); if (d >= 0) moveStanding(S, top[0].pid, d, 1, 'Top supporter'); } }
  if (S.round === S.opts.pledgeRound && S.hq.host !== undefined && S.hq.zid && !S.hq.done) {
    S.hq.done = true;
    if (S.hq.remaining > 0) { S.hq.bonusLost = true; log(S, `${S.players[S.hq.host].name} failed the HQ Housing Pledge (${S.hq.remaining} short): Relocation bonus lost, −2 standing`, S.hq.host, 'bad'); moveStanding(S, S.hq.host, zoneDistrict(S.zones[S.hq.zid]), -2, 'broken Pledge'); }
    else log(S, `${S.players[S.hq.host].name} fulfilled the HQ Housing Pledge`, S.hq.host, 'event');
  }
  if (S.opts.electionRounds.includes(S.round)) {
    S.candidates = [S.mayorDeck.shift(), S.mayorDeck.shift()];
    if (!S.opts.elections) { S.mayor = S.candidates[0]; S.mayorDeck.push(S.candidates[1]); log(S, `New Mayor: ${MAYORS[S.mayor].name}`, null, 'event'); return; }
    log(S, `Election: ${S.candidates.map(c => MAYORS[c].name + ' "' + MAYORS[c].platform + '"').join(' vs ')}`, null, 'phase');
    S.phase = 'election'; for (const pid of S.order) S.queue.push({ type: 'election', pid, secret: true, candidates: S.candidates });
  }
}
function endorsements(S, pid, cand) { const al = MAYORS[cand].allies; let n = 0; for (let d = 0; d < 9; d++) if (S.players[pid].standing[d] >= 2 && S.councils[d].some(b => al.includes(b))) n++; return n; }
function resolveElection(S) {
  const sec = S.secret.election || {}; delete S.secret.election; const C = S.candidates;
  const votes = [0, 0], endo = [0, 0];
  for (const pid of S.order) { const a = sec[pid]; if (a.amount) money(S, pid, -a.amount, `campaign contribution to ${MAYORS[C[a.candidate]].name}`); votes[a.candidate] += a.amount; const e = endorsements(S, pid, C[a.candidate]); endo[a.candidate] += e; votes[a.candidate] += e; }
  let w = votes[0] > votes[1] ? 0 : votes[1] > votes[0] ? 1 : endo[0] > endo[1] ? 0 : endo[1] > endo[0] ? 1 : -1;
  if (w < 0) { const low = S.players.map(p => p.id).sort((a, b) => tieMetric(S, a) - tieMetric(S, b))[0]; w = sec[low].candidate; log(S, `Tie: ${S.players[low].name} (lowest ${S.opts.victory === 'networth' ? 'Net Worth' : 'Progress'}) chooses`, low); }
  S.mayor = C[w]; S.mayorDeck.push(C[1 - w]);
  log(S, `Election result: ${MAYORS[C[0]].name} ${votes[0]} votes vs ${MAYORS[C[1]].name} ${votes[1]} votes. ${MAYORS[S.mayor].name} takes office: ${MAYORS[S.mayor].policy}`, null, 'event');
  S.lastElection = { candidates: C, votes, endo, winner: w, backs: Object.fromEntries(Object.entries(sec).map(([k, v]) => [k, v])) };
  const contrib = S.order.filter(pid => sec[pid].candidate === w).map(pid => ({ pid, a: sec[pid].amount }));
  const mx = Math.max(0, ...contrib.map(c => c.a));
  if (mx > 0) for (const c of contrib) if (c.a === mx) { const d = allyDistrictFor(S, c.pid, MAYORS[S.mayor].allies); if (d >= 0) moveStanding(S, c.pid, d, 1, 'Transition team'); }
  S.candidates = null;
}
function phaseCleanup(S) {
  for (const pj of S.projects.slice()) reduceProject(S, pj, 1);
  for (const p of S.players) if (p.con === 'C9') { S.projects.filter(x => x.owner === p.id).slice(0, 2).forEach(pj => reduceProject(S, pj, 1)); }
  for (const l in S.reserves) if (S.reserves[l].until <= S.round) delete S.reserves[l];
  for (const z of Object.values(S.zones)) { z.unemp = 0; for (const w of z.workers) w.excused = false; }
  S.event = null; touch(S);
  startRound(S);
}
// ===== Heuristic AI opponents (personas: pop, money, balanced) =====
const PERSONA = {
  pop: { a: 1.5, b: 0.75, label: 'Population-focused' },
  money: { a: 0.8, b: 1.5, label: 'Money-focused' },
  balanced: { a: 1.1, b: 1.1, label: 'Balanced' },
};
function lightClone(S) { const L = S.log, R = S.reports, LI = S.lastIncome; S.log = []; S.reports = []; S.lastIncome = null; const C = clone(S); S.log = L; S.reports = R; S.lastIncome = LI; return C; }
function aiValue(S, pid) {
  const per = PERSONA[S.players[pid].persona] || PERSONA.balanced; const p = S.players[pid];
  const { out } = incomeStatement(S); const pop0 = playerPop(S, pid).pop;
  let unemployed = 0; for (const z of Object.values(S.zones)) if (z.owner === pid && ZT[z.type].res) unemployed += z.workers.filter(w => !w.job).length;
  const pop = pop0 - 2 * unemployed;
  const left = Math.max(1, S.opts.rounds - S.round + (S.phase === 'actions' ? 1 : 0));
  const H = Math.min(left, 6); // v0.7: 6-round planning horizon
  const cashProj = p.cash + H * out[pid].net;
  if (S.opts.victory === 'networth') {
    const rate = S.opts.nwRate, debt = p.bonds * S.opts.bondValue, SC = 100;
    // endgame-aware: in the final round value = exact Net Worth after this round's Income (spend only if Pop x rate beats cost)
    if (!S.opts.naiveAI && left <= 1) return (p.cash + out[pid].net + pop * rate - debt) / SC + 0.0005 * p.standing.reduce((a, b) => a + b, 0);
    // otherwise archetype weights; Pop also matters for future income, so the pop AI keeps a floor value on Pop even at rate 0
    const popW = per.a * Math.max(rate, 1), cashW = per.b;
    let w = (popW * pop + cashW * (cashProj - debt)) / SC;
    w += 0.006 * p.standing.reduce((a, b) => a + Math.max(-2, b), 0) - 0.04 * unemployed;
    return w;
  }
  let v = per.a * pop / S.opts.popTarget + per.b * cashProj / cashTarget(S);
  if (S.players[pid].persona === 'money' && pop < S.opts.popMinForCash) v += 0.5 * pop / S.opts.popTarget;
  v += 0.006 * p.standing.reduce((a, b) => a + Math.max(-2, b), 0);
  v -= 0.04 * unemployed;
  // v0.5c: money/balanced value own light rail stations (incl. under construction) that have an empty Office-eligible lot within radius 1
  // (Office there pays 5 x ($2 + $1 light rail)); approximates a 2-step plan the 1-step lookahead can't see.
  if (p.persona !== 'pop' && S.era >= 2) {
    let sites = 0;
    for (const L of linesOf(S, pid, ['lr'])) for (const n of L.stops) if (walkLots(n, 1).some(l => !BOARD.river.has(l) && !S.lotZone[l] && lotDistrict(l) === DOWNTOWN)) sites++;
    v += per.b * Math.min(sites, 2) * 6 / cashTarget(S);
    // open Office slots fill over the next rounds (new homes, recommutes): count ~40% of their projected income
    const fl = filledSlots(S); let exp = 0;
    for (const z of Object.values(S.zones)) if (z.owner === pid && z.type === 'OF') exp += Math.max(0, slotsOf(S, z) - (fl[z.id] || 0)) * (2 + (officeLR(S, z) ? 1 : 0)) * 0.4;
    v += per.b * Math.max(0, H - 1) * exp / cashTarget(S);
  }
  return v;
}
function trySim(S, pid, a) {
  const C = lightClone(S);
  try { const pd = pending(C); if (!pd || pd.type !== 'action') return null; doActionNoAdvance(C, pid, a); } catch (e) { return null; }
  return C;
}
function doActionNoAdvance(S, pid, a) { // apply main effect without advancing the round
  let pv;
  switch (a.type) {
    case 'transit': pv = previewTransit(S, pid, a.spec); if (!pv.ok) throw new Error(pv.errors[0]); applyTransit(S, pid, pv); autoAssign(S, pid); break;
    case 'zone': pv = previewZone(S, pid, a.spec); if (!pv.ok) throw new Error(pv.errors[0]); applyZone(S, pid, pv); optimizeCommutes(S, pid); break;
    case 'upzone': pv = previewUpzone(S, pid, a.spec); if (!pv.ok) throw new Error(pv.errors[0]); applyUpzone(S, pid, pv); break;
    default: pv = previewSimple(S, pid, a); if (!pv.ok) throw new Error(pv.errors[0]); applySimple(S, pid, pv);
  }
}
function ownZoneLots(S, pid) { return Object.values(S.zones).filter(z => z.owner === pid).flatMap(z => z.lots); }
function nearOwn(S, pid, l, k) { return ownZoneLots(S, pid).some(o => lotCheb(o, l) <= k); }
function zoneCandidates(S, pid) {
  const p = S.players[pid]; const out = [];
  const per = p.persona; const own = ownZoneLots(S, pid);
  const ownNodesSet = new Set([...ownNodes(S, pid, 'road'), ...ownNodes(S, pid, 'bike')]);
  const empty = BOARD.lots.filter(l => !BOARD.river.has(l) && !S.lotZone[l] && !(S.reserves[l] && S.reserves[l].pid !== pid) && (own.some(o => lotCheb(o, l) <= 3) || lotCorners(l).some(n => ownNodesSet.has(n))));
  // v0.7: when the local pool is thin, look a little further out
  if (empty.length < 12) BOARD.lots.forEach(l => { if (!BOARD.river.has(l) && !S.lotZone[l] && !empty.includes(l) && !(S.reserves[l] && S.reserves[l].pid !== pid) && own.some(o => lotCheb(o, l) <= 5)) empty.push(l); });
  const types = ZONABLE.filter(t => availableEra(S, pid, ZT[t].era, t));
  const lrNear = types.includes('OF') ? BOARD.lots.filter(l => !BOARD.river.has(l) && !S.lotZone[l] && !empty.includes(l) && !(S.reserves[l] && S.reserves[l].pid !== pid) && svc(S).opStops.some(s => s.mode === 'lr' && anyLotIn(s.node, [l], 1))) : [];
  for (const t of types) {
    let lots = (t === 'OF' ? empty.concat(lrNear) : empty).filter(l => zoneReqCheck(S, pid, t, [l]).length === 0);
    // heuristic order: near own zones, waterfront for homes
    lots = lots.map(l => ({ l, h: (t === 'PK' ? parkLotScore(S, pid, l) : 0) + (t === 'OF' && svc(S).opStops.some(s => s.mode === 'lr' && anyLotIn(s.node, [l], 1)) ? (per === 'money' ? -4 : -2) : 0) + (ZT[t].res && BOARD.water.has(l) ? -2 : 0) + Math.min(...own.map(o => lotCheb(o, l)), 9) + (ZT[t].ind && BOARD.water.has(l) ? 2 : 0) + rngNext(S) * 0.5 })).sort((a, b) => a.h - b.h).slice(0, 2);
    for (const x of lots) out.push({ type: 'zone', spec: { type: t, lots: [x.l] } });
  }
  return out;
}
// v0.5b: Parks have no Pop of their own; value = Livable/Prime for neighbours now and later.
function parkLotScore(S, pid, l) {
  let h = 0;
  for (const a of lotAdj(l)) {
    const zid = S.lotZone[a]; if (zid) { const z = S.zones[zid]; if (z.owner === pid && ZT[z.type].res && z.type !== 'HR') h -= 2; }
    else if (!BOARD.river.has(a)) h -= 0.4;
  }
  return h;
}
function upzoneCandidates(S, pid) {
  const out = [];
  for (const z of Object.values(S.zones)) if (z.owner === pid) for (const t of upzoneTargets(S, pid, z)) out.push({ type: 'upzone', spec: { zid: z.id, to: t.to } });
  return out;
}
function randomPath(S, start, len, okEdge) {
  const path = []; const nodes = [start]; let cur = start;
  for (let i = 0; i < len; i++) {
    const opts = nodeEdges(cur).filter(e => !path.includes(e) && okEdge(e) && !nodes.includes(edgeNodes(e).find(n => n !== cur)));
    if (!opts.length) break; const e = opts[rint(S, opts.length)]; path.push(e); cur = edgeNodes(e).find(n => n !== cur); nodes.push(cur);
  }
  return { path, nodes };
}
function transitCandidates(S, pid) {
  const p = S.players[pid]; const out = []; const per = p.persona;
  const roadNodes = ownNodes(S, pid, 'road'); const sv = svc(S);
  const ownRes = Object.values(S.zones).filter(z => z.owner === pid && ZT[z.type].res);
  const pick = arr => arr[rint(S, arr.length)];
  // roads
  for (let k = 0; k < 4 && roadNodes.length; k++) {
    const { path } = randomPath(S, pick(roadNodes), 2 + rint(S, 3), e => !(S.edges[e] && S.edges[e].road !== undefined) && (!BOARD.crossing.has(e) || BOARD.bridgeSites.includes(e)) && !(S.edges[e] && S.edges[e].hwy !== undefined && BOARD.crossing.has(e)));
    if (path.length) out.push({ type: 'transit', spec: { mode: 'road', edges: path } });
  }
  // bike lanes around own homes
  const bikeNodes = ownNodes(S, pid, 'bike');
  for (const z of ownRes.slice(0, 6)) {
    if (bikeServed(S, z.lots)) continue;
    const border = lotEdges(z.lots[0]).filter(e => !(S.edges[e] && (S.edges[e].bike !== undefined || S.edges[e].hwy !== undefined)) && !BOARD.crossing.has(e));
    let es = border.filter(e => !bikeNodes.length || edgeNodes(e).some(n => bikeNodes.includes(n)));
    if (!es.length && bikeNodes.length) { // connect from nearest own bike node
      const start = bikeNodes.slice().sort((a, b) => lotCheb(nodeLots(a)[0], z.lots[0]) - lotCheb(nodeLots(b)[0], z.lots[0]))[0];
      const { path } = randomPath(S, start, 3, e => !(S.edges[e] && (S.edges[e].bike !== undefined || S.edges[e].hwy !== undefined)) && !BOARD.crossing.has(e));
      if (path.length) out.push({ type: 'transit', spec: { mode: 'bike', edges: path } });
      continue;
    }
    if (es.length) out.push({ type: 'transit', spec: { mode: 'bike', edges: es.slice(0, 2).filter((e, i, a) => i === 0 || edgeNodes(e).some(n => edgeNodes(a[0]).includes(n))) } });
  }
  // bus route
  if (linesOf(S, pid, ['bus']).length < 2 && sv.E.road.size >= 4) {
    const adjOk = e => sv.E.road.has(e);
    for (let k = 0; k < 3; k++) {
      const start = pick(roadNodes.length ? roadNodes : [...sv.E.road].map(e => edgeNodes(e)[0]));
      const { path, nodes } = randomPath(S, start, 6, adjOk);
      if (path.length >= 2) { const st = [nodes[0], nodes[nodes.length - 1]]; if (path.length >= 4) st.splice(1, 0, nodes[2]); out.push({ type: 'transit', spec: { mode: 'bus', edges: path, stations: st } }); }
    }
  } else for (const L of linesOf(S, pid, ['bus'])) if (L.stops.length < 4) {
    const rn = [...new Set(L.edges.flatMap(edgeNodes))].filter(n => L.stops.every(s => (lineGraphDist(L.edges, n)[s] || 0) >= 2));
    if (rn.length) out.push({ type: 'transit', spec: { mode: 'bus', line: L.id, edges: [], stations: [pick(rn)] } });
  }
  // ferry shuttle near own waterfront zones
  if (linesOf(S, pid, ['shuttle', 'river']).length < 1 && p.con !== 'C8') {
    const wz = Object.values(S.zones).filter(z => z.owner === pid && isWaterfront(z.lots));
    for (const z of wz.slice(0, 2)) {
      const near = [...BOARD.riverbank].filter(n => anyLotIn(n, z.lots, 1));
      for (const a of near) { const b = [...BOARD.riverbank].find(n => BOARD.nodeBank(n) !== BOARD.nodeBank(a) && BOARD.nodeBank(n) >= 0 && channelDist(a, n) <= 2); if (b) { out.push({ type: 'transit', spec: { mode: 'shuttle', ops: [{ op: 'open', kind: 'shuttle', docks: [a, b] }] } }); break; } }
    }
  }
  // light rail / heavy rail (Era II+)
  for (const mode of ['lr']) {
    if (!availableEra(S, pid, 2, mode)) continue;
    const L = linesOf(S, pid, [mode])[0];
    if (mode === 'hr' && p.cash < 30 && per !== 'pop') continue;
    const anchorNodes = L ? [...new Set(L.edges.flatMap(edgeNodes))] : ownRes.flatMap(z => lotCorners(z.lots[0])).concat(mode === 'lr' && per !== 'pop' ? ['5:5', '6:6', '5:7', '7:5'] : []);
    for (let k = 0; k < 8 && anchorNodes.length; k++) {
      const start = pick(anchorNodes); const [x, y] = parseK(start);
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]; const [dx, dy] = dirs[rint(S, 4)];
      const len = mode === 'lr' ? perActionLimits(S, pid, 'lr').edges : 4; const edges = []; const nodes = [start];
      for (let i = 0; i < len; i++) { const a = nk(x + dx * i, y + dy * i), b = nk(x + dx * (i + 1), y + dy * (i + 1)); const e = edgeKey(a, b); if (!e || !BOARD.edges.includes(e)) break; if (S.edges[e] && S.edges[e][mode] !== undefined) break; if (mode === 'lr' && BOARD.crossing.has(e) && !BOARD.bridgeSites.includes(e) && p.eng !== 'E8') break; if (mode === 'lr' && S.edges[e] && S.edges[e].hwy !== undefined) break; edges.push(e); nodes.push(b); }
      if (edges.length < 2) continue;
      const st = []; const existing = L ? L.stops : [];
      for (let i = nodes.length - 1; i >= 0 && st.length < (mode === 'lr' ? perActionLimits(S, pid, 'lr').stations : 2); i -= 2) { const n = nodes[i]; const d = lineGraphDist((L ? L.edges : []).concat(edges), n); if (existing.concat(st).every(o => d[o] === undefined || d[o] >= 2)) st.push(n); }
      if (!L && st.length < 2 && nodes.length >= 3) { if (!st.includes(nodes[0])) st.push(nodes[0]); }
      out.push({ type: 'transit', spec: { mode, edges, stations: st, grant: p.permits.includes('FTG') || undefined } });
    }
  }
  // v0.7 freight: road toward an Outside Market connector, then upgrade own road edges from the connector
  if (per !== 'pop') {
    const bfs = (starts, ok, goal, maxLen) => { const prev = {}; const q = []; for (const n of starts) { prev[n] = null; q.push([n, 0]); }
      for (let i = 0; i < q.length; i++) { const [n, d] = q[i]; if (goal(n) && d > 0) { const path = []; let c = n; while (prev[c]) { path.unshift(prev[c][1]); c = prev[c][0]; } return path; } if (d >= maxLen) continue;
        for (const e of nodeEdges(n)) { if (!ok(e)) continue; const m = edgeNodes(e).find(x => x !== n); if (m in prev) continue; prev[m] = [n, e]; q.push([m, d + 1]); } } return null; };
    const conn = new Set(BOARD.connectors);
    if (roadNodes.length && !roadNodes.some(n => conn.has(n))) { const path = bfs(roadNodes, e => !(S.edges[e] && S.edges[e].road !== undefined) && !BOARD.crossing.has(e), n => conn.has(n), 4); if (path && path.length) out.push({ type: 'transit', spec: { mode: 'road', edges: path } }); }
    const fNodes = ownNodes(S, pid, 'hwy'); const starts = fNodes.length ? fNodes : roadNodes.filter(n => conn.has(n));
    const okF = e => S.edges[e] && S.edges[e].road === pid && S.edges[e].hwy === undefined && S.edges[e].bike === undefined && S.edges[e].lr === undefined;
    const ind = Object.values(S.zones).filter(z => z.owner === pid && ZT[z.type].ind);
    if (starts.length) for (const goal of [n => ind.some(z => lotCorners(z.lots[0]).includes(n)), () => true]) { const path = bfs(starts, okF, goal, perActionLimits(S, pid, 'hwy').edges); if (path && path.length) out.push({ type: 'transit', spec: { mode: 'hwy', edges: path } }); }
  }
  return out;
}
function otherCandidates(S, pid) {
  const p = S.players[pid]; const out = [{ type: 'consult' }];
  if (!p.outreachUsed) {
    for (let d = 0; d < 9; d++) if (p.standing[d] < 2 && hasPresence(S, pid, d) && p.cash >= 4) out.push({ type: 'outreach', district: d });
    for (let d = 0; d < 9; d++) if (p.standing[d] >= 1) for (const q of S.players) if (q.id !== pid && q.standing[d] >= 2 && p.cash >= 6) out.push({ type: 'outreach', district: d, target: q.id });
  }
  if (p.cash < 8 && p.bonds < 2 && S.round < S.opts.rounds - 2) out.push({ type: 'finance' });
  if (p.bonds && p.cash > 40) out.push({ type: 'finance', repay: true });
  if (S.era === 3) {
    for (const L of linesOf(S, pid, ['bus'])) if (!L.brt && L.stops.length) out.push({ type: 'program', prog: 'brt', line: L.id });
  }
  if (false && !p.pilotUsed && S.era < 3 && p.cash > 20 && S.round === S.opts.eraEnds[S.era - 1]) { const k = S.era === 1 ? (p.persona === 'money' ? 'OF' : 'lr') : null; if (k && !p.pilot.includes(k)) out.push({ type: 'pilot', key: k }); }
  return out;
}
function aiChooseAction(S, pid) {
  const p = S.players[pid];
  // bonus builds
  if (p.bonus) {
    const c = transitCandidates(S, pid).filter(a => p.bonus.mode ? a.spec.mode === p.bonus.mode : a.spec.mode !== p.bonus.except).map(a => { if (p.bonus.max) a.spec.edges = a.spec.edges.slice(0, p.bonus.max); a.spec.bonus = true; return a; });
    let best = null, bv = aiValue(S, pid);
    for (const a of c) { const C = trySim(S, pid, a); if (!C) continue; const v = aiValue(C, pid); if (v > bv + 0.002) { bv = v; best = a; } }
    return best || { type: 'skipBonus' };
  }
  // free permit uses first
  for (const code of p.permits) {
    if (code === 'CMT') { const d = p.standing.map((v, i) => [v, i]).filter(([v, i]) => v < 2 && hasPresence(S, pid, i)).sort((a, b) => a[0] - b[0])[0]; if (d) return { type: 'permit', code, district: d[1] }; }
    if (code === 'XSH' && p.actionsLeft <= 3) return { type: 'permit', code };
    if (code === 'RID' && Object.values(riderTokens(S)).flat().length) return { type: 'permit', code };
    if (code === 'BKS') { const c = transitCandidates(S, pid).find(a => a.spec.mode === 'bike'); if (c) { const pv = previewTransit(S, pid, { mode: 'bike', edges: c.spec.edges.slice(0, 4), free: 'BKS' }); if (pv.ok) return { type: 'permit', code, edges: c.spec.edges.slice(0, 4) }; } }
  }
  const base = aiValue(S, pid);
  let cands = [...zoneCandidates(S, pid), ...upzoneCandidates(S, pid), ...transitCandidates(S, pid), ...otherCandidates(S, pid)];
  if (p.permits.includes('CLT')) cands.filter(a => a.type === 'zone' && ['CC', 'MP'].includes(a.spec.type)).forEach(a => cands.push({ type: 'zone', spec: Object.assign({}, a.spec, { permit: 'CLT' }) }));
  let best = { type: 'consult' }, bv = -1e9;
  for (const a of cands) {
    const C = trySim(S, pid, a); if (!C) continue;
    let v = aiValue(C, pid);
    if (a.type === 'transit' || (a.type === 'zone' && a.spec.type === 'PK')) { // option value: best follow-up zone/upzone (parks pay off via future Livable neighbours)
      let fv = v; const zc = zoneCandidates(C, pid); const fol = [...zc.slice(0, 10), ...zc.filter(f => f.spec.type === 'OF'), ...upzoneCandidates(C, pid)];
      for (const f of fol) { const C2 = trySim(C, pid, f); if (C2) fv = Math.max(fv, aiValue(C2, pid)); }
      v = v + 0.6 * (fv - v);
    }
    if (a.type === 'consult') v -= 0.01; // prefer building when equal
    v += rngNext(S) * 0.003;
    if (v > bv) { bv = v; best = a; }
  }
  return best;
}
function aiDecide(S, pid) {
  const pd = pending(S); const p = S.players[pid]; const per = p.persona;
  switch (pd.type) {
    case 'partners': {
      const prefE = { pop: ['E5', 'E4', 'E7', 'E3', 'E6', 'E10', 'E2', 'E8', 'E9', 'E1'], money: ['E2', 'E9', 'E1', 'E5', 'E7', 'E4', 'E8', 'E6', 'E10', 'E3'], balanced: ['E7', 'E5', 'E4', 'E2', 'E3', 'E6', 'E8', 'E10', 'E9', 'E1'] }[per] || [];
      const prefC = { pop: ['C1', 'C10', 'C4', 'C3', 'C9', 'C2', 'C5', 'C7', 'C6', 'C8'], money: ['C1', 'C10', 'C6', 'C9', 'C5', 'C4', 'C3', 'C7', 'C2', 'C8'], balanced: ['C1', 'C10', 'C9', 'C4', 'C5', 'C3', 'C6', 'C2', 'C7', 'C8'] }[per] || [];
      const by = (pref, o) => o.slice().sort((a, b) => pref.indexOf(a) - pref.indexOf(b))[0];
      return { eng: by(prefE, pd.offer.eng), con: by(prefC, pd.offer.con) };
    }
    case 'home': {
      const like = { pop: { BP: 2, HO: 1, TR: 2, WE: 1, MO: -1, BA: 0 }, money: { BA: 2, MO: 2, HO: -1, WE: -2, BP: -1, TR: 0 }, balanced: { BA: 1, TR: 1, BP: 1, MO: 0, HO: 0, WE: 0 } }[per];
      let best = -1, bv = -99;
      for (let d = 0; d < 9; d++) { if (d === DOWNTOWN || S.players.some(o => o.home === d) || !homeLayouts(S, d).length) continue; const v = S.councils[d].reduce((a, b) => a + (like[b] || 0), 0) + (RIVER_DISTRICTS.includes(d) ? 0.5 : 0) + rngNext(S); if (v > bv) { bv = v; best = d; } }
      return { district: best };
    }
    case 'petition': return { slot: null };
    case 'bid': { const mx = Math.max(0, Math.min(p.cash - 5, Math.floor(p.cash / 10) + rint(S, 2))); return { amount: Math.max(0, mx) }; }
    case 'stadium': return { amount: Math.max(0, Math.min(p.cash - 10, 2 + rint(S, 3))) };
    case 'stadium_place': { const own = ownZoneLots(S, pid); const l = BOARD.lots.filter(l => !BOARD.river.has(l) && !S.lotZone[l] && roadServed(S, [l])).sort((a, b) => Math.min(...own.map(o => lotCheb(o, a)), 9) - Math.min(...own.map(o => lotCheb(o, b)), 9))[0] || BOARD.lots.find(l => !BOARD.river.has(l) && !S.lotZone[l]); return { lot: l }; }
    case 'permit': {
      const pref = { pop: ['XSH', 'CLT', 'CMT', 'FTG', 'TAX', 'BKS', 'VAR', 'EXP', 'DEV', 'RID', 'PRP', 'HEX', 'LAS'], money: ['TAX', 'XSH', 'FTG', 'CMT', 'HEX', 'RID', 'PRP', 'EXP', 'DEV', 'BKS', 'CLT', 'VAR', 'LAS'], balanced: ['XSH', 'TAX', 'CMT', 'FTG', 'CLT', 'BKS', 'EXP', 'RID', 'VAR', 'DEV', 'HEX', 'PRP', 'LAS'] }[per];
      return { code: S.permitMarket.slice().sort((a, b) => pref.indexOf(a) - pref.indexOf(b))[0] };
    }
    case 'election': {
      const C = pd.candidates; const sc = C.map(c => endorsements(S, pid, c) * 2 + MAYORS[c].allies.reduce((a, b) => a + ({ pop: { BP: 1, TR: 1, HO: 0.5 }, money: { BA: 1, MO: 1 }, balanced: { TR: 0.5, BA: 0.5 } }[per][b] || 0), 0) + rngNext(S));
      const cand = sc[0] >= sc[1] ? 0 : 1; return { candidate: cand, amount: Math.min(p.cash > 25 ? 3 : p.cash > 10 ? 1 : 0, p.cash) };
    }
    case 'hq': {
      let best = null;
      for (const l of BOARD.lots) for (const m of lotAdj(l)) {
        if (m < l) continue; const site = [l, m]; if (hqSiteErrors(S, pid, site).length) continue;
        const a = { site, pledge: per === 'money' ? 2 : per === 'pop' ? 8 : 6, incentive: Math.min(per === 'money' ? 6 : 3, p.cash) };
        const sc = hqScore(S, pid, a).total; if (!best || sc > best.sc) best = { sc, a };
      }
      return best ? best.a : { pass: true };
    }
    case 'action': return aiChooseAction(S, pid);
  }
}
// run AI players until a human input is required (or game over). Returns number of AI steps.
function runAI(S, maxSteps) {
  let n = 0; maxSteps = maxSteps || 100000;
  while (S.phase !== 'over' && n < maxSteps) {
    const pd = pending(S); if (!pd) break; const p = S.players[pd.pid];
    if (p.kind !== 'ai') break;
    const a = aiDecide(S, pd.pid);
    try { act(S, pd.pid, a); }
    catch (e) {
      // fallback: always-legal choices
      if (pd.type === 'action') { if (p.bonus) act(S, pd.pid, { type: 'skipBonus' }); else act(S, pd.pid, { type: 'consult' }); }
      else if (pd.type === 'bid' || pd.type === 'stadium') act(S, pd.pid, { amount: 0 });
      else if (pd.type === 'hq') act(S, pd.pid, { pass: true });
      else if (pd.type === 'election') act(S, pd.pid, { candidate: 0, amount: 0 });
      else throw e;
    }
    n++;
  }
  return n;
}
const API = { COLS, N, PLAYER_COLORS, DISTRICTS, RIVER_DISTRICTS, DOWNTOWN, BOARDS, ZT, LADDER, ZONABLE, MODES, FARE, PERMIT_INFO, CONTRACTORS, ENGINEERS, MAYORS, CORPS, EVENTS, BOARD, lk, nk, parseK, lotName, nodeName, edgeName, edgeNodes, edgeKey, edgeLots, lotEdges, lotCorners, nodeLots, lotDistrict, walkLots, inWalk, edgeDistricts, nodeDistricts, newGame, pending, act, advance, previewTransit, previewZone, previewUpzone, previewSimple, previewDemolish, upzoneTargets, zoneReqCheck, evalCity, incomeStatement, playerPop, progressOf, cashTarget, congestion, overhead, upkeepOf, svc, isOp, opKey, filledSlots, slotsOf, validJobsFor, riderTokens, homeLayouts, hqSiteErrors, hqScore, mandateCount, endorsements, standingName, netWorth, aiDecide, runAI, clone, lightClone, linesOf, ownedEdges, perActionLimits, roadServed, bikeServed, transitServed, lineLabel, zoneLabel, autoAssign, validateCommutes, applyTransit, applyZone, applyUpzone, applySimple, newZone, touch, hasPresence, PERSONA, channelDist, eventIs, availableEra, lineClosed, findRoute, moveStanding, setWorkers };
root.ROW = API; if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
