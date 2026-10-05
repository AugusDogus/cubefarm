import { cultivars, type CultivarId } from './catalog';
import { contracts, rivals, type ContractId, type Policy, type RivalId, type Role } from './corporation';
import { branchCost, branchStaff, branchUpgradeCost, cohortCost, acquisitionCost, totalEmployees } from './expansion';
import { marketingCost, supplyCost } from './economy';
import { crisisCost, resolveCrisis, type CrisisChoice } from './events';
import { initialNetwork, networkPlan, protocols, assetCost, allocate, WORLD_WORKFLOWS, type AllocationKey, type ProtocolId, type ComputeRouting, type CapitalPolicy } from './network';
import { commissionNetwork, type CommissionResult } from './network-capital';
import { operatingReserve } from './automation';
import { projects, projectReason, type ProjectId } from './projects';
import { initialState, type GameState } from './state';
import { record } from './log';
import type { Outcome } from './engine';
import { commonsSettlement } from './story';
import { departmentYield, risks } from './workforce';
import { normalizePrice } from './price';
import { inspectDiscoveries, type WorkspaceId } from './discovery-feedback';
import { settleContractReceipt } from './contracts';
import { settlePendingTender } from './tender';
import { learningAnchors, recordLearning } from './learning';

export type StrategyAction =
  | { type: 'inspect-discoveries'; workspaces: WorkspaceId[]; projects: ProjectId[]; protocols?: ProtocolId[] }
  | { type: 'network-commission'; count: number }
  | { type: 'network-routing'; routing: ComputeRouting }
  | { type: 'network-investment'; policy: CapitalPolicy }
  | { type: 'network-knowledge-reserve'; value: number }
  | { type: 'supplier-relief' }
  | { type: 'supplies'; packs: number }
  | { type: 'price'; value: number }
  | { type: 'marketing' }
  | { type: 'auto-buy' }
  | { type: 'review' }
  | { type: 'project'; id: ProjectId }
  | { type: 'assign'; id: number; role: Role }
  | { type: 'staff'; research: number; sales: number; compliance: number }
  | { type: 'automation'; memos: boolean; contracts: GameState['automation']['contracts']; allocation?: 'half' | 'all'; reserve: number }
  | { type: 'policy'; policy: Policy }
  | { type: 'contract'; id: ContractId }
  | { type: 'contract-allocation'; allocation: 'half' | 'all' }
  | { type: 'cancel-contract' }
  | { type: 'crisis'; choice: CrisisChoice }
  | { type: 'acquire'; id: RivalId }
  | { type: 'branch' }
  | { type: 'branch-upgrade'; id: number; count?: number }
  | { type: 'cohort'; branch: number; cultivar: CultivarId; count: number }
  | { type: 'cohort-release'; branch: number; index: number }
  | { type: 'cohort-replace'; branch: number; index: number; cultivar: CultivarId }
  | { type: 'allocate'; key: AllocationKey; value: number }
  | { type: 'network-plan'; plan: 'grow' | 'survey' | 'clear' }
  | { type: 'network-building'; policy: 'manual' | 'balanced' }
  | { type: 'network-asset'; asset: 'plants' | 'servers'; count: number }
  | { type: 'protocol'; id: ProtocolId }
  | { type: 'ending'; ending: 'monopoly' | 'commons' }
  | { type: 'reincorporate' }
  | { type: 'legacy'; id: 'founding' | 'research' | 'welfare' };
