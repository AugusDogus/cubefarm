import { actTender, type TenderAction } from './tender';
import { BASE_CAPACITY, cultivars, facilities, genes, upgrades, type CultivarId, type FacilityId, type GeneId, type UpgradeId } from './catalog';
import { initialState, type Employee, type GameState } from './state';
import { actStrategy, type StrategyAction } from './strategy';
import { climate, departmentRate, employeeRate, memoBoost, risks } from './workforce';
export { climate, employeeRate, memoBoost, risks } from './workforce';
import { estimatedIncome, tickEconomy, supplyCost, type DepartmentOutput } from './economy';
import { branchProduction, rivalRevenue } from './expansion';
import { rivalIds } from './corporation';
import { record as log } from './log';
import { discovery, facilityVisible, upgradeVisible } from './discovery';
import { geneEffects } from './genome';
import { pendingLetter, letters, type LetterId, type StoryReply } from './story';
import { tickAutomation } from './automation';

export const PAPER_VALUE = 1.25;
export const WAGE = 0.09;
export const MEMO_COST = 20;
export type Outcome = { ok: true; state: GameState } | { ok: false; message: string };
export type Action = TenderAction | StrategyAction
  | { type: 'process' }
  | { type: 'hire'; cultivar: CultivarId; count?: number }
  | { type: 'release'; id: number; method: 'sell' | 'fire' }
  | { type: 'staff-transfer'; ids: number[] }
  | { type: 'staff-replace'; ids: number[]; cultivar: CultivarId }
  | { type: 'upgrade'; id: UpgradeId; count?: number }
  | { type: 'research-cultivar'; id: CultivarId }
  | { type: 'research-gene'; id: GeneId }
  | { type: 'facility'; id: FacilityId }
  | { type: 'memo' }
  | { type: 'genome'; genes: GeneId[] }
  | { type: 'read-letter'; id: LetterId }
  | ({ type: 'reply' } & StoryReply)
  | { type: 'pause' };

const firstNames = ['Taylor', 'Jordan', 'Casey', 'Robin', 'Drew', 'Avery', 'Riley', 'Quinn', 'Charlie', 'Emerson'];
const surnames = ['Park', 'Patel', 'Williams', 'Nguyen', 'Reed', 'Garcia', 'Kim', 'Bennett', 'Foster', 'Clarke'];
export function capacity(state: GameState) { return Math.min(256, BASE_CAPACITY * 2 ** state.upgrades.capacity); }
export function hireCost(state: GameState, cultivar: CultivarId) { return Math.ceil(cultivars[cultivar].price * 1.025 ** state.employees.length); }
export function upgradeCost(state: GameState, id: UpgradeId) { return Math.ceil(upgrades[id].baseCost * 1.8 ** state.upgrades[id]); }
export function hireQuote(state: GameState, cultivar: CultivarId, limit = capacity(state) - state.employees.length) {
  let count = 0, cost = 0;
  while (count < limit && state.employees.length + count < capacity(state)) {
    const next = Math.ceil(cultivars[cultivar].price * 1.025 ** (state.employees.length + count));
    if (cost + next > state.cash) break;
    cost += next; count++;
  }
  return { count, cost };
}
export function upgradeQuote(state: GameState, id: UpgradeId) {
  let count = 0, cost = 0;
  while (state.upgrades[id] + count < upgrades[id].max) {
    const next = Math.ceil(upgrades[id].baseCost * 1.8 ** (state.upgrades[id] + count));
    if (cost + next > state.cash) break;
    cost += next; count++;
  }
  return { count, cost };
}
export function saleValue(employee: Employee) { return Math.floor(employee.hiredCost * 0.4 * employee.aptitude); }
export function staffTransferQuote(state: GameState, ids: readonly number[]) {
  const selected = state.employees.filter(e => ids.includes(e.id));
  if (ids.length === 0 || new Set(ids).size !== ids.length || selected.length !== ids.length || selected.some(e => e.role !== 'operations')) return null;
  return { refund: selected.reduce((sum, e) => sum + saleValue(e), 0) };
}
export function staffReplacementQuote(state: GameState, ids: readonly number[], cultivar: CultivarId) {
  const transfer = staffTransferQuote(state, ids);
  if (!transfer) return null;
  const remaining = state.employees.length - ids.length;
  const cost = ids.reduce((sum, _, index) => sum + Math.ceil(cultivars[cultivar].price * 1.025 ** (remaining + index)), 0);
  return { ...transfer, cost, net: cost - transfer.refund };
}

