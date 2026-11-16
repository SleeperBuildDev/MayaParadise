// The town gatherings (js/story/extras-events.js runs them): when and where each may happen, who takes part, the
// layout round its centre, its props and its choreography. No Burmese here: every word is in events/lines.js (keys).
//
// EVENT = {
//   id, towns: [district ids], periods: ['morning'|'noon'|'evening'|'night'], fromDay, weight, quiet (no crowd music),
//   dry (not in rain), min (people at least), calls / tris (its prop rig's draw calls (default 2: the instanced boxes
//   and their outline, +1 each for strings, a TV picture, a glow, chalk) / triangles: extras-events.js's budget),
//   slots: [{ id, tag, age: [..], woman?, need?, guest: 'must'|'ok'|'no', side? (walks in toward the stage), wide?
//            (carries something wide), late? (called in by the script), inPlace? (stays where they stand) }],
//   layout(k, cx, cz, s) -> { spots: { slotId: { x, z, h, o? } }, prop?: { x, z, r }, pts?: { name: { x, z, r?, road? } },
//            lines?: [[x0, z0, x1, z1, r]] }      s = +1 / -1: the stage faces east / west (the camera sees faces)
//   anchors?(k) -> [{ x, z }]  centres to try first;  siteOk?(k, lay) -> '' | why;  site?(k, K) a generator (own search)
//   setup(c)    props made (the rig) and handed to carriers;  *script(c) the choreography (yield seconds / a wait fn)
//   frame(c, dt)  per frame extras (strings, a TV picture);  propTap(c, part);  onJoin(c, p);  onWrap(c)
//   joinEmote / joinFace / joinFx: Maya's answer when she joins
// }
// Lessons (GAME-PLAN chapters) are noted per event in lines.js. Nothing points the way: everything happens where she is.

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const PI = Math.PI;
const face = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
const S = (x, z, h, o) => ({ x, z, h, ...(o ? { o } : {}) });
const near = (c, x, z, fx, fz, r = 0.5) => c.near(x, z, fx, fz, r);
/** a person's hand height (scaled by their size) */
const handY = (p) => 0.42 * ((p?.e?.p?.height || 1.15) / 1.15);
/** wait until everyone listed has arrived (or max s) */
const gathered = (c, list, max = 16) => c.upto(c.arrived(list), max);
/** the lesson beat's face: the speaker smiles, the others nod along */
function nods(c, list, but) { for (const p of list) if (p !== but && Math.random() < 0.7) c.act(p, 'nod'); }

// a 3 x 5 pixel digit (the TV's scoreboard): fillRect only (fillText's first use can stall a frame on a font lookup)
const DIGITS = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];
function digit(g, n, x, y) { const d = DIGITS[n % 10]; for (let i = 0; i < 15; i++) if (d[i] === '1') g.fillRect(x + (i % 3), y + Math.floor(i / 3), 1, 1); }

