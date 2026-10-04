/** The grown cube farm. A floor slides out for inspection, its neighbours part. */
const { Cam, fit, proj, facing, rings, prism, solid, put, mk, poly, rrect,
  unproj, clamp, tween, tset, tval, tdone, register, pointer, disposer } = HL;

function mount({ stage, svg, read }, value) {
  const bag = disposer(), C = Cam(45, 0.5, 1.3);
  fit(C, [[-15, -15, -5], [95, 90, -5], [95, -15, 0], [-15, 90, 0], [0, 0, 172]], 200, 166);
  const P = proj(C), front = facing(C), g = mk('g', {}, svg), floors = [];
  let count = clamp(Math.floor(value), 1, 6), active = -1;
  const [base, baseInner] = rings(-15, -15, 95, 90, 4, 1.3);
  put(solid(g), prism(P, front, base, baseInner, -5, 0));
  const [lobby, lobbyInner] = rings(10, 10, 75, 65, 3, 1);
  put(solid(g), prism(P, front, lobby, lobbyInner, 0, 16));
  const door = rrect(33, 0, 51, 12, 1.2, 5);
  mk('path', { class: 'nf lo', d: poly(door.map(q => P(q.u, 65, q.v))) }, g);
  for (let i = 0; i < 6; i++) {
    const floor = mk('g', {}, g), shell = solid(floor), windows = mk('path', { class: 'nf lo' }, floor);
    const [ring, inner] = rings(8, 8, 77, 67, 2.5, 1);
    floors.push({ i, floor, shell, windows, ring, inner, offset: tween(i % 2 ? 1.5 : 0), lift: tween(0), drawn: '' });
  }
  const roof = solid(g), [roofRing, roofInner] = rings(5, 5, 80, 70, 3, 1);
  const clock = register(stage, (_dt, now) => {
    let moving = false;
    for (const floor of floors) {
      const offset = tval(floor.offset, now), lift = tval(floor.lift, now), key = `${offset},${lift}`;
      if (key !== floor.drawn) {
        floor.drawn = key;
        const z = 16 + floor.i * 21 + lift;
        const Q = (x, y, h) => P(x + offset, y, h);
        put(floor.shell, prism(Q, front, floor.ring, floor.inner, z, z + 17));
        let d = '';
        for (let j = 0; j < 5; j++) {
          const pane = rrect(13 + j * 12, z + 4, 21 + j * 12, z + 12, 0.8, 4);
          d += poly(pane.map(q => Q(q.u, 67, q.v)));
          const side = rrect(14 + j * 9, z + 4, 20 + j * 9, z + 12, 0.8, 4);
          d += poly(side.map(q => Q(77, q.u, q.v)));
        }
        floor.windows.setAttribute('d', d);
      }
      if (!tdone(floor.offset, now) || !tdone(floor.lift, now)) moving = true;
    }
    return moving;
  });
  bag.add(clock.unregister);
  const mark = () => {
    floors.forEach(f => { f.floor.setAttribute('display', f.i < count ? '' : 'none'); f.shell.sil.classList.toggle('hi', f.i === (active < 0 ? count - 1 : active)); });
    put(roof, prism(P, front, roofRing, roofInner, 16 + count * 21, 19 + count * 21));
  };
  const choose = (a) => {
    if (a === active) return;
    const from = a < 0 ? active : a, now = performance.now();
    active = a;
    floors.forEach(f => {
      const distance = Math.abs(f.i - from);
      tset(f.offset, a < 0 ? (f.i % 2 ? 1.5 : 0) : f.i === a ? 14 : 0, now, distance * 40);
      tset(f.lift, a < 0 ? 0 : f.i > a ? 4 : f.i < a ? -2 : 0, now, distance * 40);
    });
    read.textContent = a < 0 ? 'rest' : `floor ${a + 1}`;
    mark(); clock.wake();
  };
  bag.add(pointer(stage, {
    move: ([sx, sy]) => {
      let closest = -1, best = 36;
      for (let i = 0; i < count; i++) {
        const [x, y] = unproj(C, sx, sy, 24 + i * 21);
        const distance = Math.hypot(x - 42, y - 37);
        if (distance < best) { best = distance; closest = i; }
      }
      choose(closest);
    },
    leave: () => choose(-1),
  }));
  mark(); read.textContent = 'rest'; clock.wake();
  bag.add(() => svg.replaceChildren());
  return { set: v => { count = clamp(Math.floor(v), 1, 6); choose(-1); mark(); clock.wake(); }, destroy: bag.dispose };
}

hairline({
  name: 'tower',
  means: 'The cube farm grows into a corporate tower; the floor under the pointer slides out for inspection.',
  rules: [1, 2, 3, 5, 9],
  range: [1, 3, 6],
  mount,
});
