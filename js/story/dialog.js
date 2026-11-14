// Story dialogue on top of the game's dialogue box: speaker names, their faces, choices.
//
//   const d = createDialog(game, story)
//   await d.say('phothar', [{my, en}, ...], { face: 'sad', emote: 'shrug' })   'maya' = Maya
//   const i = await d.choose([{my, en}, ...])        index of the picked option
//                                                    an option { hold: true, my, en } is a held Step back: drawn
//                                                    like the talk's button, it fires after a 0.8 s hold
//   d.bark('maya', {my, en}, ms, { name, actor })    a short non-blocking bubble
//   say/bark opts.name: {my, en} (or a string) names a speaker who is not in cast.js (a walk-on: the tea
//       master, "The class", a bridge hand); opts.actor: that walk-on's person (people.js) for the face
//       and the talking mouth. A people-map entry with its own `name` is named by it too.
import { tr } from '../game/ui.js';
import { castById } from './cast.js';

const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);
const MAYA = { my: 'မာရာ', en: 'Maya' };

export function createDialog(game, story) {
  const ui = game.ui;
  injectStyle();
  const nameEl = document.querySelector('#dialog .dialog-name');
  let box = null;

  const asName = (n) => (typeof n === 'string' ? { my: n, en: n } : n);
  function speaker(id, o = {}) {
    if ((!id || id === 'maya') && !o.name) return { name: MAYA, face: (f) => game.maya.faceCanvas(f || 'smile'), actor: game.maya };
    const e = id ? story.people.get(id) : null;
    const c = id ? castById(id) : null;
    const actor = o.actor || e?.p || null;
    return {
      name: asName(o.name) || c?.name || asName(e?.name) || { my: id || '', en: id || '' },
      face: (f) => (actor && typeof actor.portrait === 'function' ? actor.portrait(f || 'talk') : undefined),
      actor,
    };
  }

  return {
    async say(id, lines, opts = {}) {
      if (!Array.isArray(lines)) lines = [lines];
      const s = speaker(id, opts);
      nameEl.textContent = tr(s.name);
      if (opts.face) call(s.actor, 'setFace', opts.face, 99);
      if (opts.emote) call(s.actor, 'emote', opts.emote);
      if (opts.mood !== undefined) call(s.actor, 'setMood', opts.mood);
      const total = lines.reduce((n, l) => n + tr(l).length, 0);
      call(s.actor, 'talk', Math.min(8, 1 + total * 0.05));
      await ui.say(lines, {
        face: s.face(opts.face === 'talk' ? 'smile' : opts.face || 'smile'),
        auto: opts.auto ?? false,
        onTick: () => call(game.audio, 'play', 'type'),
      });
      call(s.actor, 'talk', 0);
      nameEl.textContent = tr(MAYA);
    },

    choose(options) {
      return new Promise((resolve) => {
        box?.remove();
        box = document.createElement('div');
        box.id = 'story-choices';
        document.getElementById('game').classList.add('choosing');
        const pick = (i) => {
          box.remove();
          box = null;
          document.getElementById('game').classList.remove('choosing');
          resolve(i);
        };
        options.forEach((o, i) => {
          const b = document.createElement('button');
          b.type = 'button';
          if (o && o.hold) {
            // a held Step back (Day 11 on): the ring fills while held; letting go early does nothing
            b.className = 'hold';
            b.innerHTML = `<span class="ring"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5 7.5 12l7 7"/><path d="M19.5 5 12.5 12l7 7" opacity=".45"/></svg></span><span class="tx"></span><small></small>`;
            b.querySelector('.tx').textContent = tr(o);
            b.querySelector('small').textContent = tr(o.sub || { my: 'ဖိထားပါ', en: 'hold' });
            let t0 = 0, raf = 0;
            const stop = () => { cancelAnimationFrame(raf); t0 = 0; b.style.setProperty('--p', 0); b.classList.remove('holding'); };
            const tick = (now) => {
              if (!t0) return;
              const p = Math.min(1, (now - t0) / (o.ms || 800));
              b.style.setProperty('--p', p);
              if (p >= 1) { stop(); call(game.audio, 'play', 'chime'); pick(i); return; }
              raf = requestAnimationFrame(tick);
            };
            b.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); if (t0) return; t0 = performance.now(); b.classList.add('holding'); try { b.setPointerCapture(ev.pointerId); } catch { /* ok */ } raf = requestAnimationFrame(tick); });
            for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(t, stop);
            b.addEventListener('click', (ev) => ev.stopPropagation());
            b.addEventListener('contextmenu', (ev) => ev.preventDefault());
            b.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pick(i); } });
          } else {
            b.textContent = tr(o);
            b.addEventListener('click', (ev) => {
              ev.stopPropagation();
              call(game.audio, 'play', 'click');
              pick(i);
            });
          }
          box.appendChild(b);
        });
        document.getElementById('game').appendChild(box);
      });
    },

    bark(id, line, ms, opts = {}) {
      const s = speaker(id, opts);
      ui.bark?.(tr(line), { face: s.face('smile'), ms });
    },
  };
}

function injectStyle() {
  if (document.getElementById('rc-dialog-style')) return;
  const s = document.createElement('style');
  s.id = 'rc-dialog-style';
  s.textContent = `
  #story-choices button.hold { position: relative; display: grid; grid-template-columns: 40px 1fr; align-items: center; column-gap: 10px; color: #6E1F2A;
    border-color: #6E1F2A; box-shadow: 0 3px 0 #4A1520; touch-action: none; -webkit-user-select: none; user-select: none; --p: 0; }
  #story-choices button.hold .ring { grid-row: span 2; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center;
    background: conic-gradient(#C9A24A calc(var(--p) * 360deg), #EFE6D0 0); }
  #story-choices button.hold .ring svg { width: 30px; height: 30px; padding: 5px; border-radius: 50%; background: #FFFDF8; }
  #story-choices button.hold small { font-size: 12px; color: #8C6A28; font-weight: 600; }
  #story-choices button.hold.holding { transform: translateY(2px); box-shadow: 0 1px 0 #4A1520; }
  `;
  document.head.appendChild(s);
}
