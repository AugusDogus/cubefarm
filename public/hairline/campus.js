/** A corporate campus: roofs, window bands and entrance doors identify its offices. */
const { Cam, fit, proj, facing, rings, prism, solid, put, mk, poly, rrect,
  unproj, clamp, spring, stepS, tween, tset, tval, tdone, reducedMotion, register, pointer, disposer } = HL;

function mount({ stage, svg, read }, value) {
  const bag = disposer(), C = Cam(45, 0.5, 0.9);
  fit(C, [[-12, -12, -4], [244, 244, -4], [244, -12, 0], [-12, 244, 0], [84, 84, 128]], 200, 166);
  const P = proj(C), front = facing(C), group = mk('g', {}, svg), offices = [];
  let count = clamp(Math.round(value), 1, 9), active = -1, running = true, counters = null;
  const congestion = spring(0), change = spring(0);
  const heights = [54, 78, 44, 68, 110, 84, 42, 64, 48];
  const [base, baseInner] = rings(-12, -12, 244, 244, 7, 1.2);
  put(solid(group), prism(P, front, base, baseInner, -4, 0));
  for (let sum = 0; sum <= 4; sum++) for (let col = 0; col < 3; col++) {
    const row = sum - col;
    if (row < 0 || row > 2) continue;
    const i = row * 3 + col, x = col * 84 + 4, y = row * 84 + 4, h = heights[i];
    const g = mk('g', {}, group), podium = solid(g), shell = solid(g), panes = mk('path', { class: 'nf lo' }, g), roof = solid(g), vents = solid(g);
    const [pl, pi] = rings(x - 4, y - 4, x + 62, y + 62, 3, 1);
    put(podium, prism(P, front, pl, pi, 0, 3));
    const [ring, inner] = rings(x, y, x + 56, y + 56, 2.5, 1);
    const [rr, ri] = rings(x - 2, y - 2, x + 58, y + 58, 3, 1);
    const [vr, vi] = rings(x + 14, y + 14, x + 30, y + 28, 2, 0.7);
    offices.push({ i, x, y, h, g, shell, panes, roof, vents, ring, inner, rr, ri, vr, vi, lift: tween(0), work: spring(0), drawn: '' });
  }
  const visible = office => office.i < count;
  const mark = () => offices.forEach(office => {
    office.g.setAttribute('display', visible(office) ? '' : 'none');
    office.roof.sil.classList.toggle('hi', office.i === (active < 0 ? Math.min(4, count - 1) : active));
  });
  const clock = register(stage, (dt, now) => {
    let moving = false;
    if (running && stepS(congestion, dt)) moving = true;
    if (running && stepS(change, dt)) moving = true;
    for (const office of offices) {
      const lift = tval(office.lift, now);
      if (running && stepS(office.work, dt)) moving = true;
      const pose = `${lift},${office.work.x},${congestion.x},${change.x}`;
      if (pose !== office.drawn) {
        office.drawn = pose;
        const z = 3 + lift, top = z + office.h + (office.i === Math.min(4, count - 1) ? change.x : 0);
        put(office.shell, prism(P, front, office.ring, office.inner, z, top));
        const roof = top + Math.max(0, office.work.x);
        put(office.roof, prism(P, front, office.rr, office.ri, roof, roof + 3));
        put(office.vents, prism(P, front, office.vr, office.vi, roof + 3, roof + 8 + congestion.x * 4));
        let d = '';
        for (let level = 14; level < office.h - 4; level += 14) {
          const windows = rrect(office.x + 7 + congestion.x * 3, z + level, office.x + 49 - congestion.x * 3, z + level + 5, 1, 4);
          d += poly(windows.map(q => P(q.u, office.y + 56, q.v)));
          const side = rrect(office.y + 7, z + level, office.y + 49, z + level + 5, 1, 4);
          d += poly(side.map(q => P(office.x + 56, q.u, q.v)));
        }
        const door = rrect(office.x + 23, z, office.x + 33, z + 10, 1, 4);
        d += poly(door.map(q => P(q.u, office.y + 56, q.v)));
        office.panes.setAttribute('d', d);
      }
      if (!tdone(office.lift, now)) moving = true;
    }
    return moving;
  });
  bag.add(clock.unregister);
  const choose = i => {
    if (i === active) return;
    const from = i < 0 ? active : i, now = performance.now();
    active = i;
    for (const office of offices) {
      const distance = Math.hypot(office.i % 3 - from % 3, Math.floor(office.i / 3) - Math.floor(from / 3));
      tset(office.lift, i < 0 ? 0 : 12 / (1 + distance * 4), now, distance * 40);
    }
    mark(); read.textContent = i < 0 ? 'rest' : `office ${i + 1}`; clock.wake();
  };
  // Each tower is tested at its fixed roof height, independently of animated lift.
  bag.add(pointer(stage, {
    move: ([sx, sy]) => {
      let nearest = -1, best = 44;
      for (const office of offices) {
        if (!visible(office)) continue;
        const [x, y] = unproj(C, sx, sy, office.h + 6);
        const distance = Math.hypot(x - office.x - 28, y - office.y - 28);
        if (distance < best) { nearest = office.i; best = distance; }
      }
      choose(nearest);
    },
    leave: () => choose(-1),
  }));
  mark(); read.textContent = 'rest'; clock.wake();
  bag.add(() => svg.replaceChildren());
  return { set: v => { count = clamp(Math.round(v), 1, 9); if (active >= count) choose(-1); mark(); clock.wake(); },
    setSimulation: state => {
      if (state.kind !== 'network') return;
      running = state.running;
      if (!running) return;
      congestion.t = clamp(state.coordination, 0, 1);
      const work = [state.discovery / Math.max(1, state.nodes) / 25, state.clearance / Math.max(1, state.nodes) / 12, Math.max(0, state.replication) / Math.max(1, state.nodes) / 0.03];
      for (const office of offices) {
        const activity = clamp(work[office.i % 3], 0, 1) * (1 - congestion.t * 0.7);
        office.work.t = activity * (reducedMotion() ? 1.1 : Math.floor(state.time / 2 + office.i) % 2 ? 1.8 : 0.4);
      }
      // A logarithmic batch signal stays legible from eight offices to millions.
      // Loading an existing institution never replays historical gains or losses.
      const next = { lost: Math.floor(Math.log2(state.lost + 1)), commissioned: Math.floor(Math.log2(state.commissioned + 1)) };
      change.t = counters && next.lost > counters.lost ? -5 : counters && next.commissioned > counters.commissioned ? 4 : 0;
      counters = next;
      clock.wake();
    }, destroy: bag.dispose };
}

hairline({
  name: 'campus',
  means: 'A field of franchise towers; the office under the pointer rises, and neighbouring offices answer in turn.',
  rules: [1, 2, 3, 5, 6, 9],
  range: [1, 5, 9],
  mount,
});
