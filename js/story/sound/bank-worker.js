// The sound bank's warm-up, off the main thread: renders every loop and instrument note (bank.js's pure
// renderLoop / renderNote) and posts the samples back one piece at a time; extras-sound.js copies each into the
// live bank (bank.put), which costs a fraction of a millisecond. The game never waits on this: a piece that
// is wanted before it arrives is still rendered on the spot by the bank (the old way).
//
//   in:  { pieces: [['loop', name] | ['note', inst, base], ...] }   (in the order wanted)
//   out: { kind, a, b, d: Float32Array }  per piece (transferred), then { done: true }
import { renderLoop, renderNote } from './bank.js';

self.onmessage = (ev) => {
  const list = ev.data?.pieces || [];
  for (const [kind, a, b] of list) {
    try {
      const d = kind === 'loop' ? renderLoop(a) : renderNote(a, b);
      if (d) self.postMessage({ kind, a, b, d }, [d.buffer]);
    } catch (e) { self.postMessage({ kind, a, b, err: String(e) }); }
  }
  self.postMessage({ done: true });
};
