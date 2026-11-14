// Story mode's road network: the book's own roads, the plaza ring opened just east of the fountain,
// the ribbon road down to the tail edge, the bridge, and every street of the open world (every district
// file's ROAD_EDGES), as ONE network (the car is road-locked to it). main.js passes bookWorldOptions()
// to createWorld().
//
// Gated roads (an edge with `gate: 'flag'` in its district file) start CLOSED: they stay in net.edges
// (drawn, and the map knows them) but are cut from their nodes' adjacency, so the car cannot turn onto
// them, and net.nearest() never snaps onto them. net.setGate(flag, on) opens / closes them.
//   net.isOpen(edge)       false for an edge whose gate is closed
//   net.setGate(flag, on)  -> the edges it changed
//   net.gated              every gated edge (edge.gate, edge.look, edge.gateAt, edge.deck)
import { homeRoadData, createNetworkFromData, hubArc, HUB } from '../../game/world/roads.js';
import { ROAD_NODES, ROAD_EDGES, RIBBON_ON_BOOK, BOOK_KEEP_CLEAR } from './region.js';

const RING_SPLIT = 300; // degrees round the plaza hub (270 = south, where the Writing Room's pad is)

/** The book's roads with the ring opened and the ribbon road down to the tail edge (what world.js paints). */
export function bookRoadData() {
  const d = homeRoadData();
  const i = d.edges.findIndex((e) => e.id === 'ringS');
  const ringS = d.edges[i];
  const [x, z] = hubArc(HUB.r, RING_SPLIT, RING_SPLIT).at(0);
  d.nodes.push({ id: 'rSE', x, z });
  d.edges.splice(i, 1,
    { id: 'ringS', a: ringS.a, b: 'rSE', pts: hubArc(HUB.r, 180, RING_SPLIT), bias: ringS.bias, group: 'ring' },
    { id: 'ringSE', a: 'rSE', b: ringS.b, pts: hubArc(HUB.r, RING_SPLIT, 360), bias: ringS.bias, group: 'ring' });
  d.nodes.push({ id: 'bookTail', x: RIBBON_ON_BOOK.at(-1)[0], z: RIBBON_ON_BOOK.at(-1)[1] });
  d.edges.push({ id: 'ribbonRoad', a: 'rSE', b: 'bookTail', pts: RIBBON_ON_BOOK, bias: 0.002 });
  return d;
}

/** Book roads + open world streets, as one data set. */
export function fullRoadData() {
  const b = bookRoadData();
  return { nodes: [...b.nodes, ...ROAD_NODES], edges: [...b.edges, ...ROAD_EDGES] };
}

/** Adds the gate machinery (see the top of this file) and each open-world edge's region data to a network. */
export function gateNet(net) {
  const data = new Map(ROAD_EDGES.map((d) => [d.id, d]));
  const gated = [];
  for (const e of net.edges) {
    const d = data.get(e.id);
    if (!d) continue;
    e.region = true;
    if (d.deck) e.deck = d.deck;
    if (d.town) e.town = d.town; // (lazy towns: whose road this is; drawn once that town is here)
    if (d.gate) { e.gate = d.gate; e.look = d.look || 'boom'; e.gateAt = d.gateAt || null; gated.push(e); }
  }
  const open = new Set();
  const isOpen = (e) => !e.gate || open.has(e.gate);
  let openEdges = net.edges.filter(isOpen);
  const nearest = net.nearest;
  net.nearest = (x, z, only = null) => nearest(x, z, only || openEdges);
  function link(e, on) {
    for (const nd of [e.a, e.b]) {
      const k = nd.edges.indexOf(e);
      if (on && k < 0) nd.edges.push(e);
      if (!on && k >= 0) nd.edges.splice(k, 1);
    }
  }
  for (const e of gated) link(e, false);
  net.gated = gated;
  net.isOpen = isOpen;
  net.setGate = (flag, on) => {
    if (!!on === open.has(flag)) return [];
    if (on) open.add(flag); else open.delete(flag);
    const changed = gated.filter((e) => e.gate === flag);
    for (const e of changed) link(e, !!on);
    openEdges = net.edges.filter(isOpen);
    return changed;
  };
  return net;
}

/** Options for createWorld() in story mode. */
export function bookWorldOptions() {
  const drawNet = createNetworkFromData(bookRoadData());
  const net = gateNet(createNetworkFromData(fullRoadData()));
  const keepClear = (x, z) => BOOK_KEEP_CLEAR.some(([x0, z0, x1, z1]) => x > x0 && x < x1 && z > z0 && z < z1);
  return { net, drawNet, keepClear };
}