export function production(state: GameState) { return state.paused || state.corporation.phase.id === 'ending' ? 0 : state.employees.reduce((sum, e) => sum + (e.activity === 'working' && e.role === 'operations' ? employeeRate(state, e) : 0), 0) + branchProduction(state); }
export function netIncome(state: GameState) { return state.paused || state.corporation.phase.id === 'ending' ? 0 : estimatedIncome(state, production(state)) + (state.corporation.phase.id === 'network' ? state.corporation.phase.network.processedRate * 0.06 : 0); }
export function rank(state: GameState) { return rivalIds.filter(id => !state.corporation.acquired.includes(id) && rivalRevenue(state, id) > state.revenue).length + 1; }

function success(state: GameState, message: string): Outcome { return { ok: true, state: log(state, message) }; }
function fail(message: string): Outcome { return { ok: false, message }; }

export function act(state: GameState, action: Action, random: () => number = Math.random): Outcome {
  if (state.corporation.phase.id === 'ending' && action.type !== 'reincorporate' && action.type !== 'pause' && action.type !== 'read-letter' && action.type !== 'inspect-discoveries') return fail('The company’s story is complete. Reincorporate to start a new run.');
  switch (action.type) {
    case 'tender-draw':
    case 'tender-bid':
    case 'tender-decline': return actTender(state, action, random);
    case 'process': {
      if (!Number.isSafeInteger(state.manualPapers + 1)) return fail('The filing counter has reached its numeric limit. Export this company and reincorporate after completion.');
      if (state.paused) return fail('Resume operations before filing a form.');
      if (state.manualCooldown > 0) return fail('The stamp is still returning. File the next form in a moment.');
      const emergency = state.corporation.blankForms < 1;
      return { ok: true, state: celebrate({ ...state,
        cash: state.cash + (emergency ? PAPER_VALUE : 0), revenue: state.revenue + (emergency ? PAPER_VALUE : 0),
        paperwork: state.paperwork + 1, manualPapers: state.manualPapers + 1, manualCooldown: 0.35,
        corporation: { ...state.corporation, emergencyReserve: emergency ? Math.min(supplyCost(state), state.corporation.emergencyReserve + PAPER_VALUE) : 0, blankForms: emergency ? state.corporation.blankForms : state.corporation.blankForms - 1, inventory: state.corporation.inventory + (emergency ? 0 : 1) },
      }) };
    }
    case 'pause': return { ok: true, state: { ...state, paused: !state.paused } };
    case 'hire': {
      if (!discovery(state).hiring) return fail('File a few forms before placing a hiring notice.');
      if (!state.unlockedCultivars.includes(action.cultivar)) return fail('Research this cultivar before hiring.');
      if (state.employees.length >= capacity(state)) return fail('All cubicles are occupied. Expand the cube farm to hire more employees.');
      const count = action.count ?? 1;
      if (!Number.isInteger(count) || count < 1 || count > 256) return fail('Choose between 1 and 256 employees.');
      if (!Number.isSafeInteger(state.nextId + count)) return fail('Employee identifiers have reached their numeric limit. Your existing workforce is unchanged.');
      const quote = hireQuote(state, action.cultivar, count);
      if (quote.count !== count) return fail(`Hiring ${count} requires available cubicles and funds. One hire costs $${hireCost(state, action.cultivar)}.`);
      const employees = Array.from({ length: count }, (_, i): Employee => {
        const id = state.nextId + i;
        return { id, name: id === 1 ? 'Robin Park' : `${firstNames[(id - 1) % firstNames.length] ?? 'Taylor'} ${surnames[Math.floor(random() * surnames.length)] ?? 'Park'}`, cultivar: action.cultivar, genes: [...state.genome], aptitude: 0.85 + random() * 0.3, hiredCost: Math.ceil(cultivars[action.cultivar].price * 1.025 ** (state.employees.length + i)), produced: 0, activity: 'working', role: 'operations', remaining: 5 + random() * 5 };
      });
      return success({ ...state, cash: state.cash - quote.cost, employees: [...state.employees, ...employees], nextId: state.nextId + count }, `${count === 1 ? employees[0]?.name : `${count} employees`} hired. ${cultivars[action.cultivar].name}. Traits fixed at hire.`);
    }
    case 'release': {
      const employee = state.employees.find(e => e.id === action.id);
      if (!employee) return fail('This employee has already left the company.');
      const refund = action.method === 'sell' ? saleValue(employee) : 0;
      return success({ ...state, cash: state.cash + refund, employees: state.employees.filter(e => e.id !== action.id) }, action.method === 'sell' ? `${employee.name} transferred. $${refund} placement fee received.` : `${employee.name} fired. Cubicle available for a new hire.`);
    }
    case 'staff-transfer':
    case 'staff-replace': {
      if (!state.corporation.projects.includes('charter')) return fail('Incorporate before arranging workforce transfers in bulk.');
      const quote = staffTransferQuote(state, action.ids);
      if (!quote) return fail('Choose distinct operations employees who are still on the payroll. Department staff are protected.');
      const transferred = { ...state, cash: state.cash + quote.refund, employees: state.employees.filter(e => !action.ids.includes(e.id)) };
      if (action.type === 'staff-transfer') return success(transferred, `${action.ids.length} operations employees transferred. $${quote.refund} placement fees received.`);
      const hired = act(transferred, { type: 'hire', cultivar: action.cultivar, count: action.ids.length }, random);
      return hired.ok ? success(hired.state, `${action.ids.length} operations employees replaced. Departing people retain their traits; new hires use the current profile.`) : hired;
    }
    case 'upgrade': {
      if (!upgradeVisible(state, action.id)) return fail('This improvement is not relevant to the office yet.');
      if (state.upgrades[action.id] >= upgrades[action.id].max) return fail('This upgrade is already complete.');
      const count = action.count ?? 1;
      if (!Number.isInteger(count) || count < 1 || count > upgrades[action.id].max) return fail('Choose a valid number of upgrade levels.');
      const quote = upgradeQuote(state, action.id);
      if (quote.count < count) return fail(`This upgrade requires sufficient funds and available levels. Next level costs $${upgradeCost(state, action.id)}.`);
      const cost = Array.from({ length: count }, (_, i) => Math.ceil(upgrades[action.id].baseCost * 1.8 ** (state.upgrades[action.id] + i))).reduce((sum, n) => sum + n, 0);
      return success({ ...state, cash: state.cash - cost, upgrades: { ...state.upgrades, [action.id]: state.upgrades[action.id] + count } }, `${upgrades[action.id].name} upgraded to level ${state.upgrades[action.id] + count}.`);
    }
    case 'research-cultivar': {
      const cultivar = cultivars[action.id];
      if (state.unlockedCultivars.includes(action.id)) return fail('This cultivar is already available.');
      if (state.revenue < cultivar.unlock) return fail(`Earn $${cultivar.unlock} in lifetime revenue to research this cultivar.`);
      if (state.cash < cultivar.research) return fail(`Research requires $${cultivar.research}. Existing employees remain unchanged.`);
      return success({ ...state, cash: state.cash - cultivar.research, unlockedCultivars: [...state.unlockedCultivars, action.id] }, `${cultivar.name} recruitment profile available. Existing employees retain their traits.`);
    }
    case 'research-gene': {
      if (!discovery(state).genetics) return fail('Open the workforce cultivation lab before researching inherited traits.');
      const gene = genes[action.id];
      if (state.genes.includes(action.id)) return fail('This gene has already been researched.');
      if (state.revenue < gene.unlock) return fail(`Earn $${gene.unlock} in lifetime revenue to unlock this gene.`);
      if (!gene.requires.every(id => state.genes.includes(id))) return fail('Research the prerequisite genes first.');
      if (state.cash < gene.cost) return fail(`Gene research requires $${gene.cost}. Existing employees remain unchanged.`);
      return success({ ...state, cash: state.cash - gene.cost, genes: [...state.genes, action.id] }, `${gene.name} researched. Applies to future hires only.`);
    }
    case 'facility': {
      if (!facilityVisible(state, action.id)) return fail('This incentive is not available to the office yet.');
      const facility = facilities[action.id];
      if (state.facilities.includes(action.id)) return fail('This facility is already installed.');
      if (state.revenue < facility.unlock) return fail(`Earn $${facility.unlock} in lifetime revenue to install this facility.`);
      if (state.cash < facility.cost) return fail(`This facility requires $${facility.cost}. Keep processing paperwork.`);
      return success({ ...state, cash: state.cash - facility.cost, facilities: [...state.facilities, action.id] }, `${facility.name} installed. Benefits apply to the entire workforce.`);
    }
    case 'memo': {
      if (state.revenue < 400) return fail('The office needs a larger workflow before circulating memos.');
      if (state.memo.status !== 'ready') return fail('The previous memo is still circulating. Wait for the cooldown to finish.');
      if (state.cash < MEMO_COST) return fail('Circulating a memo requires $20. Process more paperwork first.');
      return success({ ...state, cash: state.cash - MEMO_COST, memo: { status: 'active', remaining: 90 } }, `Memo circulated: consolidate redundant workflows. +${Math.round(memoBoost(state) * 100)}% productivity for 90 seconds.`);
    }
    case 'genome': {
      if (!discovery(state).genetics) return fail('Open the cultivation lab first.');
      if (action.genes.length > 2 || new Set(action.genes).size !== action.genes.length || action.genes.some(id => !state.genes.includes(id))) return fail('Select up to two distinct researched genes. Existing workers keep their traits.');
      return success({ ...state, genome: [...action.genes] }, 'Hiring profile changed. Existing people remain unchanged.');
    }
    case 'read-letter': {
      if (pendingLetter(state) !== action.id || action.id === 'promise' && state.story.promise === 'undecided' || action.id === 'cultivation' && state.story.cultivation === 'undecided') return fail('Read the current correspondence and reply where a decision is requested.');
      return { ok: true, state: { ...state, story: { ...state.story, read: [...state.story.read, action.id] } } };
    }
    case 'reply': {
      if (!letters[action.letter].ready(state) || state.story[action.letter] !== 'undecided') return fail('This decision is unavailable or has already been made.');
      const story = action.letter === 'promise' ? { ...state.story, promise: action.choice } : { ...state.story, cultivation: action.choice };
      const read = story.read.includes(action.letter) ? story.read : [...story.read, action.letter];
      return success({ ...state, story: { ...story, read } }, `${action.letter === 'promise' ? 'Robin' : 'Imani'} received your reply. The commitment is permanent for this company.`);
    }
    default: return actStrategy(state, action);
  }
}

