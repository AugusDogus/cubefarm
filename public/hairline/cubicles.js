/** A planted field of cubicles. Inspecting a desk makes its occupant sit up. */
const { Cam, fit, proj, facing, rings, prism, solid, put, mk, poly, ringAt, rrect,
  unproj, clamp, spring, stepS, tween, tset, tval, tdone, reducedMotion, register, pointer, disposer } = HL;

function mount({ stage, svg, read }, value) {
  const bag = disposer(), C = Cam(45, 0.5, 1.3);
  fit(C, [[-8, -8, -4], [158, 158, -4], [158, -8, 0], [-8, 158, 0], [0, 0, 54]], 200, 166);
  const P = proj(C), front = facing(C), group = mk('g', {}, svg), desks = [];
  let count = clamp(Math.floor(value), 0, 9), active = -1, drawnHarvest = NaN, workers = [], ending = null, running = true;
  const harvested = spring(0), work = spring(0);
  const planting = [4, 0, 6, 2, 8, 1, 3, 5, 7];
  const block = (parent, x0, y0, x1, y1, z0, z1, radius = 1.4) => {
    const [ring, inner] = rings(x0, y0, x1, y1, radius, Math.min(0.55, (x1 - x0) / 5, (y1 - y0) / 5));
    const el = solid(parent);
    put(el, prism(P, front, ring, inner, z0, z1));
    return el;
  };
  const floor = mk('g', {}, group), firstFloor = mk('g', {}, group);
  block(floor, -8, -8, 158, 158, -4, 0, 5);
  block(firstFloor, 48, 48, 100, 100, -4, 0, 3);
  for (let sum = 0; sum <= 4; sum++) for (let col = 0; col < 3; col++) {
    const row = sum - col;
    if (row < 0 || row > 2) continue;
    const id = row * 3 + col, x = col * 52, y = row * 52;
    const g = mk('g', {}, group);
    block(g, x, y, x + 44, y + 2, 0, 33);
    block(g, x, y + 2, x + 2, y + 44, 0, 33);
    block(g, x + 9, y + 10, x + 13, y + 27, 0, 20);
    block(g, x + 7, y + 7, x + 42, y + 29, 20, 23, 2);
    block(g, x + 20, y + 12, x + 27, y + 18, 23, 24);
    block(g, x + 16, y + 13, x + 31, y + 15, 25, 37, 1);
    const screen = rrect(x + 18, 27, x + 29, 35, 0.8, 4);
    mk('path', { class: 'nf lo', d: poly(screen.map(q => P(q.u, y + 15.1, q.v))) }, g);
    mk('path', { class: 'lo', d: poly(ringAt(P, rrect(x + 18, y + 21, x + 30, y + 25, 0.9, 4), 23.2)) }, g);
    const papers = block(g, x + 34, y + 17, x + 40, y + 26, 23, 25 + (id % 3) * 1.8, 0.7);
    const chair = mk('g', {}, g);
    block(chair, x + 20, y + 34, x + 31, y + 44, 9, 12, 2);
    block(chair, x + 20, y + 43, x + 31, y + 45, 12, 25, 1);
    const person = mk('g', {}, g), body = solid(person), head = solid(person);
    const [br, bi] = rings(x + 22, y + 35, x + 30, y + 41, 2.5, 0.5);
    const [hr, hi] = rings(x + 23, y + 35, x + 29, y + 41, 3, 0.4);
    desks.push({ id, x, y, g, chair, person, body, head, br, bi, hr, hi, papers, lift: tween(0), drawn: NaN });
  }
  const mark = () => {
    const rest = planting[0];
    const small = count <= 1;
    group.setAttribute('transform', small ? 'translate(-320 -265.6) scale(2.6)' : '');
    floor.setAttribute('display', small ? 'none' : '');
    firstFloor.setAttribute('display', small ? '' : 'none');
    for (const desk of desks) {
      const index = planting.indexOf(desk.id);
      desk.g.setAttribute('display', index < Math.max(1, count) ? '' : 'none');
      desk.person.setAttribute('display', ending === 'commons' || index >= count || !ending && workers[index] === 'break' ? 'none' : '');
      desk.chair.setAttribute('transform', ending === 'commons' ? 'translate(-3.68 1.84)' : '');
      desk.papers.sil.classList.toggle('hi', desk.id === (active < 0 ? rest : active));
    }
  };
  const harvest = (forms) => {
    const height = Math.round(clamp(Math.log10(Math.max(0, forms) / Math.max(1, count) + 1) * 1.8, 0, 8) * 20) / 20;
    if (height === harvested.t) return;
    harvested.t = height;
    clock.wake();
  };
  const clock = register(stage, (dt, now) => {
    let moving = stepS(harvested, dt);
    if (running && stepS(work, dt)) moving = true;
    if (harvested.x !== drawnHarvest) {
      drawnHarvest = harvested.x;
      for (const desk of desks) {
        const [ring, inner] = rings(desk.x + 34, desk.y + 17, desk.x + 40, desk.y + 26, 0.7, 0.55);
        put(desk.papers, prism(P, front, ring, inner, 23, 23.4 + drawnHarvest));
      }
    }
    for (const desk of desks) {
      const state = workers[planting.indexOf(desk.id)];
      const lift = tval(desk.lift, now) + (!ending && state === 'working' ? work.x * (desk.id % 2 ? -1 : 1) : 0);
      if (lift !== desk.drawn) {
        desk.drawn = lift;
        const lean = (desk.id % 3) * 0.7;
        put(desk.body, prism(P, front, desk.br, desk.bi, 14, 29 + lean + lift));
        put(desk.head, prism(P, front, desk.hr, desk.hi, 31 + lean + lift, 37 + lean + lift));
      }
      if (!tdone(desk.lift, now)) moving = true;
    }
    return moving;
  });
  bag.add(clock.unregister);
  const choose = (id) => {
    if (id === active) return;
    const from = id < 0 ? active : id, now = performance.now();
    active = id;
    for (const desk of desks) {
      const distance = Math.hypot(desk.x / 52 - from % 3, desk.y / 52 - Math.floor(from / 3));
      const state = ending ? 'working' : workers[planting.indexOf(desk.id)];
      tset(desk.lift, (state === 'slacking' ? -3 : state === 'rework' ? -1.5 : 0) + (id < 0 ? 0 : 9 / (1 + distance * 3)), now, distance * 40);
    }
    mark();
    read.textContent = id < 0 ? 'rest' : `cubicle ${id + 1}`;
    clock.wake();
  };
  // Hit each cubicle at its fixed desk height, never at the lifted occupant.
  bag.add(pointer(stage, {
    move: ([sx, sy]) => {
      const small = count <= 1;
      const [x, y] = unproj(C, small ? (sx + 320) / 2.6 : sx, small ? (sy + 265.6) / 2.6 : sy, 23);
      const col = Math.floor(x / 52), row = Math.floor(y / 52);
      const id = row * 3 + col;
      choose(x < 0 || y < 0 || col > 2 || row > 2 || planting.indexOf(id) >= Math.max(1, count) ? -1 : id);
    },
    leave: () => choose(-1),
  }));
  mark(); read.textContent = 'rest'; clock.wake();
  bag.add(() => svg.replaceChildren());
  return { set: v => { count = clamp(Math.floor(v), 0, 9); mark(); clock.wake(); }, setPaperwork: harvest,
    setSimulation: state => {
      if (state.kind === 'ending') {
        ending = state.ending; running = false; work.x = work.t = 0; harvested.t = 0;
        const selected = active; active = -2; choose(selected); mark(); clock.wake(); return;
      }
      if (state.kind !== 'office') return;
      running = state.running; harvest(state.queue);
      if (running) work.t = !reducedMotion() && workers.includes('working') ? (Math.floor(state.time / 2) % 2 ? 0.7 : -0.7) : 0;
      clock.wake();
    },
    setWorkers: states => {
      if (states.join(',') === workers.join(',')) return;
      workers = [...states]; const selected = active; active = -2; choose(selected); mark(); clock.wake();
    }, destroy: bag.dispose };
}

hairline({
  name: 'cubicles',
  means: 'A field of desks, screens, chairs and paperwork; employees sit up when their cubicle is inspected.',
  rules: [1, 2, 5, 6, 9],
  range: [1, 5, 9],
  mount,
});
