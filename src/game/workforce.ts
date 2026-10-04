import { cultivars } from './catalog';
import { departmentBonus, outputModifier } from './conditions';
import type { Employee, GameState } from './state';
import { geneEffects } from './genome';

export function memoBoost(state: GameState) { return 0.4 + state.upgrades.memo * 0.2; }

const climates = [
  { name: 'Business as usual', description: 'A quiet day at the office.', productivity: 1, bugs: 1, slack: 1 },
  { name: 'Quarter-end rush', description: '+20% productivity. 10% more slacking.', productivity: 1.2, bugs: 1, slack: 1.1 },
  { name: 'Audit season', description: '10% slower paperwork. 25% fewer bugs.', productivity: 0.9, bugs: 0.75, slack: 1 },
  { name: 'Fresh fiscal year', description: 'New targets. +10% productivity.', productivity: 1.1, bugs: 1, slack: 1 },
] as const;
export function climate(state: GameState) { return climates[Math.floor(state.elapsed / 180) % climates.length] ?? climates[0]; }

export function risks(state: GameState, employee: Pick<Employee, 'cultivar' | 'genes'>) {
  const base = cultivars[employee.cultivar];
  const gene = geneEffects(employee.genes);
  return {
    slack: base.slack * climate(state).slack * (1 + Math.max(0, 60 - state.corporation.morale) / 80) * 0.9 ** state.upgrades.training * gene.slack * (state.facilities.includes('snacks') ? 0.5 : 1) * (state.facilities.includes('benefits') ? 0.6 : 1),
    breaks: base.breaks * 0.9 ** state.upgrades.training * gene.breaks * (state.facilities.includes('coffee') ? 0.4 : 1) * (state.facilities.includes('cafeteria') ? 0.5 : 1),
    bugs: base.bugs * climate(state).bugs * (state.corporation.projects.includes('standards') ? 0.8 : 1) * (1 - Math.min(0.5, state.employees.filter(e => e.role === 'compliance').length * 0.05 * departmentBonus(state, 'compliance'))) * 0.8 ** state.upgrades.quality * gene.bugs * (state.facilities.includes('gym') ? 0.4 : 1) * (state.facilities.includes('benefits') ? 0.5 : 1),
  };
}

export function employeeRate(state: GameState, employee: Employee) {
  return cultivars[employee.cultivar].rate * employee.aptitude * climate(state).productivity * (1 + state.upgrades.equipment * (state.corporation.projects.includes('centralization') ? 0.3 : 0.2)) * outputModifier(state)
    * geneEffects(employee.genes).output
    * (state.memo.status === 'active' ? 1 + memoBoost(state) : 1);
}

export function departmentRate(state: GameState, employee: Employee) {
  const specialty = employee.role === 'research' && employee.cultivar === 'specialist' ? 2.5 : employee.role === 'sales' && employee.cultivar === 'executive' ? 2 : 1;
  const gene = geneEffects(employee.genes);
  return employeeRate(state, employee) * specialty / (employee.role === 'research' || employee.role === 'compliance' ? gene.output : 1) * (employee.role === 'compliance' ? gene.compliance : 1);
}
export function departmentYield(state: GameState, employee: Employee): { value: number; unit: string } {
  const rate = departmentRate(state, employee), c = state.corporation;
  switch (employee.role) {
    case 'operations': return { value: rate, unit: 'forms' };
    case 'research': return { value: rate * 0.12 * geneEffects(employee.genes).research * departmentBonus(state, 'research') * (c.crisis.status === 'effect' ? c.crisis.research : 1), unit: 'insights' };
    case 'sales': return { value: rate * 0.02 * departmentBonus(state, 'sales') * (c.projects.includes('continental') ? 1.5 : 1), unit: 'influence' };
    case 'compliance': return { value: rate * 0.04 * departmentBonus(state, 'compliance'), unit: 'pressure relief' };
  }
}