/** Advance in one-second slices so simulation and offline earnings share the same rules. */
export function advance(state: GameState, seconds: number, random: () => number = Math.random): GameState {
  if (state.paused || state.corporation.phase.id === 'ending' || !Number.isFinite(seconds) || seconds <= 0) return state;
  let next = state;
  for (let remaining = Math.min(seconds, 7200); remaining > 0; remaining -= 1) next = tick(next, Math.min(1, remaining), random);
  return next;
}

function tick(state: GameState, dt: number, random: () => number): GameState {
  state = tickAutomation(state);
  const output: DepartmentOutput = { operations: 0, research: 0, sales: 0, compliance: 0 };
  const producedByEmployee = new Map<number, number>();
  const employees = state.employees.map(employee => {
    let active = employee.activity;
    let remaining = employee.remaining;
    if (remaining <= 0) {
      if (active === 'working') {
        const chance = random();
        const risk = risks(state, employee);
        active = chance < risk.bugs ? 'rework' : chance < risk.bugs + risk.slack ? 'slacking' : chance < risk.bugs + risk.slack + risk.breaks ? 'break' : 'working';
      } else active = 'working';
      remaining = active === 'working' ? 5 + random() * 5 : 3 + random() * 3;
    }
    const produced = active === 'working' ? employeeRate(state, employee) * dt : 0;
    const roleOutput = active === 'working' ? departmentRate(state, employee) * dt : 0;
    output[employee.role] += roleOutput * (employee.role === 'research' ? geneEffects(employee.genes).research : 1);
    producedByEmployee.set(employee.id, employee.role === 'operations' ? produced : 0);
    return { ...employee, activity: active, remaining: Math.max(0, remaining - dt) };
  });
  let memo = state.memo;
  if (memo.status !== 'ready') {
    const left = memo.remaining - dt;
    memo = left > 0 ? { ...memo, remaining: left } : memo.status === 'active' ? { status: 'cooldown', remaining: 90 } : { status: 'ready' };
  }
  const workingState = { ...state, employees, memo, elapsed: state.elapsed + dt, manualCooldown: Math.max(0, state.manualCooldown - dt) };
  let next = tickEconomy(workingState, dt, output);
  const potential = output.operations + branchProduction(workingState) * dt;
  const supplied = potential > 0 ? Math.min(1, next.corporation.outputRate * dt / potential) : 0;
  next = { ...next, employees: employees.map(e => ({ ...e, produced: e.produced + (producedByEmployee.get(e.id) ?? 0) * supplied })) };
  next = celebrate(next);
  if (climate(state).name !== climate(next).name) next = log(next, `${climate(next).name}. ${climate(next).description}`);
  const oldRank = rank(state), newRank = rank(next);
  if (newRank < oldRank) next = log(next, `Market standing improved to #${newRank}. ${newRank === 1 ? 'You lead the market.' : 'The competition has noticed.'}`);
  return next;
}

function celebrate(state: GameState): GameState {
  return !state.won && state.revenue >= 100000 && rank(state) === 1 ? log({ ...state, won: true }, 'Cube Farm is the highest-grossing corporation. The board is pleased. Growth may continue.') : state;
}

export const Game = { initial: initialState, act, advance, capacity, hireCost, upgradeCost, saleValue, risks, employeeRate, production, netIncome, rank } as const;
