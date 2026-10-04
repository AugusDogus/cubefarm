export type CultivarId = 'generalist' | 'processor' | 'specialist' | 'executive';
export type GeneId = 'focus' | 'endurance' | 'precision' | 'cognition' | 'synthesis';
export type FacilityId = 'coffee' | 'snacks' | 'cafeteria' | 'gym' | 'benefits';
export type UpgradeId = 'equipment' | 'training' | 'memo' | 'quality' | 'capacity';
export const BASE_CAPACITY = 9;

export const cultivars: Record<CultivarId, { name: string; description: string; rate: number; price: number; slack: number; breaks: number; bugs: number; unlock: number; research: number }> = {
  generalist: { name: 'Generalist', description: 'An adaptable, reasonably motivated office perennial.', rate: 0.65, price: 35, slack: 0.16, breaks: 0.14, bugs: 0.08, unlock: 0, research: 0 },
  processor: { name: 'Processor', description: 'Fast-growing. Thrives on repetitive paperwork.', rate: 1.3, price: 95, slack: 0.13, breaks: 0.18, bugs: 0.1, unlock: 150, research: 80 },
  specialist: { name: 'Specialist', description: 'Careful and dependable. 2.5 times research yield at headquarters.', rate: 2.2, price: 260, slack: 0.07, breaks: 0.1, bugs: 0.035, unlock: 750, research: 300 },
  executive: { name: 'Executive', description: 'An expensive hybrid. Somehow produces actual work.', rate: 4.8, price: 850, slack: 0.06, breaks: 0.09, bugs: 0.025, unlock: 3500, research: 1100 },
};

export const genes: Record<GeneId, { name: string; description: string; cost: number; unlock: number; requires: readonly GeneId[] }> = {
  focus: { name: 'Sustained focus', description: '70% less slacking. +20% research yield.', cost: 180, unlock: 300, requires: [] },
  endurance: { name: 'Desk endurance', description: '65% fewer breaks. +80% compliance yield. +15% payroll for metabolic support.', cost: 220, unlock: 300, requires: [] },
  precision: { name: 'Error correction', description: '50% fewer bugs. +50% research yield.', cost: 240, unlock: 300, requires: [] },
  cognition: { name: 'Accelerated cognition', description: '+35% output. 75% more bugs before quality controls.', cost: 600, unlock: 1200, requires: ['focus', 'precision'] },
  synthesis: { name: 'Corporate synthesis', description: '+60% output. +50% payroll. 35% less research yield.', cost: 1800, unlock: 5000, requires: ['cognition', 'endurance'] },
};

export const facilities: Record<FacilityId, { name: string; description: string; cost: number; unlock: number }> = {
  coffee: { name: 'Coffee station', description: '60% fewer breaks. Adds 2 target morale. Shared facilities benefit every office.', cost: 25, unlock: 150 },
  snacks: { name: 'Complimentary snacks', description: '50% less slacking. Adds 3 target morale. More useful as the workforce grows.', cost: 45, unlock: 250 },
  cafeteria: { name: 'Cafeteria', description: '50% fewer remaining breaks. Adds 8 target morale.', cost: 380, unlock: 1200 },
  gym: { name: 'Company gym', description: '60% fewer bugs. Adds 5 target morale.', cost: 650, unlock: 3000 },
  benefits: { name: 'Health benefits', description: '40% less slacking and 50% fewer bugs. Adds 12 target morale.', cost: 1200, unlock: 6000 },
};

export const upgrades: Record<UpgradeId, { name: string; description: string; baseCost: number; max: number }> = {
  equipment: { name: 'Office equipment', description: '+20% paperwork productivity per level.', baseCost: 50, max: 12 },
  training: { name: 'Workflow training', description: '10% less slacking and fewer breaks per level.', baseCost: 85, max: 8 },
  memo: { name: 'Memo effectiveness', description: '+20 percentage points to the memo boost.', baseCost: 75, max: 6 },
  quality: { name: 'Quality assurance', description: '20% fewer paperwork bugs per level.', baseCost: 100, max: 8 },
  capacity: { name: 'Expand the cube farm', description: 'Up to double your cubicle capacity, capped at 256.', baseCost: 160, max: 5 },
};

export const market = [
  { name: 'Omnicorp International', revenue: 100000 },
  { name: 'Consolidated Holdings', revenue: 30000 },
  { name: 'Synergy Industries', revenue: 10000 },
  { name: 'Globex Corporation', revenue: 3000 },
  { name: 'Initech', revenue: 750 },
  { name: 'Wernham Hogg', revenue: 150 },
] as const;