export const EVENTS = [
  // ---------------------------------------------------------------------------------------------------------------
  // E1 chinlone circle
  {
    id: 'chinlone', towns: ['market', 'hearth', 'wharf', 'garden', 'exercise'], periods: ['morning', 'evening'], fromDay: 2, weight: 1.2, min: 3,
    slots: [
      { id: 'p1', tag: 'player', age: ['teen', 'adult', 'elder'], need: true, guest: 'ok' },
      { id: 'p2', tag: 'player', age: ['child', 'teen', 'adult', 'elder'], need: true, guest: 'ok' },
      { id: 'p3', tag: 'player', age: ['child', 'teen', 'adult', 'elder'], need: true, guest: 'ok' },
      { id: 'p4', tag: 'player', age: ['child', 'teen', 'adult', 'elder'], guest: 'no' },
      { id: 'elder', tag: 'watch', age: ['elder'], guest: 'no' },
    ],
    layout(k, cx, cz, s) {
      const r = k.ring(cx, cz, 4, 1.6, rand(0.3, 1.2));
      const el = { x: cx + s * 2.9, z: cz - 1.2 }; el.h = face(el.x, el.z, cx, cz);
      return { spots: { p1: r[0], p2: r[1], p3: r[2], p4: r[3], elder: el }, pts: { mid: { x: cx, z: cz, r: 0.35 } } };
    },
    siteOk: (k, lay) => (lay.d === 'exercise' && Math.hypot(lay.cx + 14.5, lay.cz - 70.6) < 25 ? 'court' : ''), // (the Quarter's own circle: quarter.js CHINLONE)
    setup(c) { const b = (c.mem.ball = c.part('ball')); if (b) { b.show(false); c.tapParts.push(b); } },
    *script(c) {
      const pl = () => c.tag('player');
      yield gathered(c, c.all(), 16);
      c.faceAll(c.cx, c.cz);
      const b = c.mem.ball;
      let from = c.p('p1') || pl()[0];
      if (!b || !from) return;
      c.carry(b, from, 0.16, 0.42, 0.22); b.scale(0.01).show(true).grow(1, 0.3);
      yield 0.6;
      yield c.say([from, 'a']);
      const foot = (p) => { const q = c.pos(p), dx = c.cx - q.x, dz = c.cz - q.z, L = Math.hypot(dx, dz) || 1; return { x: q.x + (dx / L) * 0.32, z: q.z + (dz / L) * 0.32 }; };
      for (let round = 0; round < 2; round++) {
        c.moodAll(pl(), 'kick'); c.lookAll(c.cx, c.cz);
        for (const p of pl()) c.act(p, 'chinlone', { loop: true });
        let f = foot(from);
        b.fly(f.x, 0.3, f.z, 0.4, 0.3, 4);
        yield 0.5;
        const n = round ? 12 : 7 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) {
          const ps = pl().filter((p) => p !== from);
          if (!ps.length) break;
          const M = c.maya, toMaya = c.mem.mayaTurn && Math.hypot(M.x - c.cx, M.z - c.cz) < 4.5;
          const to = toMaya ? null : pick(ps);
          const t = toMaya ? { x: M.x, z: M.z } : foot(to);
          b.fly(t.x, 0.3, t.z, 0.85, 1.15, 7);
          c.sfx('rattan', b.pos.x, b.pos.z, 0.8);
          if (round === 0 && i === 2 && to) c.say([to, 'b']);
          yield 0.92;
          if (toMaya) { c.mem.mayaTurn = false; c.mayaAct('jump'); c.sfx('rattan', t.x, t.z, 0.9); yield 0.5; from = pick(pl()) || from; const f2 = foot(from); b.fly(f2.x, 0.3, f2.z, 0.85, 1.1, 7); yield 0.92; continue; }
          from = to;
        }
        c.moodAll(pl(), null);
        for (const p of pl()) c.stopAct(p);
        if (round === 0) {
          // it drops: a groan, the elder's word, pick it up and go again
          b.fly(c.cx + rand(-0.3, 0.3), 0.07, c.cz + rand(-0.3, 0.3), 0.45, 0.35, 3);
          c.act(from, 'sad');
          yield c.say([from, 'c']);
          const el = c.p('elder') || pick(pl());
          c.act(el, 'beckon');
          yield c.say([el, 'elder']);
          const q = c.pos(from), nx = b.pos.x + (q.x - b.pos.x) * 0.35, nz = b.pos.z + (q.z - b.pos.z) * 0.35;
          if (c.walk(from, nx, nz)) { yield c.upto(() => c.at(from), 4); c.act(from, 'pickUp'); yield 0.7; }
          c.carry(b, from, 0.16, 0.42, 0.22);
          c.home(from); yield c.upto(() => c.at(from), 4); c.faceTo(from, c.cx, c.cz);
          yield 0.4;
        } else {
          b.fly(c.pos(from).x + 0.1, 0.42, c.pos(from).z + 0.1, 0.35, 0.2, 2);
          yield 0.4;
          c.carry(b, from, 0.16, 0.42, 0.22);
          yield c.say([pick(pl()) || from, 'end']);
          c.react(c.all(), 'cheerReact'); c.sfx('clap', c.cx, c.cz, 0.9);
          yield 0.8;
          const d = c.p('p2') || pick(pl());
          c.act(d, 'proud');
          yield c.say([d, 'd']);
          yield 1.2;
        }
      }
    },
    propTap(c) { c.mem.mayaTurn = true; },
    onJoin(c) { c.mem.mayaTurn = true; },
    joinEmote: 'jump', joinFx: 'star',
  },

  // ---------------------------------------------------------------------------------------------------------------
  // E2 mango basket spill
  {
    id: 'mango', towns: ['market', 'hearth', 'garden', 'wharf'], periods: ['morning', 'noon'], fromDay: 3, weight: 1, min: 1,
    slots: [
      { id: 'vendor', tag: 'vendor', age: ['adult', 'elder'], woman: true, need: true, guest: 'must', side: 1 },
      { id: 'h1', tag: 'helper', age: ['teen', 'adult', 'elder'], late: true, guest: 'no' },
      { id: 'h2', tag: 'helper', age: ['teen', 'adult', 'elder'], late: true, guest: 'no' },
      { id: 'kid', tag: 'kid', age: ['child'], late: true, guest: 'ok' },
    ],
    layout(k, cx, cz, s) {
      const pts = {};
      const n = k.low ? 8 : 11;
      for (let i = 0; i < n; i++) { const a = (i / n) * PI * 2 + rand(-0.2, 0.2), r = rand(0.7, 1.9); pts['m' + i] = { x: cx + Math.sin(a) * r, z: cz + Math.cos(a) * r, r: 0.12, road: 1.5 }; }
      pts.basket = { x: cx + s * 0.45, z: cz, r: 0.3 };
      return { spots: { vendor: S(cx, cz, s > 0 ? PI / 2 : -PI / 2, { noLine: true }) }, pts, prop: { x: cx + s * 0.45, z: cz, r: 0.3 } };
    },
    setup(c) {
      const v = c.p('vendor');
      const bk = (c.mem.basket = c.part('basket'));
      if (bk && v) c.carry(bk, v, 0.27, 0.28, 0.02, 0);
      c.mem.mangoes = [];
      for (const [name, p] of Object.entries(c.pts)) {
        if (name[0] !== 'm') continue;
        const m = c.part('mango');
        if (!m) break;
        m.show(false); m.stop = p; m.state = 'basket';
        c.mem.mangoes.push(m); c.tapParts.push(m);
      }
      if (v) c.mood(v, null);
    },
    *script(c) {
      const v = c.p('vendor'), bk = c.mem.basket, ms = c.mem.mangoes;
      if (!v || !bk) return;
      yield c.upto(() => !c.ok(v) || c.at(v), 30);
      if (!c.ok(v) || !c.at(v)) { if (c.ok(v)) c.leave(v, true); return; } // (the carrier never got here: nothing happens without them)
      // the stumble: the basket tips, the mangoes roll
      c.act(v, 'startle'); c.expr(v, 'surprised', 3);
      const bp = c.pts.basket;
      bk.fly(bp.x, 0, bp.z, 0.35, 0.12, 0);
      c.mem.bkOb = c.block(bp.x, bp.z, 0.3); bk.ob = c.mem.bkOb;
      c.sfx('thud', bp.x, bp.z, 0.9);
      for (const m of ms) { m.place(bp.x, 0.25, bp.z).show(true); m.fly(m.stop.x, 0.045, m.stop.z, rand(0.4, 0.8), 0.3, rand(4, 9)); m.state = 'ground'; }
      yield 0.5; c.sfx('thud', bp.x, bp.z, 0.6);
      yield c.say([v, 'oh']);
      c.mood(v, 'work');
      // helpers come, each picks the nearest few
      const basketAt = (p) => { const q = c.pos(p); return near(c, bp.x, bp.z, q.x, q.z, 0.6) || near(c, bp.x, bp.z, c.cx, c.cz, 0.7); };
      const pickTask = function* (p, max) {
        for (let n = 0; n < max; n++) {
          const q = c.pos(p);
          if (!q) return;
          const free = ms.filter((m) => m.state === 'ground');
          if (!free.length) return;
          free.sort((a, b2) => Math.hypot(a.pos.x - q.x, a.pos.z - q.z) - Math.hypot(b2.pos.x - q.x, b2.pos.z - q.z));
          const m = free[0];
          m.state = 'taken';
          const at = near(c, m.pos.x, m.pos.z, q.x, q.z, 0.42);
          if (!at || !c.walk(p, at.x, at.z)) { m.state = 'ground'; return; }
          yield c.upto(() => c.at(p), 7);
          c.faceTo(p, m.pos.x, m.pos.z); c.act(p, 'pickUp'); c.mood(p, 'work');
          yield 0.8;
          c.mood(p, null);
          c.carry(m, p, 0.18, 0.42, 0.18);
          if (p.tag === 'kid' && !c.mem.kidSaid) { c.mem.kidSaid = true; c.say([p, 'kid']); }
          const ba = basketAt(p);
          if (ba && c.walk(p, ba.x, ba.z)) yield c.upto(() => c.at(p), 7);
          c.faceTo(p, bp.x, bp.z);
          m.fly(bp.x, 0.24, bp.z, 0.35, 0.25, 0);
          yield 0.4; m.show(false); m.state = 'in'; c.sfx('pop', bp.x, bp.z, 0.6);
        }
      };
      const helpers = [];
      const tasks = [];
      for (const id of ['h1', 'kid', 'h2']) {
        const m = ms.find((x) => x.state === 'ground');
        if (!m) break;
        const at = near(c, m.pos.x, m.pos.z, c.maya.x, c.maya.z, 0.6) || near(c, m.pos.x, m.pos.z, c.cx, c.cz, 0.6);
        if (!at) continue;
        const p = yield* c.call(id, at.x, at.z, face(at.x, at.z, m.pos.x, m.pos.z));
        if (!p) continue;
        helpers.push(p);
        if (helpers.length === 1) c.run((function* () { yield c.upto(() => c.at(p), 9); yield c.say([p, 'help']); })());
        tasks.push(c.run(pickTask(p, id === 'kid' ? 3 : 2 + Math.floor(Math.random() * 2))));
        yield 0.6;
      }
      // the vendor picks the near ones herself meanwhile
      tasks.push(c.run(pickTask(v, 2)));
      yield c.upto(c.done(...tasks), 6);
      const h2 = c.p('h2') || helpers[helpers.length - 1];
      if (h2) c.say([h2, 'bruised']);
      yield c.upto(c.done(...tasks), 30);
      // anything left: the vendor gathers it up
      for (const m of ms) if (m.state === 'ground' || m.state === 'taken') { m.held = null; m.fly(bp.x, 0.24, bp.z, 0.5, 0.3, 0); m.state = 'in'; c.act(v, 'pickUp'); yield 0.35; m.show(false); }
      c.mood(v, null);
      // honesty: the kid owns up to the one in his pocket
      const kid = c.p('kid');
      if (kid) {
        const q = c.pos(v), at = near(c, q.x, q.z, c.pos(kid).x, c.pos(kid).z, 0.95);
        if (at && c.walk(kid, at.x, at.z)) yield c.upto(() => c.at(kid), 8);
        c.faceTo(kid, q.x, q.z); c.faceTo(v, at ? at.x : c.pos(kid).x, at ? at.z : c.pos(kid).z);
        const pm = c.part('mango');
        if (pm) { c.carry(pm, kid, 0.16, 0.42, 0.2); pm.scale(0.01).grow(1, 0.3); }
        c.act(kid, 'showItem'); c.expr(kid, 'shy', 3);
        yield c.say([kid, 'pocket']);
        if (pm) { pm.fly(bp.x, 0.24, bp.z, 0.45, 0.3, 0); }
        yield 0.5; pm?.show(false);
        c.act(v, 'handOver'); c.expr(v, 'happy', 3);
        yield c.say([v, 'honest']);
        const gift = c.part('mango');
        if (gift) { gift.place(bp.x, 0.25, bp.z).show(true); c.carry(gift, kid, 0.16, 0.42, 0.2); }
        c.act(kid, 'thanks');
        yield 0.6;
      }
      c.act(v, 'thanks');
      yield c.say([v, 'thanks']);
      c.react(c.all().filter((p) => p !== v), 'nod');
      // the vendor takes her basket and goes on her way
      if (c.mem.bkOb) { c.unblock(c.mem.bkOb); bk.ob = null; }
      const q = c.pos(v);
      if (q && c.walk(v, bp.x - c.s * 0.75, bp.z)) yield c.upto(() => c.at(v), 4);
      c.act(v, 'pickUp'); yield 0.5;
      c.carry(bk, v, 0.27, 0.28, 0.02, 0);
      c.leave(v, true);
      yield 1.2;
    },
    propTap(c, part) {
      if (part.state !== 'ground') return;
      const bp = c.pts.basket;
      part.state = 'in'; part.fly(bp.x, 0.24, bp.z, 0.6, 0.6, 5);
      setTimeout(() => part.show(false), 650);
      c.mayaAct('nod');
    },
    joinEmote: 'nod', joinFx: 'heart',
  },

  // ---------------------------------------------------------------------------------------------------------------
  // E3 kitten on a crate stack (a porter has just left the crates; the kitten was inside the top one)
  {
    id: 'kitten', towns: ['exercise', 'market', 'wharf', 'hearth', 'garden'], periods: ['morning', 'noon', 'evening'], fromDay: 4, weight: 1, quiet: true, min: 3,
    slots: [
      { id: 'porter', tag: 'porter', age: ['adult'], need: true, guest: 'must', side: 1, wide: true },
      { id: 'kid', tag: 'kid', age: ['child'], need: true, guest: 'ok' },
      { id: 'teen', tag: 'teen', age: ['teen', 'adult', 'elder'], need: true, guest: 'no' },
      { id: 'elder', tag: 'elder', age: ['elder', 'adult'], guest: 'no' },
    ],
    layout(k, cx, cz, s) {
      // crates at the centre; the porter brings them from the west / east; people stand in front (north side)
      const sp = {
        porter: S(cx - s * 0.75, cz, s > 0 ? PI / 2 : -PI / 2, { noLine: true }),
        kid: S(cx + s * 1.3, cz - 1.5, 0), teen: S(cx - s * 0.6, cz - 1.9, 0), elder: S(cx + s * 2.2, cz - 2.2, 0),
      };
      for (const k2 of ['kid', 'teen', 'elder']) sp[k2].h = face(sp[k2].x, sp[k2].z, cx, cz);
      return {
        spots: sp, prop: { x: cx, z: cz, r: 0.42 },
        pts: { saucer: { x: cx + s * 0.25, z: cz - 1.25, r: 0.15 }, step: { x: cx + s * 0.3, z: cz - 0.85, r: 0.25 }, out: { x: cx + s * 2.6, z: cz - 0.6, r: 0.2 } },
        lines: [[cx + s * 0.25, cz - 1.25, cx + s * 2.6, cz - 0.6, 0.15]],
      };
    },
    setup(c) {
      const po = c.p('porter');
      const cr = (c.mem.crates = c.part('crates'));
      if (cr && po) { c.carry(cr, po, 0, 0, 0.75, 0); c.act(po, 'pushCart', { loop: true }); }
      const kt = (c.mem.kitten = c.part('kitten'));
      if (kt) { kt.show(false); c.tapParts.push(kt); }
      c.mem.saucer = c.part('saucer'); c.mem.saucer?.show(false);
    },
    *script(c) {
      const po = c.p('porter'), cr = c.mem.crates, kt = c.mem.kitten;
      if (!po || !cr || !kt) return;
      yield c.upto(() => !c.ok(po) || c.at(po), 30);
      if (!c.ok(po) || !c.at(po)) { if (c.ok(po)) c.leave(po, true); return; } // (the carrier never got here: nothing happens without them)
      cr.place(c.cx, 0, c.cz, c.h + 0.1); cr.ob = c.block(c.cx, c.cz, 0.42); c.stopAct(po);
      c.sfx('thud', c.cx, c.cz, 0.7);
      c.act(po, 'nod');
      yield 0.6;
      c.leave(po);
      yield 1.0;
      // a head out of the top crate: the kitten
      kt.place(c.cx + 0.02, 1.33, c.cz + 0.02, c.h + PI * 0.5).scale(0.01).show(true).grow(1, 0.5);
      c.sfx('meow', c.cx, c.cz, 0.8);
      kt.drive = (pt, t) => { pt.rx = Math.sin(t * 2.3) * 0.05; };
      const kid = c.p('kid'), teen = c.p('teen'), el = c.p('elder') || teen;
      yield c.upto(() => c.at(kid), 12);
      c.faceTo(kid, c.cx, c.cz); c.lookAll(c.cx, c.cz);
      c.act(kid, 'pointAt', { target: { x: c.cx, y: 1.4, z: c.cz } }); c.expr(kid, 'worried', 3);
      yield c.say([kid, 'see']);
      yield c.upto(c.arrived(c.all()), 10);
      c.lookAll(c.cx, c.cz);
      for (const p of c.all()) c.act(p, 'lookUp');
      // the teen would climb; the elder stops him
      const st = c.pts.step;
      yield c.say([teen, 'climb']);
      if (c.walk(teen, st.x, st.z, 1.4)) yield c.upto(() => c.at(teen), 5);
      c.faceTo(teen, c.cx, c.cz);
      c.act(el, 'calmDown'); c.expr(el, 'worried', 3);
      yield c.say([el, 'wait']);
      c.home(teen); c.act(teen, 'sorry');
      c.sfx('meow', c.cx, c.cz, 0.6);
      yield c.say([el, 'saucer']);
      // the saucer: from the elder's hand to the ground in front of the stack
      const sc = c.mem.saucer, sp = c.pts.saucer;
      if (sc) {
        c.carry(sc, el, 0.15, 0.42, 0.22); sc.scale(0.01).show(true).grow(1, 0.3);
        const at = near(c, sp.x, sp.z, c.pos(el).x, c.pos(el).z, 0.45);
        if (at && c.walk(el, at.x, at.z, 0.8)) yield c.upto(() => c.at(el), 7);
        c.faceTo(el, sp.x, sp.z); c.act(el, 'pickUp'); yield 0.6;
        sc.place(sp.x, 0, sp.z, 0);
        yield 0.4;
        c.home(el, 0.8);
      }
      // everyone a step back, quiet; the kitten comes down by itself
      yield c.upto(c.arrived(c.all()), 6);
      c.lookAll(c.cx, c.cz);
      c.moodAll(c.all(), 'shy');
      for (const p of c.all()) c.act(p, 'listen', { loop: true });
      yield rand(5, 7);
      kt.drive = null; kt.rx = 0;
      const hops = [[c.cx + 0.25 * c.s, 0.9, c.cz - 0.08], [c.cx + 0.2 * c.s, 0.45, c.cz - 0.12], [sp.x + 0.12, 0, sp.z - 0.05]];
      for (const [x, y, z] of hops) { kt.ry = face(kt.pos.x, kt.pos.z, x, z); kt.fly(x, y, z, 0.55, 0.35, 0); c.sfx('meow', x, z, 0.5); yield rand(1.0, 1.8); }
      c.burst('sparkle', sp.x, 0.4, sp.z, { count: 6, spread: 0.3, up: 0.4 });
      c.moodAll(c.all(), null);
      c.expr(kid, 'happy', 3); c.act(kid, 'giggle');
      yield c.say([kid, 'down']);
      kt.drive = (pt, t) => { pt.rx = 0.25 + Math.sin(t * 7) * 0.12; }; // (lapping)
      c.act(teen, 'shake');
      yield c.say([teen, 'grab']);
      c.act(el, 'explain');
      yield c.say([el, 'lesson']);
      nods(c, c.all(), el);
      c.sfx('chimes', c.cx, c.cz, 0.6);
      yield 1.5;
      for (const p of c.all()) c.stopAct(p);
      // the kitten trots off once they go (out of view later: then the crates go too)
      c.run((function* () { yield 4; kt.drive = null; kt.rx = 0; const o = c.pts.out; kt.ry = face(kt.pos.x, kt.pos.z, o.x, o.z); kt.fly(o.x, 0, o.z, 2.6, 0.05, 0); })());
    },
    propTap(c) { c.sfx('meow', c.mem.kitten.pos.x, c.mem.kitten.pos.z, 0.9); },
    joinEmote: 'think', joinFace: 'smile', joinFx: 'heart',
  },

  // ---------------------------------------------------------------------------------------------------------------
  // E4 kite contest (dry weather only)
  {
    id: 'kite', towns: ['hearth', 'envelope', 'garden', 'wharf'], periods: ['noon', 'evening'], fromDay: 5, weight: 1, dry: true, min: 3, calls: 3,
    slots: [
      { id: 'f1', tag: 'flyer', age: ['child', 'teen'], need: true, guest: 'ok' },
      { id: 'f2', tag: 'flyer', age: ['child', 'teen'], need: true, guest: 'ok' },
      { id: 'f3', tag: 'flyer', age: ['child', 'teen'], guest: 'ok' },
      { id: 'elder', tag: 'watch', age: ['teen', 'adult', 'elder'], guest: 'no' },
    ],
    layout(k, cx, cz, s) {
      const sp = {};
      ['f1', 'f2', 'f3'].forEach((id, i) => { sp[id] = S(cx + (i - 1) * 1.7, cz, rand(-0.25, 0.25)); });
      sp.elder = S(cx + s * 3.4, cz - 1.0, 0); sp.elder.h = face(sp.elder.x, sp.elder.z, cx, cz + 1.5);
      return { spots: sp, pts: { fall: { x: cx + 1.7 + 0.5, z: cz + 1.7, r: 0.25 }, f0: { x: cx, z: cz + 1.2, r: 0.3 } } };
    },
    setup(c) {
      c.mem.kites = [];
      ['kite', 'kite2', 'kite3'].forEach((kind, i) => {
        const p = c.p('f' + (i + 1));
        if (!p) return;
        const k = c.part(kind);
        if (!k) return;
        k.show(false); k.flyer = p; c.mem.kites.push(k); c.tapParts.push(k);
      });
    },
    frame(c) {
      if (!c.mem.strOn) return;
      c.mem.kites.forEach((k, i) => {
        const p = k.flyer, q = c.ok(p) && k.vis && !k.held ? c.pos(p) : null;
        if (!q) { c.rig.string(i, 0, -9, 0, 0, -9, 0); return; }
        const hy = (p.e.p.height || 1.1) * 0.98, hc = Math.cos(p.e.p.root.rotation.y), hs = Math.sin(p.e.p.root.rotation.y);
        c.rig.string(i, q.x - 0.12 * hc + 0.1 * hs, hy, q.z + 0.12 * hs + 0.1 * hc, k.pos.x, k.pos.y - 0.05, k.pos.z);
      });
    },
    *script(c) {
      const fl = () => c.tag('flyer');
      yield gathered(c, c.all(), 16);
      const ks = c.mem.kites.filter((k) => c.ok(k.flyer));
      if (ks.length < 2) return;
      for (const k of ks) { c.carry(k, k.flyer, 0.1, 0.62, 0.25); k.scale(0.01).show(true).grow(1, 0.35); }
      c.lookAll(c.cx, c.cz + 2);
      yield 0.8;
      c.act(ks[0].flyer, 'cheer');
      yield c.say([ks[0].flyer, 'go']);
      // up they go
      c.rig.stringsOn(ks.length); c.mem.strOn = true;
      const sky = ks.map((k, i) => { const q = c.pos(k.flyer); return { x: q.x + rand(-0.5, 0.5), y: 3.6 + i * 0.35 + rand(0, 0.3), z: q.z + 2.4 + rand(-0.3, 0.3) }; });
      ks.forEach((k, i) => { k.fly(sky[i].x, sky[i].y, sky[i].z, 2.6 + i * 0.3, 0.6, 0); k.base = sky[i]; });
      c.moodAll(fl(), 'play');
      for (const p of fl()) { c.act(p, 'flyKite', { loop: true }); c.look(p, c.pos(p).x, c.pos(p).z + 3); }
      c.sfx('gust', c.cx, c.cz, 0.7);
      yield 3.2;
      ks.forEach((k, i) => { k.drive = (pt, t) => { if (pt.fl) return; const b = pt.base; pt.pos.set(b.x + Math.sin(t * 0.9 + i * 2) * 0.35, b.y + Math.sin(t * 1.3 + i) * 0.18, b.z + Math.cos(t * 0.7 + i) * 0.12); pt.rz = Math.sin(t * 1.7 + i) * 0.25; }; });
      const wind = c.run((function* () { for (let n = 0; n < 6; n++) { c.sfx(n % 2 ? 'flap' : 'gust', c.cx, c.cz, 0.6); yield rand(2.5, 4); } })());
      // the highest: f2's kite climbs; f3's dips and falls
      const win = ks[1], lose = ks[2] || ks[0];
      win.base.y += 0.9;
      yield 2.0;
      c.act(win.flyer, 'cheer');
      yield c.say([win.flyer, 'high']);
      if (lose !== win) {
        lose.drive = null;
        const f = c.pts.fall, q = c.pos(lose.flyer);
        lose.fly(q ? q.x + 0.5 : f.x, 0.02, q ? q.z + 1.6 : f.z, 1.6, 0.4, 0); lose.rz = 1.3;
        c.mood(lose.flyer, null); c.stopAct(lose.flyer); c.act(lose.flyer, 'sad');
        yield 1.0;
        yield c.say([lose.flyer, 'fell']);
        yield 0.6;
        c.faceTo(lose.flyer, c.pos(win.flyer).x, c.pos(win.flyer).z); c.act(lose.flyer, 'applaud');
        yield c.say([lose.flyer, 'glad']);
        c.faceTo(win.flyer, c.pos(lose.flyer).x, c.pos(lose.flyer).z); c.expr(win.flyer, 'happy', 3);
        yield c.say([win.flyer, 'fix']);
      }
      const el = c.p('elder');
      if (el) { c.act(el, 'nod'); yield c.say([el, 'elder']); }
      c.react(c.all(), 'applaud'); c.sfx('clap', c.cx, c.cz, 0.8);
      yield 1.2;
      // reeled in
      for (const k of ks) { k.drive = null; k.rz = 0; const q = c.pos(k.flyer); if (q) k.fly(q.x, 0.62 * ((k.flyer.e.p.height || 1.1) / 1.15), q.z + 0.25, 1.8, 0.3, 0); }
      yield 1.9;
      c.mem.strOn = false; c.rig.stringsOn(0);
      for (const k of ks) if (c.ok(k.flyer)) c.carry(k, k.flyer, 0.1, 0.62, 0.25);
      c.moodAll(fl(), null);
      for (const p of fl()) c.stopAct(p);
      void wind;
      yield 0.6;
    },
    onWrap(c) { c.mem.strOn = false; c.rig.stringsOn(0); for (const k of c.mem.kites || []) { k.drive = null; if (!k.held) k.grow(0, 0.4); } },
    propTap(c, part) { if (!part.base) return; part.base.y += 0.4; c.mayaAct('point'); },
    joinEmote: 'point', joinFx: 'sparkle',
  },

  // ---------------------------------------------------------------------------------------------------------------
  // E5 football on the tea shop's TV (a trolley wheeled out)
  {
    id: 'football', towns: ['exercise', 'hearth', 'market', 'junction', 'wharf'], periods: ['evening', 'night'], fromDay: 6, weight: 1, min: 3, calls: 3,
    slots: [
      { id: 'keeper', tag: 'keeper', age: ['adult', 'elder'], need: true, guest: 'must', side: 1, wide: true },
      { id: 'f1', tag: 'fan', age: ['teen', 'adult', 'elder'], need: true, guest: 'ok' },
      { id: 'f2', tag: 'fan', age: ['child', 'teen', 'adult', 'elder'], need: true, guest: 'ok' },
      { id: 'f3', tag: 'fan', age: ['child', 'teen', 'adult', 'elder'], guest: 'no' },
      { id: 'elder', tag: 'elder', age: ['elder'], guest: 'no' },
    ],
    anchors(k) {
      const out = [], K = k.K;
      for (const it of k.items) {
        if (!/tea/i.test(String(it.k || it.kind || '')) || !Number.isFinite(it.x)) continue;
        if (Math.hypot(it.x - K.mx, it.z - K.mz) > 24) continue;
        for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2 + rand(0, 0.5), r = rand(3, 5); out.push({ x: it.x + Math.sin(a) * r, z: it.z + Math.cos(a) * r }); }
      }
      return out.sort(() => Math.random() - 0.5).slice(0, 12);
    },
    layout(k, cx, cz, s) {
      const a = k.arc(cx, cz, s, 3, 2.15, 0.05, 0.95);
      const el = k.arc(cx, cz, s, 1, 3.0, 0.55, 0.55)[0];
      return {
        spots: { keeper: S(cx - s * 0.8, cz, s > 0 ? PI / 2 : -PI / 2, { noLine: true }), f1: a[0], f2: a[1], f3: a[2], elder: el },
        prop: { x: cx, z: cz, r: 0.42 },
      };
    },
    setup(c) {
      const kp = c.p('keeper');
      const tv = (c.mem.tv = c.part('tv'));
      if (tv && kp) { c.carry(tv, kp, 0, 0, 0.75, 0); c.act(kp, 'pushCart', { loop: true }); }
      c.mem.score = [0, 0];
    },
    frame(c, dt) {
      if (!c.mem.tvOn) return;
      c.mem.drawT = (c.mem.drawT || 0) - dt;
      if (c.mem.drawT > 0) return;
      c.mem.drawT = c.low ? 99 : 0.25;
      const t = c.t, sc = c.mem.score, dark = c.mem.tvDark;
      c.rig.screenDraw((g, W, H) => {
        if (dark) { g.fillStyle = '#1b1a1a'; g.fillRect(0, 0, W, H); return; }
        g.fillStyle = '#3f8f45'; g.fillRect(0, 0, W, H);
        g.fillStyle = '#4a9c50'; for (let x = 0; x < W; x += 8) g.fillRect(x, 8, 4, H - 8);
        g.strokeStyle = '#e9f2e4'; g.lineWidth = 1; g.strokeRect(2.5, 10.5, W - 5, H - 13); g.beginPath(); g.moveTo(W / 2, 10); g.lineTo(W / 2, H - 3); g.stroke();
        g.beginPath(); g.arc(W / 2, (H + 7) / 2, 5, 0, 7); g.stroke();
        g.fillStyle = '#e9f2e4'; g.fillRect(0, 18, 3, 12); g.fillRect(W - 3, 18, 3, 12);
        for (let i = 0; i < 8; i++) { const x = W / 2 + Math.sin(t * (0.6 + i * 0.13) + i * 2) * (W * 0.38), y = (H + 8) / 2 + Math.cos(t * (0.5 + i * 0.11) + i) * (H * 0.28); g.fillStyle = i % 2 ? '#d94a3a' : '#f2d04a'; g.fillRect(x - 1.5, y - 1.5, 3, 3); }
        const bx = W / 2 + Math.sin(t * 1.1) * (W * 0.42), by = (H + 8) / 2 + Math.sin(t * 1.7) * (H * 0.25);
        g.fillStyle = '#ffffff'; g.fillRect(bx - 1, by - 1, 2, 2);
        g.fillStyle = '#202020'; g.fillRect(0, 0, W, 8);
        g.fillStyle = '#d94a3a'; g.fillRect(16, 2, 5, 4); g.fillStyle = '#f2d04a'; g.fillRect(43, 2, 5, 4);
        g.fillStyle = '#ffffff'; digit(g, sc[0], 25, 1); g.fillRect(31, 3, 2, 1); digit(g, sc[1], 35, 1); // (pixel digits: no text, no font)
      });
    },
    *script(c) {
      const kp = c.p('keeper'), tv = c.mem.tv;
      if (!kp || !tv) return;
      yield c.upto(() => !c.ok(kp) || c.at(kp), 30);
      if (!c.ok(kp) || !c.at(kp)) { if (c.ok(kp)) c.leave(kp, true); return; } // (the carrier never got here: nothing happens without them)
      tv.place(c.cx, 0, c.cz, c.h - c.s * 0.5); tv.ob = c.block(c.cx, c.cz, 0.42); c.stopAct(kp);
      c.rig.screenShow(tv); c.mem.tvOn = true;
      c.sfx('clink', c.cx, c.cz, 0.5);
      // the keeper steps round beside it
      const kb = near(c, c.cx - c.s * 0.2, c.cz - 0.95, c.cx, c.cz - 2, 0.0) || null;
      if (kb && c.walk(kp, kb.x, kb.z, 0.9)) yield c.upto(() => c.at(kp), 4);
      c.faceTo(kp, c.cx + c.s * 2, c.cz - 0.8);
      const murmur = c.run((function* () { while (c.mem.tvOn && !c.mem.tvDark) { c.sfx('tvMurmur', c.cx, c.cz, 0.45); yield rand(2.2, 3.2); } })());
      const fans = c.all().filter((p) => p !== kp);
      yield gathered(c, fans, 14);
      c.lookAll(c.cx, c.cz, fans);
      for (const p of fans) c.act(p, 'gatherLook', { loop: true, target: { x: c.cx, y: 0.55, z: c.cz } });
      yield 2.5;
      const f1 = c.p('f1') || fans[0], f2 = c.p('f2') || fans[1] || f1, f3 = c.p('f3') || c.p('elder') || f2;
      c.act(f1, 'insist');
      yield c.say([f1, 'shoot']);
      c.react(fans, 'startle'); c.sfx('whistle', c.cx, c.cz, 0.5);
      yield 2.0;
      // the goal
      c.mem.score[1] = 1;
      c.sfx('cheer', c.cx, c.cz, 0.8);
      c.act(f2, 'cheer'); c.act(f3, 'sad');
      yield c.say([f2, 'goal']);
      c.act(f3, 'sad');
      yield c.say([f3, 'lost']);
      const el = c.p('elder') || kp;
      c.act(el, 'explain');
      yield c.say([el, 'elder']);
      nods(c, fans, el);
      const cl = fans.find((p) => p !== f2 && p !== el) || f1;
      c.act(cl, 'applaud');
      yield c.say([cl, 'clap']);
      c.react(c.all(), 'applaud'); c.sfx('clap', c.cx, c.cz, 0.8);
      yield 1.5;
      c.sfx('whistle', c.cx, c.cz, 0.4);
      c.mem.tvDark = true; c.mem.drawT = 0;
      c.act(kp, 'waveBye');
      yield c.say([kp, 'next']);
      for (const p of fans) c.stopAct(p);
      void murmur;
      // the keeper wheels it back in
      c.unblock(tv.ob); tv.ob = null;
      const q = c.pos(kp), back = { x: c.cx - c.s * 0.75, z: c.cz };
      if (q && c.walk(kp, back.x, back.z, 0.9)) yield c.upto(() => c.at(kp), 5);
      c.face(kp, c.h + PI);
      yield 0.5;
      c.mem.tvOn = false;
      c.carry(tv, kp, 0, 0, -0.75, 0);
      c.leave(kp, true);
      yield 1.0;
    },
    onWrap(c) { c.mem.tvDark = true; c.mem.drawT = 0; const kp = c.p('keeper'); if (kp && c.mem.tv) { if (c.mem.tv.ob) c.unblock(c.mem.tv.ob); c.mem.tv.ob = null; c.carry(c.mem.tv, kp, 0, 0, 0.75, 0); } },
    joinEmote: 'laugh', joinFx: 'note',
  },

  // ---------------------------------------------------------------------------------------------------------------
  // E6 a new baby shown to the neighbours (quiet)
  {
    id: 'baby', towns: ['hearth', 'garden', 'exercise', 'wharf'], periods: ['morning', 'noon'], fromDay: 2, weight: 0.9, quiet: true, min: 3,
    slots: [
      { id: 'mother', tag: 'mother', age: ['adult'], woman: true, need: true, guest: 'must', side: 1 },
      { id: 'n1', tag: 'nb', age: ['teen', 'adult', 'elder'], need: true, guest: 'ok' },
      { id: 'elder', tag: 'elder', age: ['elder'], guest: 'ok' },
      { id: 'kid', tag: 'kid', age: ['child'], guest: 'no' },
      { id: 'n2', tag: 'nb', age: ['teen', 'adult', 'elder'], guest: 'no' },
    ],
    layout(k, cx, cz, s) {
      const a = k.arc(cx, cz, s, 4, 1.6, -0.2, 1.5); // (0.9 m apart)
      return { spots: { mother: S(cx, cz, s > 0 ? PI / 2 : -PI / 2, { noLine: true }), n1: a[0], elder: a[1], kid: a[2], n2: a[3] } };
    },
    setup(c) {
      const m = c.p('mother');
      const b = (c.mem.bundle = c.part('bundle'));
      if (b && m) { c.carry(b, m, 0, 0.47, 0.2, PI / 2); c.tapParts.push(b); }
      if (m) m.e.g.walkMood = 'read';
    },
    *script(c) {
      const m = c.p('mother');
      if (!m || !c.mem.bundle) return;
      // she walks in with the baby: the neighbours wait for her (the script's clock stands still in a talk); if she
      // never gets here, nothing is shown without her: everyone goes back to their day
      yield c.upto(() => !c.ok(m) || c.at(m), 32);
      if (!c.ok(m) || !c.at(m)) { if (c.ok(m)) c.leave(m, true); return; }
      c.mood(m, 'read'); m.e.g.walkMood = 'read';
      yield gathered(c, c.all().filter((p) => p !== m), 14);
      const nb = c.all().filter((p) => p !== m && c.at(p)); // (only the ones who are here)
      if (!nb.length) { c.act(m, 'waveBye'); c.leave(m, true); return; }
      const bq = c.mem.bundle.pos;
      c.lookAll(bq.x, bq.z, nb);
      c.moodAll(nb, 'shy');
      for (const p of nb) c.act(p, 'gatherLook', { loop: true, target: { x: bq.x, y: bq.y, z: bq.z } });
      c.look(m, bq.x, bq.z);
      const here = (p) => (p && nb.includes(p) ? p : null);
      const n1 = here(c.p('n1')) || nb[0], el = here(c.p('elder')) || n1, kid = here(c.p('kid')), n2 = here(c.p('n2')) || n1;
      c.expr(n1, 'happy', 3);
      yield c.say([n1, 'lovely']);
      yield c.say([el, 'looks']);
      c.expr(m, 'shy', 2);
      if (kid) { c.act(kid, 'thinkChin'); yield c.say([kid, 'tiny']); c.act(el, 'explain'); yield c.say([el, 'grow']); }
      if (n2 !== el) { c.act(n2, 'explain'); yield c.say([n2, 'mine']); }
      c.act(el, 'shake');
      yield c.say([el, 'compare']);
      nods(c, nb, el);
      c.sfx('chimes', c.cx, c.cz, 0.5);
      yield 1.0;
      c.act(m, 'thanks');
      yield c.say([m, 'thanks']);
      c.moodAll(nb, null);
      for (const p of nb) { c.stopAct(p); c.act(p, 'waveBye'); }
      c.leave(m, true);
      yield 1.6;
    },
    propTap(c) { const m = c.p('mother'); if (m) c.act(m, 'nod'); try { window.__mwGame?.maya?.setFace?.('shy', 2); } catch { /* */ } },
    joinEmote: 'nod', joinFace: 'shy', joinFx: 'heart',
  },

  // ---------------------------------------------------------------------------------------------------------------
  // E7 a bicycle puncture mended on the kerb
  {
    id: 'puncture', towns: ['exercise', 'junction', 'market', 'garden', 'hearth'], periods: ['morning', 'noon', 'evening'], fromDay: 2, weight: 1, min: 2,
    slots: [
      { id: 'rider', tag: 'rider', age: ['teen'], need: true, guest: 'must', side: 1, wide: true },
      { id: 'mender', tag: 'mender', age: ['adult', 'elder'], need: true, guest: 'ok' },
      { id: 'kid', tag: 'kid', age: ['child'], guest: 'no' },
      { id: 'w', tag: 'watch', age: ['child', 'teen', 'adult', 'elder'], guest: 'no' },
    ],
    layout(k, cx, cz, s) {
      const sp = {
        rider: S(cx - s * 0.95, cz, s > 0 ? PI / 2 : -PI / 2, { noLine: true }),
        mender: S(cx + s * 0.05, cz - 0.95, 0), kid: S(cx + s * 1.35, cz - 0.8, 0), w: S(cx - s * 1.5, cz - 1.15, 0),
      };
      for (const id of ['mender', 'kid', 'w']) sp[id].h = face(sp[id].x, sp[id].z, cx, cz);
      return { spots: sp, prop: { x: cx, z: cz, r: 0.6 }, pts: { kit: { x: cx + s * 0.55, z: cz - 0.55, r: 0.2 } } };
    },
    setup(c) {
      const r = c.p('rider');
      const bk = (c.mem.bike = c.part('bike'));
      if (bk && r) { c.carry(bk, r, 0, 0, 0.9, 0); c.act(r, 'pushCart', { loop: true }); }
      c.mem.kit = c.part('kit'); c.mem.kit?.show(false);
    },
    *script(c) {
      const r = c.p('rider'), bk = c.mem.bike;
      if (!r || !bk) return;
      yield c.upto(() => !c.ok(r) || c.at(r), 30);
      if (!c.ok(r) || !c.at(r)) { if (c.ok(r)) c.leave(r, true); return; } // (the carrier never got here: nothing happens without them)
      bk.place(c.cx, 0, c.cz, c.h); bk.ob = c.block(c.cx, c.cz, 0.55); c.stopAct(r);
      c.act(r, 'sad'); c.expr(r, 'worried', 3);
      yield c.say([r, 'flat']);
      const m = c.p('mender');
      yield c.upto(() => c.at(m), 10);
      c.faceTo(m, c.cx, c.cz);
      c.act(m, 'beckon');
      yield c.say([m, 'show']);
      // over it goes, wheels up
      const t0 = c.t;
      bk.drive = (pt) => { const u = Math.min(1, (c.t - t0) / 0.6); pt.rz = PI * u; pt.pos.y = 0.76 * Math.min(1, u * 1.4) + Math.sin(u * PI) * 0.15; if (u >= 1) pt.drive = null; };
      c.sfx('thud', c.cx, c.cz, 0.5);
      yield 0.8;
      const kt = c.mem.kit, kp = c.pts.kit;
      if (kt) { kt.place(kp.x, 0, kp.z, c.h).scale(0.01).show(true).grow(1, 0.35); }
      c.mood(m, 'work'); c.sfx('clink', c.cx, c.cz, 0.6);
      const kid = c.p('kid') || c.p('w');
      for (const p of c.all()) if (p !== m) c.look(p, c.cx, c.cz);
      if (kid) { c.act(kid, 'thinkChin'); yield c.say([kid, 'how']); }
      c.mood(m, null); c.act(m, 'explain');
      yield c.say([m, 'dip']);
      c.mood(m, 'work');
      for (let i = 0; i < 3; i++) { c.burst('sparkle', kp.x, 0.12, kp.z, { count: 3, spread: 0.08, up: 0.25 }); yield 0.6; }
      c.act(r, 'thinkChin');
      yield c.say([r, 'why']);
      c.mood(m, null); c.act(m, 'nod');
      yield c.say([m, 'good']);
      c.mood(m, 'work');
      yield 2.4;
      c.sfx('pump', c.cx, c.cz, 0.7);
      yield 1.4;
      c.mood(m, null);
      const t1 = c.t;
      bk.drive = (pt) => { const u = Math.min(1, (c.t - t1) / 0.6); pt.rz = PI * (1 - u); pt.pos.y = 0.76 * Math.max(0, 1 - u * 1.4) + Math.sin(u * PI) * 0.15; if (u >= 1) { pt.drive = null; pt.pos.y = 0; pt.rz = 0; } };
      yield 0.8;
      if (kt) kt.grow(0, 0.35);
      c.act(r, 'proud'); c.expr(r, 'happy', 3);
      yield c.say([r, 'proud']);
      c.sfx('bell', c.cx, c.cz, 0.7);
      c.react(c.all().filter((p) => p !== r), 'applaud');
      yield 1.0;
      c.unblock(bk.ob); bk.ob = null;
      c.face(r, c.h + PI); yield 0.6;
      c.carry(bk, r, 0, 0, -0.9, 0);
      c.leave(r, true);
      yield 1.2;
    },
    onWrap(c) { const r = c.p('rider'), bk = c.mem.bike; if (r && bk) { bk.drive = null; bk.rz = 0; bk.pos.y = 0; if (bk.ob) c.unblock(bk.ob); bk.ob = null; c.carry(bk, r, 0, 0, 0.9, 0); } c.mem.kit?.grow(0, 0.3); },
    joinEmote: 'think', joinFx: 'bulb',
  },

  // ---------------------------------------------------------------------------------------------------------------
  // E8 a snack cart opens, with a queue
  {
    id: 'snack', towns: ['market', 'hearth', 'junction', 'wharf', 'exercise'], periods: ['morning', 'evening'], fromDay: 2, weight: 1.1, min: 3,
    slots: [
      { id: 'cook', tag: 'cook', age: ['adult', 'elder'], woman: true, need: true, guest: 'must', side: 1, wide: true },
      { id: 'q1', tag: 'q', age: ['teen', 'adult', 'elder'], need: true, guest: 'ok' },
      { id: 'q2', tag: 'q', age: ['teen', 'adult', 'elder'], guest: 'ok' },
      { id: 'elder', tag: 'q', age: ['elder'], guest: 'no' },
      { id: 'kid', tag: 'kid', age: ['child', 'teen'], guest: 'no' },
    ],
    layout(k, cx, cz, s) {
      const qx = cx + s * 1.25;
      const Q = [0, 1, 2, 3, 4].map((i) => ({ x: qx, z: cz - 0.15 - i * 0.85 }));
      for (const q of Q) q.h = face(q.x, q.z, cx + s * 0.45, cz);
      return {
        spots: { cook: S(cx - s * 0.85, cz, s > 0 ? PI / 2 : -PI / 2, { noLine: true }), q1: S(Q[1].x, Q[1].z, Q[1].h), q2: S(Q[2].x, Q[2].z, Q[2].h), elder: S(Q[3].x, Q[3].z, Q[3].h), kid: S(Q[0].x, Q[0].z, Q[0].h) },
        prop: { x: cx, z: cz, r: 0.65 }, pts: { q4: { x: Q[4].x, z: Q[4].z, r: 0.3 }, q0: { x: Q[0].x, z: Q[0].z, r: 0.3 } },
        lines: [[Q[0].x, Q[0].z, Q[4].x, Q[4].z, 0.3]],
      };
    },
    setup(c) {
      const ck = c.p('cook');
      const ct = (c.mem.cart = c.part('cart'));
      if (ct && ck) { c.carry(ct, ck, 0, 0, 0.85, 0); c.act(ck, 'pushCart', { loop: true }); }
      const qx = c.cx + c.s * 1.25;
      c.mem.Q = [0, 1, 2, 3, 4].map((i) => ({ x: qx, z: c.cz - 0.15 - i * 0.85, h: face(qx, c.cz - 0.15 - i * 0.85, c.cx + c.s * 0.45, c.cz) }));
      const kid = c.p('kid');
      if (kid) c.walk(kid, c.mem.Q[3].x + c.s * 0.9, c.mem.Q[3].z); // (the kid hangs back first, then runs to the front)
    },
    *script(c) {
      const ck = c.p('cook'), ct = c.mem.cart, Q = c.mem.Q;
      if (!ck || !ct) return;
      yield c.upto(() => !c.ok(ck) || c.at(ck), 30);
      if (!c.ok(ck) || !c.at(ck)) { if (c.ok(ck)) c.leave(ck, true); return; } // (the carrier never got here: nothing happens without them)
      ct.place(c.cx, 0, c.cz, c.h); ct.ob = c.block(c.cx, c.cz, 0.62); c.stopAct(ck);
      c.mood(ck, 'work'); c.act(ck, 'stirPot', { loop: true });
      const pan = { x: c.cx + c.s * 0.0 + Math.cos(c.h) * 0.2, z: c.cz - Math.sin(c.h) * 0.2 };
      const steam = c.run((function* () { while (!c.mem.sold) { c.burst('puff', pan.x, 1.0, pan.z, { count: 2, spread: 0.12, up: 0.5 }); if (Math.random() < 0.6) c.sfx('sizzle', c.cx, c.cz, 0.45); yield rand(1.4, 2.2); } })());
      c.act(ck, 'callOut');
      yield c.say([ck, c.period === 'morning' ? 'callMorn' : 'callEve']);
      c.mood(ck, 'work');
      // the queue fills
      const line = [c.p('q1'), c.p('q2'), c.p('elder')].filter(Boolean);
      yield gathered(c, line, 14);
      for (const p of line) c.look(p, c.cx, c.cz);
      // the kid runs to the front
      const kid = c.p('kid');
      if (kid) {
        yield c.upto(() => c.at(kid), 6);
        if (c.walk(kid, Q[0].x, Q[0].z, 2.2)) yield c.upto(() => c.at(kid), 5);
        c.face(kid, Q[0].h);
        yield c.say([kid, 'first']);
        const q1 = line[0];
        c.act(q1, 'calmDown');
        yield c.say([q1, 'line']);
        c.expr(kid, 'shy', 3);
        yield c.say([kid, 'back']);
        const back = Q[Math.min(4, line.length + 1)];
        if (c.walk(kid, Q[0].x + c.s * 0.75, Q[0].z) ) yield c.upto(() => c.at(kid), 4);
        if (c.walk(kid, back.x + c.s * 0.75, back.z)) yield c.upto(() => c.at(kid), 6);
        if (c.walk(kid, back.x, back.z)) yield c.upto(() => c.at(kid), 4);
        c.face(kid, back.h);
      }
      // the elder: served first, by the others' choice
      const el = c.p('elder');
      const order = line.filter((p) => p !== el);
      if (el) {
        const q2 = c.p('q2') || line[0];
        c.act(q2, 'beckon');
        yield c.say([q2, 'elder']);
        c.act(el, 'thanks');
        if (c.walk(el, Q[0].x + c.s * 0.75, Q[3].z)) yield c.upto(() => c.at(el), 5);
        if (c.walk(el, Q[0].x + c.s * 0.75, Q[0].z)) yield c.upto(() => c.at(el), 5);
        if (c.walk(el, Q[0].x, Q[0].z)) yield c.upto(() => c.at(el), 4);
        c.face(el, Q[0].h);
        order.unshift(el);
      }
      if (kid) order.push(kid);
      // served one by one; the line moves up
      const queue = order.slice();
      const serve = function* (p) {
        if (!c.ok(p)) return;
        c.mood(ck, 'work'); c.act(ck, 'sellHand');
        yield 1.4;
        const sn = c.part('mango');
        if (sn) { sn.place(pan.x, 0.95, pan.z).show(true); c.carry(sn, p, 0.16, 0.42, 0.2); }
        c.act(p, 'thanks'); c.act(ck, 'handOver');
        yield 0.9;
      };
      while (queue.length) {
        const p = queue.shift();
        if (!c.ok(p)) continue;
        const isKid = p === kid;
        if (!c.at(p) || Math.hypot(c.pos(p).x - Q[0].x, c.pos(p).z - Q[0].z) > 0.3) { if (c.walk(p, Q[0].x, Q[0].z)) yield c.upto(() => c.at(p), 4); c.face(p, Q[0].h); }
        if (isKid) { c.mood(ck, null); c.act(ck, 'handOver'); yield c.say([ck, 'extra']); }
        yield* serve(p);
        if (isKid) { c.act(kid, 'cheer'); c.expr(kid, 'happy', 3); }
        c.leave(p);
        queue.forEach((q, i) => { if (c.ok(q)) { c.walk(q, Q[i].x, Q[i].z); c.face(q, Q[i].h); } });
        yield 1.2;
      }
      c.mem.sold = true;
      void steam;
      c.stopAct(ck); c.mood(ck, null); c.act(ck, 'waveBye');
      yield c.say([ck, 'gone']);
      c.mood(ck, 'work');
      yield 1.0;
      c.mood(ck, null);
      c.unblock(ct.ob); ct.ob = null;
      c.face(ck, c.h + PI); yield 0.6;
      c.carry(ct, ck, 0, 0, -0.85, 0);
      c.leave(ck, true);
      yield 1.0;
    },
    onWrap(c) { c.mem.sold = true; const ck = c.p('cook'), ct = c.mem.cart; if (ck && ct) { if (ct.ob) c.unblock(ct.ob); ct.ob = null; c.carry(ct, ck, 0, 0, 0.85, 0); } },
    joinEmote: 'laugh', joinFace: 'happy', joinFx: 'heart',
  },

  // ---------------------------------------------------------------------------------------------------------------
  // E9 the lantern story circle (night only, quiet)
  {
    id: 'lantern', towns: ['exercise', 'hearth', 'garden', 'wharf', 'blank'], periods: ['night'], fromDay: 2, weight: 1.2, quiet: true, min: 3, calls: 3,
    slots: [
      { id: 'elder', tag: 'elder', age: ['elder'], need: true, guest: 'ok', side: 1 },
      { id: 'k1', tag: 'kid', age: ['child'], need: true, guest: 'ok' },
      { id: 'k2', tag: 'kid', age: ['child', 'teen'], guest: 'ok' },
      { id: 'k3', tag: 'kid', age: ['child', 'teen'], guest: 'no' },
      { id: 'w', tag: 'watch', age: ['teen', 'adult', 'elder'], guest: 'no' },
    ],
    layout(k, cx, cz, s) {
      const a = k.arc(cx + s * 0.6, cz, s, 3, 1.25, -0.15, 1.05);
      const w = k.arc(cx, cz, s, 1, 2.9, 0.9, 0.9)[0];
      return { spots: { elder: S(cx, cz, s > 0 ? PI / 2 : -PI / 2), k1: a[0], k2: a[1], k3: a[2], w }, pts: { lamp: { x: cx + s * 0.6, z: cz, r: 0.2 } } };
    },
    setup(c) {
      const el = c.p('elder');
      const lt = (c.mem.lamp = c.part('lantern'));
      if (lt && el) { if (el.kind === 'guest') c.carry(lt, el, 0.22, 0.05, 0.1, 0); else lt.show(false); c.tapParts.push(lt); }
    },
    *script(c) {
      const el = c.p('elder'), lt = c.mem.lamp;
      if (!el || !lt) return;
      yield c.upto(() => !c.ok(el) || c.at(el), 30);
      if (!c.ok(el) || !c.at(el)) { if (c.ok(el)) c.leave(el, true); return; } // (the carrier never got here: nothing happens without them)
      if (!lt.vis) { c.carry(lt, el, 0.22, 0.05, 0.1, 0); lt.scale(0.01).show(true).grow(1, 0.3); yield 0.4; }
      const lp = c.pts.lamp;
      c.act(el, 'pickUp');
      yield 0.5;
      lt.fly(lp.x, 0, lp.z, 0.45, 0.15, 0); lt.ob = c.block(lp.x, lp.z, 0.18);
      yield 0.5;
      c.rig.glowShow(lt);
      const kids = c.all().filter((p) => p !== el);
      yield gathered(c, kids, 14);
      c.lookAll(c.cx, c.cz, kids); c.moodAll(kids, 'shy');
      for (const p of kids) c.act(p, 'listen', { loop: true });
      c.look(el, lp.x, lp.z);
      c.act(el, 'explain');
      yield c.say([el, 'once']);
      c.look(el, null);
      c.act(el, 'explain');
      yield c.say([el, 'ant']);
      const k1 = c.p('k1') || kids[0], k2 = c.p('k2') || k1;
      c.act(k1, 'surprised');
      yield c.say([k1, 'then']);
      c.act(el, 'explainBoth');
      yield c.say([el, 'next']);
      c.act(k2, 'thinkChin');
      yield c.say([k2, 'where']);
      c.act(el, 'pointSelf'); c.expr(el, 'happy', 3);
      yield c.say([el, 'from']);
      c.burst('sparkle', lp.x, 0.35, lp.z, { count: 14, spread: 0.5, up: 1.4 });
      c.sfx('chimes', lp.x, lp.z, 0.55);
      nods(c, kids, null);
      yield 2.2;
      c.moodAll(kids, null);
      for (const p of kids) c.stopAct(p);
      c.unblock(lt.ob); lt.ob = null;
      const q = near(c, lp.x, lp.z, c.cx, c.cz, 0.45);
      if (q && c.walk(el, q.x, q.z, 0.8)) yield c.upto(() => c.at(el), 4);
      c.act(el, 'pickUp'); yield 0.5;
      c.carry(lt, el, 0.22, 0.05, 0.1, 0);
      yield 0.6;
    },
    onWrap(c) { const el = c.p('elder'), lt = c.mem.lamp; if (lt?.ob) c.unblock(lt.ob); if (lt) lt.ob = null; if (el && lt && !lt.held) c.carry(lt, el, 0.22, 0.05, 0.1, 0); },
    joinEmote: 'nod', joinFace: 'smile', joinFx: 'sparkle',
  },

  // ---------------------------------------------------------------------------------------------------------------
  // E10 a haggle at a stall (no new prop; no prices in any line)
  {
    id: 'haggle', towns: ['market', 'wharf'], periods: ['morning', 'noon'], fromDay: 4, weight: 1, min: 2, calls: 0,
    slots: [
      { id: 'keeper', tag: 'keeper', need: true, guest: 'no', inPlace: true, job: true },
      { id: 'buyer', tag: 'buyer', age: ['teen', 'adult', 'elder'], need: true, guest: 'ok' },
      { id: 'w1', tag: 'watch', age: ['child', 'teen', 'adult', 'elder'], guest: 'no' },
      { id: 'w2', tag: 'watch', age: ['adult', 'elder', 'teen', 'child'], guest: 'no' },
    ],
    // the site is a stall: a keeper at work there (stays where they stand), or one near their own stall (walks back to
    // it); the buyer stands across the stall from them, or at its front corner (a busy street leaves little room in
    // front), and up to two watchers stand close beside the buyer. The stall-front spot is the keeper's own (no job-spot
    // keep-out for it), and the buyer's spots may come to the pavement's kerb (1.5 m from a road's centre line: the
    // road is 2.4 wide, so never on it); every other rule stands (doors 3.6 m, the hint 10 m, the cast 8 m, Maya 4 m)
    *site(k, K, check) {
      const list = [];
      for (const e of k.people().values()) {
        const rm = e.rm, js = e.job?.spot;
        if (!e.roam || !rm || rm.kind !== 'region' || rm.ev || e.evt || rm.partner || e.paused || !js) continue;
        const p = e.p.root.position, off = Math.hypot(p.x - js.x, p.z - js.z);
        const atWork = rm.state === 'work' && off < 0.6;
        if (!atWork && off > 12) continue; // (not too far from their stall: they walk back to it)
        const dm = Math.hypot(js.x - K.mx, js.z - K.mz);
        if (dm < 5 || dm > 20 || k.districtAt(js.x, js.z) !== K.d) continue;
        list.push({ e, atWork, r: Math.random() - (atWork ? 1 : 0) });
      }
      yield;
      const KERB = 1.5;
      const ok = (x, z) => !k.solid(x, z, 0.42) && k.roadDist(x, z) >= KERB && k.districtAt(x, z) === K.d && Math.hypot(x - K.mx, z - K.mz) >= 4;
      for (const { e, atWork } of list.sort((a, b) => a.r - b.r)) {
        const js = e.job.spot, p = atWork ? e.p.root.position : js, h = js.h ?? e.p.root.rotation.y;
        const kp = { x: p.x, z: p.z };
        // the buyer: straight across the stall first, then at its front corners (turned 35 / 65 degrees)
        for (const [ang, d] of [[0, 1.35], [0, 1.65], [0, 1.95], [0.6, 1.35], [-0.6, 1.35], [0, 2.3], [1.1, 1.25], [-1.1, 1.25], [0.6, 1.7], [-0.6, 1.7]]) {
          const bh0 = h + ang, bx = kp.x + Math.sin(bh0) * d, bz = kp.z + Math.cos(bh0) * d;
          if (!ok(bx, bz)) continue;
          const bh = face(bx, bz, kp.x, kp.z), fx = Math.sin(bh), fz = Math.cos(bh); // (the buyer's own forward: toward the keeper)
          // watchers close beside the buyer, a step back (a smaller ring in a busy street: 0.8 - 1.05 m to the side)
          const sides = [];
          for (const sg of [1, -1]) for (const lat of [1.05, 0.85]) { const x = bx + fz * sg * lat - fx * 0.3, z = bz - fx * sg * lat - fz * 0.3; if (ok(x, z)) { sides.push({ x, z }); break; } }
          const o = { ownSpot: true, noLine: true, road: KERB };
          const spots = { keeper: S(kp.x, kp.z, h, { noLine: true, ownSpot: true, r: 0.05, road: 0, who: e.id, inPlace: atWork }), buyer: S(bx, bz, bh, o) };
          if (sides[0]) spots.w1 = S(sides[0].x, sides[0].z, face(sides[0].x, sides[0].z, kp.x, kp.z), o);
          if (sides[1]) spots.w2 = S(sides[1].x, sides[1].z, face(sides[1].x, sides[1].z, kp.x, kp.z), o);
          // (nothing through a wall or a building: between the buyer and the keeper at most a counter's depth is solid)
          let thick = 0;
          for (let i = 1, n = Math.ceil(d / 0.1); i < n; i++) if (k.solid(bx + (kp.x - bx) * (i / n), bz + (kp.z - bz) * (i / n), 0.05)) thick += d / n;
          if (thick > 0.9) continue;
          let lay = { cx: (kp.x + bx) / 2, cz: (kp.z + bz) / 2, s: 1, d: K.d, spots, keeperId: e.id };
          if (check(lay) && (spots.w1 || spots.w2)) { // (a watcher in the way: without the watchers)
            const sp2 = { keeper: spots.keeper, buyer: spots.buyer };
            lay = { ...lay, spots: sp2 };
          }
          if (!check(lay)) return lay;
        }
        yield;
      }
      return null;
    },
    setup(c) { c.mem.fish = c.d === 'wharf'; },
    *script(c) {
      const kp = c.p('keeper'), by = c.p('buyer');
      if (!kp || !by) return;
      yield gathered(c, c.all(), 14);
      if (!c.ok(kp) || !c.ok(by) || !c.at(kp) || !c.at(by)) return; // (the two the haggle needs are not both here)
      const kq = c.pos(kp);
      c.lookAll(kq.x, kq.z, c.all().filter((p) => p !== kp));
      c.look(kp, c.pos(by).x, c.pos(by).z);
      c.act(by, 'pointAt', { target: { x: kq.x, y: 0.8, z: kq.z } });
      yield c.say([by, c.mem.fish ? 'askFish' : 'ask']);
      c.act(kp, 'showItem');
      yield c.say([kp, c.mem.fish ? 'freshFish' : 'fresh']);
      c.act(by, 'beckon');
      yield c.say([by, 'less']);
      c.act(kp, 'pointAt', { target: { x: (kq.x + c.pos(by).x) / 2, y: 0.8, z: (kq.z + c.pos(by).z) / 2 } }); c.sfx('clink', kq.x, kq.z, 0.7);
      yield c.say([kp, 'scale']);
      const w = c.p('w1') || c.p('w2');
      if (w) { c.act(w, 'nod'); yield c.say([w, 'years']); }
      c.act(by, 'nod'); c.expr(by, 'happy', 2);
      yield c.say([by, 'take']);
      c.act(kp, 'handOver'); c.sfx('clink', kq.x, kq.z, 0.6);
      c.act(kp, 'thanks');
      yield c.say([kp, 'back']);
      nods(c, c.all(), kp);
      yield 1.0;
    },
    joinEmote: 'thumbsUp', joinFx: 'star',
  },

  // ---------------------------------------------------------------------------------------------------------------
  // E11 a kids' race along the pavement
  {
    id: 'race', towns: ['exercise', 'garden', 'hearth', 'blank'], periods: ['morning', 'noon', 'evening'], fromDay: 2, weight: 1, min: 2, calls: 1,
    // (the runners first: they take the guests when no child is about; a grown-up starter is found among the townsfolk,
    // and without one the kids start it themselves)
    slots: [
      { id: 'k1', tag: 'kid', age: ['child', 'teen'], need: true, guest: 'ok' },
      { id: 'k2', tag: 'kid', age: ['child', 'teen'], need: true, guest: 'ok' },
      { id: 'starter', tag: 'starter', age: ['teen', 'adult', 'elder'], guest: 'ok' },
      { id: 'k3', tag: 'kid', age: ['child', 'teen'], guest: 'ok' },
      { id: 'w', tag: 'watch', age: ['child', 'teen', 'adult', 'elder'], guest: 'no' },
    ],
    layout(k, cx, cz, s) {
      // the course: as long as the pavement allows (5 m each side of the centre at best, 2.8 at least), slid a little
      // along the street when that fits it better
      const lanes = [-0.8, 0, 0.8];
      const clear = (x, z, r) => !k.solid(x, z, r) && k.roadDist(x, z) >= 1.8;
      let L = 0;
      for (const l of [5, 4.2, 3.4, 2.8]) {
        for (const off of [0, 1.6, -1.6]) {
          const ox = cx + off;
          let ok = clear(ox, cz, 0.3) && clear(ox - s * (l + 0.7), cz - 2.0, 0.42) && clear(ox + s * (l + 0.6), cz - 2.0, 0.42);
          for (let x = -l; ok && x <= l + 0.6; x += 1) for (const dz of lanes) if (!clear(ox + s * x, cz + dz, 0.3)) { ok = false; break; }
          if (ok) { L = l; cx = ox; break; }
        }
        if (L) break;
      }
      if (!L) return null;
      const sx = cx - s * L, fx = cx + s * L, hh = s > 0 ? PI / 2 : -PI / 2;
      const sp = { k1: S(sx, cz + lanes[0], hh, { noLine: true }), k2: S(sx, cz + lanes[1], hh, { noLine: true }), k3: S(sx, cz + lanes[2], hh, { noLine: true }) };
      sp.starter = S(sx - s * 0.7, cz - 2.0, 0, { noLine: true }); sp.starter.h = face(sp.starter.x, sp.starter.z, sx, cz);
      sp.w = S(fx + s * 0.6, cz - 2.0, 0, { noLine: true }); sp.w.h = face(sp.w.x, sp.w.z, fx, cz);
      const lines = lanes.map((dz) => [sx, cz + dz, fx + s * 0.6, cz + dz, 0.3]);
      const pts = {};
      for (let i = 0; i <= 5; i++) for (const dz of [-1.2, 0, 1.2]) pts[`s${i}_${dz}`] = { x: sx + s * ((2 * L * i) / 5), z: cz + dz, r: 0.3, road: 1.8 };
      pts.trip = { x: sx + s * 0.8 * L, z: cz + lanes[0], r: 0.3 };
      pts.help = { x: sx + s * 0.86 * L, z: cz + lanes[1], r: 0.25 }; // (k2 turns back along its own lane)
      return { spots: sp, pts, lines, L, cx, cz };
    },
    siteOk(k, lay) { // (not passing within 2 m of Maya)
      const s = lay.s, sx = lay.cx - s * lay.L, fx = lay.cx + s * (lay.L + 0.6), K = k.K;
      const t = Math.max(0, Math.min(1, (K.mx - sx) / (fx - sx)));
      return Math.hypot(K.mx - (sx + (fx - sx) * t), K.mz - lay.cz) < 2.6 ? 'maya' : '';
    },
    setup(c) { const L = c.lay.L || 5; c.mem.sx = c.cx - c.s * L; c.mem.fx = c.cx + c.s * L; },
    *script(c) {
      const kids = c.tag('kid'), st = c.p('starter') || c.p('w'); // (no grown-up: the kids draw the lines and start it themselves)
      if (kids.length < 2) return;
      yield gathered(c, c.all(), 18);
      for (const p of kids) c.face(p, c.h);
      // the chalk lines, drawn by the starter
      const a = { x: c.mem.sx, z: c.cz }, b = { x: c.mem.fx, z: c.cz };
      c.rig.chalkShow(true, a, b, c.h, 2.6); c.rig.chalkGrow(0, a, b, c.h);
      c.mem.chalk = true;
      const drawer = st || kids[kids.length - 1];
      c.mood(drawer, 'work');
      for (let i = 1; i <= 8; i++) { c.rig.chalkGrow(i / 8, a, b, c.h); yield 0.16; }
      c.mood(drawer, null);
      c.lookAll(c.mem.fx, c.cz, kids);
      c.act(drawer, 'pointAt', { target: { x: c.mem.fx, y: 0.6, z: c.cz } });
      yield c.say([drawer, 'go']);
      c.sfx('steps', c.cx, c.cz, 0.8);
      const k1 = c.p('k1') || kids[0], k2 = c.p('k2') || kids[1], k3 = c.p('k3');
      const lane = (p) => c.pos(p).z;
      const runTo = (p, sp) => c.walk(p, c.mem.fx + c.s * 0.6, lane(p), sp);
      c.walk(k1, c.pts.trip.x, c.pts.trip.z, 3.1);
      runTo(k2, 3.0); if (k3) runTo(k3, 3.3);
      // k1 trips; k2 turns back to help
      yield c.upto(() => c.at(k1), 5);
      c.act(k1, 'sad'); c.mood(k1, 'down'); c.expr(k1, 'sad', 4); c.sfx('thud', c.pos(k1).x, c.pos(k1).z, 0.6);
      yield c.say([k1, 'ow']);
      if (c.ok(k2)) {
        const h = c.pts.help;
        c.walk(k2, h.x, h.z, 2.4);
        yield c.upto(() => c.at(k2), 4);
        c.faceTo(k2, c.pos(k1).x, c.pos(k1).z);
        c.act(k2, 'handOver');
        yield c.say([k2, 'help']);
        c.mood(k1, null); c.expr(k1, 'smile', 2);
        yield 0.6;
        runTo(k1, 1.7); runTo(k2, 1.7);
      }
      if (k3) { yield c.upto(() => c.at(k3), 6); c.act(k3, 'cheer'); }
      yield c.upto(() => c.at(k1) && c.at(k2), 9);
      const w = c.p('w') || st;
      c.act(w, 'applaud');
      yield c.say([w, 'best']);
      if (k3) { c.faceTo(k3, c.pos(k1).x, c.pos(k1).z); c.act(k3, 'cheer'); yield c.say([k3, 'won']); }
      c.react(c.all(), 'applaud'); c.sfx('clap', c.mem.fx, c.cz, 0.8); c.sfx('cheer', c.mem.fx, c.cz, 0.5);
      for (const p of kids) c.stopAct(p);
      yield 1.5;
    },
    lingering: (c) => !!c.mem.chalk && !c.mem.chalkGone,
    frame(c) {
      // the chalk stays until it is out of the frame (then it is simply not there any more)
      if (c.mem.chalk && c.wrapping && !c.mem.chalkGone) {
        const on = c.onFrame?.(c.mem.sx, c.cz) || c.onFrame?.(c.mem.fx, c.cz);
        if (!on) { c.rig.chalkShow(false); c.mem.chalkGone = true; }
      }
    },
    joinEmote: 'point', joinFx: 'star',
  },

  // ---------------------------------------------------------------------------------------------------------------
  // E12 the newspaper read aloud (from Day 8: before that it would spoil the story's own lesson)
  {
    id: 'paper', towns: ['junction', 'market', 'wharf', 'hearth'], periods: ['morning', 'noon'], fromDay: 8, weight: 1, min: 3,
    slots: [
      { id: 'reader', tag: 'reader', age: ['teen', 'adult', 'elder'], need: true, guest: 'ok' },
      { id: 'l1', tag: 'listen', age: ['child', 'teen', 'adult', 'elder'], need: true, guest: 'ok' },
      { id: 'l2', tag: 'listen', age: ['child', 'teen', 'adult', 'elder'], guest: 'no' },
      { id: 'kid', tag: 'kid', age: ['child', 'teen'], guest: 'no' },
      { id: 'elder', tag: 'elder', age: ['elder'], guest: 'no' },
    ],
    layout(k, cx, cz, s) {
      const a = k.arc(cx, cz, s, 4, 1.7, -0.2, 1.5); // (0.95 m apart)
      return { spots: { reader: S(cx, cz, s > 0 ? PI / 2 : -PI / 2), l1: a[0], l2: a[1], kid: a[2], elder: a[3] } };
    },
    setup(c) { const pp = (c.mem.paper = c.part('paper')); pp?.show(false); if (pp) c.tapParts.push(pp); c.mem.story = pick(['fish', 'moon', 'cat']); },
    *script(c) {
      const rd = c.p('reader'), pp = c.mem.paper;
      if (!rd || !pp) return;
      yield gathered(c, c.all(), 16);
      c.carry(pp, rd, 0, 0.56, 0.3, 0); pp.scale(0.01).show(true).grow(1, 0.35);
      c.mood(rd, 'read'); c.act(rd, 'readPaper', { loop: true });
      c.sfx('rustle', c.cx, c.cz, 0.7);
      const ls = c.all().filter((p) => p !== rd);
      c.lookAll(c.cx, c.cz, ls);
      for (const p of ls) c.act(p, 'gatherLook', { loop: true, target: { x: c.cx, y: 0.9, z: c.cz } });
      yield 1.0;
      const st = c.mem.story;
      yield c.say([rd, st]);
      const l1 = c.p('l1') || ls[0], l2 = c.p('l2') || l1, kid = c.p('kid') || c.p('elder') || l2, el = c.p('elder') || rd;
      c.act(l1, 'surprised');
      yield c.say([l1, 'really']);
      if (l2 !== l1) { c.act(l2, 'explain'); yield c.say([l2, 'sister']); }
      c.act(kid, 'thinkChin');
      yield c.say([kid, 'who']);
      c.mood(rd, null); c.stopAct(rd); c.act(rd, 'shrug');
      yield c.say([rd, 'said']);
      const no = ls.find((p) => p !== kid) || l1;
      c.act(no, 'shake');
      yield c.say([no, st + 'No']);
      c.act(el, 'explain');
      yield c.say([el, 'check']);
      nods(c, c.all(), el);
      for (const p of ls) c.stopAct(p);
      pp.grow(0, 0.4); c.sfx('rustle', c.cx, c.cz, 0.6);
      yield 1.2;
    },
    joinEmote: 'think', joinFx: 'question',
  },

  // ---------------------------------------------------------------------------------------------------------------
  // E13 a puppet show for the children (from Day 9; original puppets: a proud parrot and a little frog)
  {
    id: 'puppet', towns: ['hearth', 'garden', 'exercise', 'market'], periods: ['noon', 'evening'], fromDay: 9, weight: 1, min: 2, calls: 3,
    slots: [
      { id: 'puppeteer', tag: 'puppeteer', age: ['adult'], need: true, guest: 'must', side: 1, wide: true },
      { id: 'k1', tag: 'kid', age: ['child'], need: true, guest: 'ok' },
      { id: 'k2', tag: 'kid', age: ['child', 'teen'], guest: 'no' },
      { id: 'k3', tag: 'kid', age: ['child', 'teen'], guest: 'no' },
      { id: 'w', tag: 'watch', age: ['teen', 'adult', 'elder'], guest: 'no' },
    ],
    layout(k, cx, cz, s) {
      const a = k.arc(cx, cz, s, 3, 2.05, 0.0, 0.85);
      const w = k.arc(cx, cz, s, 1, 3.0, 0.5, 0.5)[0];
      return { spots: { puppeteer: S(cx - s * 0.8, cz, s > 0 ? PI / 2 : -PI / 2, { noLine: true }), k1: a[0], k2: a[1], k3: a[2], w }, prop: { x: cx, z: cz, r: 0.8 } };
    },
    setup(c) {
      const pu = c.p('puppeteer');
      const bo = (c.mem.booth = c.part('booth'));
      if (bo && pu) { c.carry(bo, pu, 0, 0, 0.62, 0); bo.scale(0.42); c.tapParts.push(bo); c.act(pu, 'carryFront', { loop: true }); }
      c.mem.parrot = c.part('parrot'); c.mem.frog = c.part('frog'); c.mem.bars = [c.part('bar'), c.part('bar')];
      for (const p of [c.mem.parrot, c.mem.frog, ...c.mem.bars]) p?.show(false);
      c.mem.fake = [0, 1].map((i) => ({ name: i ? 'frog' : 'parrot', height: 0.12, root: { position: { x: 0, y: 0, z: 0 }, getWorldPosition(out) { return out.set(this.position.x, this.position.y, this.position.z); } } }));
    },
    frame(c) {
      if (!c.mem.show) return;
      const bo = c.mem.booth, h = bo.ry, cs = Math.cos(h), sn = Math.sin(h);
      const at = (lx, ly, lz, out) => { out.x = bo.pos.x + lx * cs + lz * sn; out.y = ly; out.z = bo.pos.z - lx * sn + lz * cs; return out; };
      const t = c.t, pr = c.mem.parrot, fr = c.mem.frog, mood = c.mem.pmood || {};
      const P = at(-0.3, 1.08, 0.12, c.mem.pp || (c.mem.pp = {})), F = at(0.3, 1.0, 0.12, c.mem.fp || (c.mem.fp = {}));
      const pb = mood.parrot === 'proud' ? Math.abs(Math.sin(t * 6)) * 0.08 : Math.sin(t * 2) * 0.02;
      const fb = mood.frog === 'hop' ? Math.abs(Math.sin(t * 5)) * 0.1 : Math.sin(t * 1.6 + 1) * 0.015;
      pr.pos.set(P.x, P.y + pb, P.z); pr.ry = h + 0.5 + (mood.parrot === 'proud' ? Math.sin(t * 3) * 0.3 : 0); pr.rx = mood.parrot === 'sorry' ? 0.55 : 0; pr.dirty = true;
      fr.pos.set(F.x, F.y + fb, F.z); fr.ry = h - 0.5; fr.rx = mood.frog === 'sad' ? 0.35 : mood.frog === 'bow' ? 0.6 : 0; fr.dirty = true;
      const bars = c.mem.bars;
      bars[0]?.pos.set(P.x, 1.9 + pb * 0.5, P.z); if (bars[0]) { bars[0].ry = h; bars[0].dirty = true; }
      bars[1]?.pos.set(F.x, 1.9 + fb * 0.5, F.z); if (bars[1]) { bars[1].ry = h; bars[1].dirty = true; }
      c.rig.string(0, P.x - 0.12 * cs, 1.9, P.z + 0.12 * sn, pr.pos.x - 0.04 * cs, pr.pos.y + 0.04, pr.pos.z + 0.04 * sn);
      c.rig.string(1, P.x + 0.12 * cs, 1.9, P.z - 0.12 * sn, pr.pos.x + 0.04 * cs, pr.pos.y + 0.12, pr.pos.z - 0.04 * sn);
      c.rig.string(2, F.x - 0.12 * cs, 1.9, F.z + 0.12 * sn, fr.pos.x - 0.05 * cs, fr.pos.y + 0.03, fr.pos.z + 0.05 * sn);
      c.rig.string(3, F.x + 0.12 * cs, 1.9, F.z - 0.12 * sn, fr.pos.x + 0.05 * cs, fr.pos.y + 0.03, fr.pos.z - 0.05 * sn);
      for (const [i, q] of [[0, pr.pos], [1, fr.pos]]) { const r = c.mem.fake[i].root.position; r.x = q.x; r.y = q.y - 0.1; r.z = q.z; }
    },
    *script(c) {
      const pu = c.p('puppeteer'), bo = c.mem.booth;
      if (!pu || !bo) return;
      yield c.upto(() => !c.ok(pu) || c.at(pu), 30);
      if (!c.ok(pu) || !c.at(pu)) { if (c.ok(pu)) c.leave(pu, true); return; } // (the carrier never got here: nothing happens without them)
      // set down and unfolded
      bo.place(c.cx, 0, c.cz, c.h - c.s * 0.6); // (turned a little toward the camera: the show reads)
      // its footprint: two circles along the frame (1.42 x 0.47 m), not one round the whole of it, so the puppeteer
      // stands just behind it, off it; each goes into the walk space once nobody stands on it
      { const ry = bo.ry, cs = Math.cos(ry), sn = Math.sin(ry), at = (lx, lz) => [c.cx + lx * cs + lz * sn, c.cz - lx * sn + lz * cs];
        const [ax, az] = at(-0.42, -0.12), [bx, bz] = at(0.42, -0.12); bo.ob = c.block(ax, az, 0.3, bo); bo.ob2 = c.block(bx, bz, 0.3, bo); }
      c.stopAct(pu); c.act(pu, 'pickUp');
      bo.grow(1, 0.7);
      c.burst('dust', c.cx, 0.2, c.cz, { count: 10, spread: 0.6, up: 0.4 });
      yield 0.9;
      const pb = near(c, c.cx - c.s * 0.75, c.cz - 0.2, c.cx - c.s * 2, c.cz, 0.0);
      if (pb && c.walk(pu, pb.x, pb.z, 0.8)) yield c.upto(() => c.at(pu), 3);
      c.face(pu, c.h); c.mood(pu, 'play');
      for (const p of [c.mem.parrot, c.mem.frog, ...c.mem.bars]) p?.scale(0.01).show(true).grow(1, 0.4);
      c.rig.stringsOn(4); c.mem.show = true;
      c.sfx('mallet', c.cx, c.cz, 0.7);
      const kids = c.all().filter((p) => p !== pu);
      yield gathered(c, kids, 14);
      c.lookAll(c.cx, c.cz, kids);
      for (const p of kids) c.act(p, 'gatherLook', { loop: true, target: { x: c.cx, y: 1.1, z: c.cz } });
      yield 1.0;
      const [fp, ff] = c.mem.fake;
      c.mem.pmood = { parrot: 'proud' };
      yield c.sayAs(fp, 'proud');
      c.mem.pmood = { frog: 'sad' };
      yield c.sayAs(ff, 'hurt');
      c.mem.pmood = { parrot: 'sorry', frog: 'sad' };
      yield 0.8;
      yield c.sayAs(fp, 'sorry');
      c.mem.pmood = { frog: 'hop' };
      const k1 = c.p('k1') || kids[0];
      c.act(k1, 'pointAt', { target: { x: c.cx, y: 1.1, z: c.cz } }); c.expr(k1, 'surprised', 2);
      yield c.say([k1, 'nobut']);
      c.mem.pmood = {};
      yield c.say([pu, 'real']);
      nods(c, kids, null);
      const k2 = c.p('k2') || k1;
      c.act(k2, 'cheer');
      yield c.say([k2, 'again']);
      c.mem.pmood = { parrot: 'sorry', frog: 'bow' };
      c.react(kids, 'applaud'); c.sfx('clap', c.cx, c.cz, 0.8); c.sfx('mallet', c.cx, c.cz, 0.6);
      yield 2.0;
      for (const p of kids) c.stopAct(p);
      // folded up and away
      c.mem.show = false; c.rig.stringsOn(0);
      for (const p of [c.mem.parrot, c.mem.frog, ...c.mem.bars]) p?.grow(0, 0.3);
      c.mood(pu, null);
      yield 0.4;
      c.unblock(bo.ob); c.unblock(bo.ob2); bo.ob = bo.ob2 = null;
      bo.grow(0.42, 0.6); c.burst('dust', c.cx, 0.2, c.cz, { count: 8, spread: 0.5, up: 0.3 });
      const back = { x: c.cx - c.s * 0.62, z: c.cz };
      if (c.walk(pu, back.x, back.z, 0.8)) yield c.upto(() => c.at(pu), 4);
      c.face(pu, c.h + PI);
      yield 0.7;
      c.carry(bo, pu, 0, 0, -0.62, 0);
      c.leave(pu, true);
      yield 1.0;
    },
    onWrap(c) {
      c.mem.show = false; c.rig.stringsOn(0);
      for (const p of [c.mem.parrot, c.mem.frog, ...(c.mem.bars || [])]) p?.grow(0, 0.3);
      const pu = c.p('puppeteer'), bo = c.mem.booth;
      if (pu && bo) { if (bo.ob) c.unblock(bo.ob); if (bo.ob2) c.unblock(bo.ob2); bo.ob = bo.ob2 = null; bo.grow(0.42, 0.5); c.carry(bo, pu, 0, 0, 0.62, 0); }
    },
    propTap(c) { c.mem.pmood = { frog: 'bow' }; c.mayaAct('cheer'); setTimeout(() => { c.mem.pmood = {}; }, 1500); },
    joinEmote: 'cheer', joinFx: 'confetti',
  },
];