const fail = (message: string): Outcome => ({ ok: false, message });
const success = (state: GameState, message?: string): Outcome => ({ ok: true, state: message ? record(state, message) : state });
export function actStrategy(state: GameState, action: StrategyAction): Outcome {
  const c = state.corporation;
  switch (action.type) {
    case 'inspect-discoveries': return success({ ...state, discoveryRecord: inspectDiscoveries(state, state.discoveryRecord, { workspaces: action.workspaces, projects: action.projects, protocols: action.protocols ?? [] }) });
    case 'supplier-relief': {
      if (c.phase.id === 'network' || c.phase.id === 'ending' || totalEmployees(state) === 0) return fail('Supplier relief is for a staffed company that has run out of supplies.');
      if (c.supplierReliefUsed) return fail('The free supplier pack has already been claimed for this company. Use emergency filing to rebuild your supply budget.');
      if (c.blankForms >= 1 || state.cash >= supplyCost(state)) return fail('Supplier relief is available when no usable forms remain and you cannot afford a pack.');
      return success({ ...state, corporation: { ...c, blankForms: c.blankForms + 250, supplierReliefUsed: true } }, 'The supplier provided 250 free blank forms. This relief is available once per company. Research Automatic procurement to handle future orders.');
    }
    case 'supplies': {
      if (!Number.isInteger(action.packs) || action.packs < 1 || action.packs > 1000) return fail('Choose between 1 and 1,000 supply packs.');
      const cost = supplyCost(state, action.packs);
      if (state.cash < cost) return fail(`Supplies require $${cost}. Manual filing can earn the difference.`);
      return success({ ...state, cash: state.cash - cost, corporation: { ...c, emergencyReserve: 0, blankForms: c.blankForms + action.packs * 250, supplySpent: c.supplySpent + cost } });
    }
    case 'price': {
      const price = normalizePrice(action.value);
      if (price === null) return fail('Set a price of at least $0.01 within safe USD cent precision. Higher prices reduce demand.');
      return success({ ...state, corporation: { ...c, price } });
    }
    case 'marketing': {
      if (!c.projects.includes('brand')) return fail('Research the Brand book first.');
      if (c.marketing >= 25) return fail('All marketing campaigns are active.');
      const cost = marketingCost(state);
      if (state.cash < cost) return fail(`The next campaign requires $${cost}.`);
      return success({ ...state, cash: state.cash - cost, corporation: { ...c, marketing: c.marketing + 1 } }, `Marketing campaign ${c.marketing + 1}. Retail demand increased by 60%.`);
    }
    case 'auto-buy': {
      if (!c.projects.includes('procurement')) return fail('Research Automatic procurement first.');
      return success({ ...state, corporation: { ...c, autoBuy: !c.autoBuy } });
    }
    case 'review': return fail('Process reviews now run continuously after Time study. Assign researchers for additional insights.');
    case 'project': {
      const reason = projectReason(state, action.id);
      if (reason) return fail(reason);
      const p = projects[action.id];
      const prepared = action.id === 'sovereign' ? settlePendingTender(state) : state;
      const company = prepared.corporation;
      let phase = company.phase;
      if (action.id === 'charter') phase = { id: 'enterprise' };
      if (action.id === 'regional') phase = { id: 'conglomerate' };
      if (action.id === 'sovereign') phase = { id: 'network', network: initialNetwork() };
      let next: GameState = { ...prepared, cash: prepared.cash - p.cash, corporation: { ...company, projects: [...company.projects, action.id], insights: company.insights - p.insights, influence: company.influence - p.influence, autoBuy: action.id === 'procurement' ? true : company.autoBuy, phase, crisis: action.id === 'sovereign' ? { status: 'calm', remaining: 240 } : company.crisis } };
      const anchor = learningAnchors.find(id => id === action.id);
      if (anchor) next = recordLearning(next, anchor);
      return success(next, `${p.name} completed.${phase.id !== c.phase.id ? ` The ${phase.id} era begins.` : ''}`);
    }
    case 'staff': {
      if (!c.projects.includes('time-study')) return fail('Study the workflow before establishing departments.');
      const counts = [action.research, action.sales, action.compliance];
      if (counts.some(n => !Number.isInteger(n) || n < 0) || counts.reduce((sum, n) => sum + n, 0) > state.employees.length) return fail('Department counts must be whole numbers within the headquarters workforce.');
      const pool = [...state.employees];
      const assigned = new Map<number, Role>();
      for (const [role, count] of [['research', action.research], ['sales', action.sales], ['compliance', action.compliance]] as const) {
        const yieldFor = (e: GameState['employees'][number]) => {
          const candidate = { ...e, role }, risk = risks(state, candidate);
          return departmentYield(state, candidate).value * 7.5 / (7.5 + (risk.bugs + risk.breaks + risk.slack) * 4.5);
        };
        pool.sort((a, b) => yieldFor(b) - yieldFor(a) || a.id - b.id);
        for (const e of pool.splice(0, count)) assigned.set(e.id, role);
      }
      return success({ ...state, employees: state.employees.map(e => ({ ...e, role: assigned.get(e.id) ?? 'operations' })) }, 'Department staffing updated. Inherited traits are unchanged.');
    }
    case 'automation': {
      if (!c.projects.includes('analytics')) return fail('Workforce analytics unlocks delegation.');
      if (!Number.isFinite(action.reserve) || action.reserve < 0 || action.reserve > 1_000_000_000) return fail('Set a cash reserve between $0 and $1 billion.');
      return success({ ...state, automation: { memos: action.memos, contracts: action.contracts, allocation: action.allocation ?? state.automation.allocation, reserve: action.reserve } }, 'Standing instructions updated. Payroll reserves are retained automatically.');
    }
    case 'assign': {
      if (!c.projects.includes('time-study')) return fail('Research Time study to create departments.');
      if (!state.employees.some(e => e.id === action.id)) return fail('This employee is no longer at headquarters.');
      return success({ ...state, employees: state.employees.map(e => e.id === action.id ? { ...e, role: action.role } : e) });
    }
    case 'policy': {
      if (!c.projects.includes('charter')) return fail('Incorporate an Enterprise before setting company policy.');
      return success({ ...state, corporation: { ...c, policy: action.policy } }, `Company policy: ${action.policy}.`);
    }
    case 'contract': {
      if (!c.projects.includes('charter')) return fail('Contracts unlock in the Enterprise era.');
      if (c.contract.status !== 'idle' || c.contract.cooldown > 0) return fail('Finish the current order or wait for the contract cooldown.');
      const terms = contracts[action.id];
      if (state.revenue < terms.revenue) return fail(`This client requires $${terms.revenue} lifetime revenue.`);
      return success({ ...state, corporation: { ...c, contract: { status: 'active', id: action.id, delivered: 0, remaining: terms.seconds, allocation: 'half' } } }, `${terms.name} accepted. Half of new production goes into escrow.`);
    }
    case 'contract-allocation': {
      if (c.contract.status !== 'active') return fail('There is no active contract.');
      return success({ ...state, corporation: { ...c, contract: { ...c.contract, allocation: action.allocation } } });
    }
    case 'cancel-contract': {
      if (c.contract.status !== 'active') return fail('There is no active contract.');
      const receipt = settleContractReceipt(state, 'canceled', c.contract.delivered, 0, 0, Math.max(0, c.reputation - 3) - c.reputation);
      return success({ ...receipt, corporation: { ...receipt.corporation, inventory: c.inventory + c.contract.delivered, reputation: Math.max(0, c.reputation - 3), contract: { status: 'idle', cooldown: 120 }, failedContracts: c.failedContracts + 1 } }, 'Order canceled. Escrowed forms returned to inventory. Reputation -3.');
    }
    case 'crisis': {
      if (c.crisis.status !== 'pending') return fail('There is no pending board decision.');
      if (action.choice === 'invest' && state.cash < crisisCost(state)) return fail(`Responsible investment requires $${crisisCost(state)}. Other responses remain available.`);
      return success(resolveCrisis(state, action.choice));
    }
    case 'acquire': {
      if (!c.projects.includes('mergers')) return fail('Research Merger approval first.');
      if (c.acquired.includes(action.id)) return fail('This rival is already part of Cube Farm.');
      const cost = acquisitionCost(state, action.id), influence = 10 + c.acquired.length * 5;
      if (state.cash < cost || c.influence < influence) return fail(`This acquisition requires $${cost} and ${influence} influence.`);
      const rival = rivals[action.id];
      return success({ ...state, cash: state.cash - cost, corporation: { ...c, influence: c.influence - influence, pressure: Math.min(100, c.pressure + 5), acquired: [...c.acquired, action.id], legacyStaff: [...c.legacyStaff, { cultivar: 'generalist', genes: [], count: rival.employees, hiredCost: cost }] } }, `${rival.name} acquired. ${rival.employees} unmodified employees and a new market integrated.`);
    }
    case 'branch': {
      if (!c.projects.includes('regional')) return fail('Research Regional network first.');
      if (c.branches.length >= 8) return fail('All eight regional branch licenses are in use.');
      const cost = branchCost(state);
      if (state.cash < cost) return fail(`Opening a branch requires $${cost}.`);
      const name = ['North', 'East', 'South', 'West', 'Pacific', 'Atlantic', 'Central', 'Orbital'][c.branches.length] ?? 'Regional';
      return success({ ...state, cash: state.cash - cost, corporation: { ...c, nextBranchId: c.nextBranchId + 1, branches: [...c.branches, { id: c.nextBranchId, name: `${name} branch`, level: 1, cohorts: [] }] } }, `${name} branch opened. Hire a cohort to begin production.`);
    }
    case 'branch-upgrade': {
      const branch = c.branches.find(b => b.id === action.id);
      if (!branch) return fail('This branch does not exist.');
      if (branch.level >= 8) return fail('Branch capacity is fully expanded.');
      const count = action.count ?? 1;
      if (!Number.isInteger(count) || count < 1 || branch.level + count > 8) return fail('Choose available branch levels, up to 800 cubicles.');
      const cost = Array.from({ length: count }, (_, i) => branchUpgradeCost({ ...branch, level: branch.level + i })).reduce((sum, n) => sum + n, 0);
      if (state.cash < cost) return fail(`Branch expansion requires $${cost}.`);
      return success({ ...state, cash: state.cash - cost, corporation: { ...c, branches: c.branches.map(b => b.id === action.id ? { ...b, level: b.level + count } : b) } }, `${branch.name} expanded to ${(branch.level + count) * 100} cubicles.`);
    }
    case 'cohort': {
      const branch = c.branches.find(b => b.id === action.branch);
      if (!branch) return fail('This branch does not exist.');
      if (!state.unlockedCultivars.includes(action.cultivar)) return fail('Research this cultivar before hiring.');
      if (!Number.isInteger(action.count) || action.count < 1 || action.count > 800) return fail('Hire between 1 and 800 employees within available branch capacity.');
      if (branchStaff(branch) + action.count > branch.level * 100) return fail('Expand this branch to make room for more employees.');
      const cost = cohortCost(branch, action.cultivar, action.count);
      if (state.cash < cost) return fail(`This cohort requires $${cost}.`);
      const existing = branch.cohorts.findIndex(group => group.cultivar === action.cultivar && group.genes.length === state.genome.length && group.genes.every(g => state.genome.includes(g)));
      if (existing < 0 && branch.cohorts.length >= 128) return fail('Transfer an existing cohort before adding a new genetic variety.');
      const cohorts = existing < 0 ? [...branch.cohorts, { cultivar: action.cultivar, genes: [...state.genome], count: action.count, hiredCost: cost }] : branch.cohorts.map((group, i) => i === existing ? { ...group, count: group.count + action.count, hiredCost: group.hiredCost + cost } : group);
      return success({ ...state, cash: state.cash - cost, corporation: { ...c, branches: c.branches.map(b => b.id === branch.id ? { ...b, cohorts } : b) } }, `${action.count} ${cultivars[action.cultivar].name.toLowerCase()} employees planted in ${branch.name}. Traits fixed at hire.`);
    }
    case 'cohort-replace': {
      const branch = c.branches.find(b => b.id === action.branch), group = branch?.cohorts[action.index];
      if (!branch || !group) return fail('This cohort no longer exists.');
      const count = group.count;
      const released = actStrategy(state, { type: 'cohort-release', branch: action.branch, index: action.index });
      if (!released.ok) return released;
      return actStrategy(released.state, { type: 'cohort', branch: action.branch, cultivar: action.cultivar, count });
    }
    case 'cohort-release': {
      const branch = c.branches.find(b => b.id === action.branch), group = branch?.cohorts[action.index];
      if (!branch || !group) return fail('This cohort has already left the branch.');
      const refund = Math.floor(group.hiredCost * 0.4);
      return success({ ...state, cash: state.cash + refund, corporation: { ...c, branches: c.branches.map(b => b.id === branch.id ? { ...b, cohorts: b.cohorts.filter((_, i) => i !== action.index) } : b) } }, `${group.count} employees transferred. $${refund} received.`);
    }
    case 'allocate': {
      if (c.phase.id !== 'network') return fail('Franchise allocation unlocks in the Network era.');
      if (!Number.isFinite(action.value)) return fail('Allocation must be a finite percentage.');
      return success({ ...state, corporation: { ...c, phase: { id: 'network', network: allocate(c.phase.network, action.key, action.value) } } });
    }
    case 'network-commission': {
      if (c.phase.id !== 'network' || !c.phase.network.protocols.includes('distributed')) return fail('Deploy Distributed computing before commissioning autonomous offices.');
      const n = c.phase.network;
      if (n.completed >= WORLD_WORKFLOWS) return fail('The backlog is finished. Choose the company’s ending.');
      const result = commissionNetwork({ ...n, knowledge: Math.max(0, n.knowledge - n.knowledgeReserve) }, action.count, Math.max(0, state.cash - operatingReserve(state)));
      const messages: Record<Extract<CommissionResult, { ok: false }>['reason'], string> = {
        'invalid-count': 'Choose a whole number from 1 to 1,000 offices.',
        'launch-limit': 'The lifetime commissioning limit has been reached. Existing offices can still replicate.',
        'node-limit': 'The office count has reached its numeric limit. Existing offices are unchanged.',
        cash: 'This launch exceeds available cash after the operating reserve. Choose a smaller batch.',
        knowledge: 'This launch exceeds available knowledge after your reserve. Choose a smaller batch or retain knowledge for procedures.',
      };
      if (!result.ok) return fail(messages[result.reason]);
      const network = { ...result.network, knowledge: n.knowledge - result.cost.knowledge };
      return success({ ...state, cash: state.cash - result.cost.cash, corporation: { ...c, phase: { id: 'network', network } } }, `${action.count} autonomous offices commissioned. Allocation is unchanged; power and computing can limit active capacity.`);
    }
    case 'network-routing':
    case 'network-investment':
    case 'network-knowledge-reserve': {
      if (c.phase.id !== 'network' || !c.phase.network.protocols.includes('distributed')) return fail('Deploy Distributed computing before setting investment and computing priorities.');
      const n = c.phase.network;
      if (action.type === 'network-investment' && action.policy !== 'manual' && n.capitalPolicy !== action.policy && n.completed < 10000) return fail('Clear 10,000 workflows to earn standing Network investment. Manual launches and computing priorities remain available.');
      if (action.type === 'network-knowledge-reserve') {
        if (!Number.isFinite(action.value) || action.value < 0 || action.value > Number.MAX_SAFE_INTEGER) return fail('Choose a finite, nonnegative knowledge reserve.');
        return success({ ...state, corporation: { ...c, phase: { id: 'network', network: { ...n, knowledgeReserve: action.value } } } });
      }
      const network = action.type === 'network-routing' ? { ...n, computeRouting: action.routing } : { ...n, capitalPolicy: action.policy };
      return success({ ...state, corporation: { ...c, phase: { id: 'network', network } } });
    }
    case 'network-building': {
      if (c.phase.id !== 'network' || !c.phase.network.protocols.includes('distributed')) return fail('Distributed computing unlocks delegated infrastructure.');
      if (action.policy !== 'manual' && c.phase.network.infrastructure !== action.policy && c.phase.network.completed < 10000) return fail('Clear 10,000 workflows to earn delegated infrastructure. Existing standing instructions and manual building remain available.');
      return success({ ...state, corporation: { ...c, phase: { id: 'network', network: { ...c.phase.network, infrastructure: action.policy } } } });
    }
    case 'network-plan': {
      if (c.phase.id !== 'network') return fail('Autonomous allocation unlocks with the worldwide network.');
      return success({ ...state, corporation: { ...c, phase: { id: 'network', network: networkPlan(c.phase.network, c.pressure, action.plan) } } });
    }
    case 'network-asset': {
      if (c.phase.id !== 'network') return fail('Power and compute infrastructure unlocks in the Network era.');
      if (!Number.isInteger(action.count) || action.count < 1 || action.count > 1000000) return fail('Build whole installations within the one-million capacity.');
      const n = c.phase.network, cost = assetCost(n, action.asset, action.count);
      if (n[action.asset] + action.count > 1000000 || state.cash < cost) return fail(`This installation requires $${cost} and available infrastructure capacity.`);
      return success({ ...state, cash: state.cash - cost, corporation: { ...c, phase: { id: 'network', network: { ...n, [action.asset]: n[action.asset] + action.count } } } });
    }
    case 'protocol': {
      if (c.phase.id !== 'network') return fail('Protocols unlock in the Network era.');
      const n = c.phase.network, p = protocols[action.id];
      if (n.protocols.includes(action.id)) return fail('This protocol is already running.');
      if (p.requires.some(id => !n.protocols.includes(id))) return fail('Research prerequisite protocols first.');
      if (n.knowledge < p.cost) return fail(`This protocol requires ${p.cost} knowledge.`);
      return success({ ...state, corporation: { ...c, phase: { id: 'network', network: { ...n, knowledge: n.knowledge - p.cost, protocols: [...n.protocols, action.id] } } } }, `${p.name} protocol deployed.`);
    }
    case 'ending': {
      if (c.phase.id !== 'network' || c.phase.network.completed < WORLD_WORKFLOWS) return fail('Discover and process every worldwide workflow before deciding the company’s future.');
      const settled = settlePendingTender(state);
      const settlement = action.ending === 'commons' ? commonsSettlement(settled) : 0;
      if (settled.cash < settlement) return fail(`Common ownership requires $${settlement.toLocaleString()} to buy out the worker patents you retained.`);
      return success({ ...settled, cash: settled.cash - settlement, corporation: { ...settled.corporation, phase: { id: 'ending', ending: action.ending, nodes: c.phase.network.nodes, completedAt: state.elapsed } } }, action.ending === 'monopoly' ? 'Every workflow belongs to Cube Farm. There is no work outside the corporation.' : 'The company belongs to its employees. For the first time, the cubicles are empty by choice.');
    }
    case 'reincorporate': {
      if (c.phase.id !== 'ending') return fail('Finish the worldwide workflow before reincorporating.');
      const ending = c.phase.ending;
      const legacy = { ...c.legacy, runs: c.legacy.runs + 1, credits: c.legacy.credits + 5, endings: c.legacy.endings.includes(ending) ? c.legacy.endings : [...c.legacy.endings, ending] };
      const fresh = initialState(state.lastSeen);
      return success({ ...fresh, cash: fresh.cash + legacy.founding * 60, corporation: { ...fresh.corporation, legacy, morale: Math.min(100, 60 + legacy.welfare * 2) } }, 'A new company incorporated. Five legacy credits awarded. The old habits survived.');
    }
    case 'legacy': {
      if (c.legacy.credits < 1 || c.legacy[action.id] >= 10) return fail('This legacy improvement needs one credit and an available level.');
      return success({ ...state, cash: state.cash + (action.id === 'founding' ? 60 : 0), corporation: { ...c, legacy: { ...c.legacy, credits: c.legacy.credits - 1, [action.id]: c.legacy[action.id] + 1 } } }, `Legacy ${action.id} improved. Applies to this company and future incorporations.`);
    }
  }
}
