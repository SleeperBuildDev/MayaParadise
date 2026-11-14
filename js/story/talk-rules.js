// The talk's rules, with no DOM and no three.js (so they can be checked in node). talk.js draws them.
//
//   const s = createTalkState(data, { start, rng })
//   s.nextLine()                    the person says their next line (call once at the start and after every turn)
//   s.look()                        -> outcome  costs 1 calm, not a turn: the true need is inked in gold
//   s.play(cardId)                  -> outcome  a card from the hand (uses the turn)
//   s.listen() / s.breathe()        -> outcome  (use the turn; Listen is labelled Ask from story day 9)
//   s.stepBack()                    -> outcome  only on a stone that is theirs (held button in the UI)
//   s.canUse(itemId, talk) / s.useItem(itemId, talk) -> outcome   a bag item (free: no turn; data.items.max per talk)
//   s.preview(cardId)               -> { result, steps }  what a card would do now (the reading glass)
//   s.view()                        a plain snapshot for drawing
//   s.played                        [{ id, result }] every card said, in order (run() returns it)
//
// Numbers (owner may tune): calm 4 (max 4); steam 0..5, hot at 3+; 7 turns; up to 5 stones.
//   Look: -1 calm, needs 2+ calm, once per line; shows the true need and which cards really answer it.
//   Card that answers the true need: +1 stone, steam -1. (Gold no longer counts double, review: a gold card
//     instead stays in the hand through Breathe.)
//   Card that does not: -1 calm, no step.
//   Look-alike card (answers nothing, only looks as if it does): -1 calm, steam +1, a stone back
//     (never behind the stone this attempt started on).
//   Steam 3+: words don't enter the ear: a card does nothing at all (turn spent, card kept, no calm lost).
//   Listen/Ask: steam -1, the next line's true need shows for free; a line marked `heard` also moves a stone.
//   Breathe: calm +1, a fresh hand (gold cards stay).
//   A stone that is theirs (data.stepBack: the last one; data.theirs: any): no card moves it. Playing one
//     answers for them: they lean on Maya and the talk ends "not yet". Holding Step back lets them decide.
//   faceDownUntil k: while pos < k the hand is face down; a card turned up early is a miss ('interrupt').
//   handAt { stone: [ids] }: on that stone the hand is exactly those cards (Breathe redeals the same).
//   once: a card that fits leaves the hand for good (talk.js keeps it in save.cardsGone).
//   Items (one per talk unless data.items.max says more; banned ones greyed): tea calm +2 · thanaka/teapot
//     steam -1 · sprig: first turn only, one stone ahead · fan: blocks the next calm loss · glass: preview a
//     card · eraser: a card that missed comes back (the calm stays lost) · five-question card: shows which
//     pencil cards are hearsay. Using an item is not a turn.
//   Win: reach the signpost (stone N) within the turns. Not yet: calm 0 or turns used up. Stones stay.
export const NEEDS = ['afraid', 'given', 'hot', 'looksdown', 'envy', 'cling', 'unknown', 'own'];
export const RULES = { calm: 4, steam: 1, hot: 3, steamMax: 5, turns: 7, hand: 4, lookCost: 1, lookMinCalm: 2, maxStones: 5, items: 1 };

export function createTalkState(data, opts = {}) {
  const rng = opts.rng || Math.random;
  const N = Math.max(1, Math.min(RULES.maxStones, data.stones.length));
  const theirs = new Set(data.theirs || (data.stepBack ? [N - 1] : []));
  const cards = new Map(data.hand.map((c) => [c.id, c]));
  const start = Math.max(0, Math.min(N - 1, opts.start ?? data.start ?? 0));
  const handAt = data.handAt || null;
  const s = {
    N, theirs,
    pos: start, floor: start, best: start,
    steam: clamp(data.steam ?? RULES.steam, 0, RULES.steamMax),
    calm: data.calm ?? RULES.calm, calmMax: data.calm ?? RULES.calm,
    turns: data.turns ?? RULES.turns, turn: 0,
    line: null, inked: false, freeInk: false, looked: false,
    lineIdx: new Array(N).fill(0),
    hand: [], deck: [], discard: [],
    over: null, reason: null,
    played: [], gone: new Set(), lastCard: null, lastMiss: null,
    shield: 0, itemsUsed: [], checked: false, atStone: null,
  };
  const handSize = Math.min(data.handSize ?? RULES.hand, cards.size);
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const live = (id) => !s.gone.has(id) && cards.has(id);
  function drawOne() {
    if (s.atStone != null) return null; // a fixed hand on this stone
    if (!s.deck.length) { s.deck = shuffle(s.discard.filter((id) => !s.hand.includes(id) && live(id))); s.discard = []; }
    while (s.deck.length && !live(s.deck[0])) s.deck.shift();
    return s.deck.shift() ?? null;
  }
  let dealt = false;
  function freshHand() {
    if (s.atStone != null) { s.hand = handAt[s.atStone].filter(live); return; }
    // a whole new hand from every card; the very first hand keeps the order the data gives; gold cards stay
    const keep = dealt ? s.hand.filter((id) => cards.get(id)?.gold && live(id)) : [];
    const all = [...cards.keys()].filter((id) => live(id) && !keep.includes(id));
    s.deck = dealt ? shuffle(all) : all;
    dealt = true;
    s.hand = keep.slice(0, handSize);
    s.discard = [];
    while (s.hand.length < handSize && s.deck.length) s.hand.push(s.deck.shift());
  }
  // handAt: the hand follows the stone she stands on
  function syncHand() {
    const want = handAt && handAt[s.pos] ? s.pos : null;
    if (want === s.atStone) return false;
    s.atStone = want;
    if (want != null) s.hand = handAt[want].filter(live);
    else { dealt = true; s.hand = []; freshHand(); }
    return true;
  }
  freshHand();
  syncHand();

  const onTheirs = () => theirs.has(s.pos);
  // a card can carry them up to (not past) the next stone that is theirs
  const cap = () => { let c = N; for (const t of theirs) if (t >= s.pos && t < c) c = t; return c; };
  const fits = (card) => !card.lookalike && (card.answers || []).includes(s.line?.need);
  const faceDown = () => data.faceDownUntil != null && s.pos < data.faceDownUntil;
  // calm lost (the fan blocks one loss)
  function loseCalm(out, n = 1) {
    if (s.shield > 0) { s.shield--; out.shielded = true; return; }
    s.calm = Math.max(0, s.calm - n);
  }

  function endTurn(out) {
    s.turn++;
    s.best = Math.max(s.best, s.pos);
    if (s.pos >= N) { s.over = 'won'; s.reason = 'signpost'; }
    else if (s.calm <= 0) { s.over = 'notyet'; s.reason = 'calm'; }
    else if (s.turn >= s.turns) { s.over = 'notyet'; s.reason = 'turns'; }
    out.over = s.over;
    return out;
  }
  // what a card would do now, without doing it
  function judge(card) {
    if (onTheirs()) return 'lean';
    if (faceDown()) return 'interrupt';
    if (s.steam >= RULES.hot) return 'hot';
    if (fits(card)) return 'fit';
    if (card.lookalike) return 'backfire';
    return 'miss';
  }

  Object.assign(s, {
    cards,
    card: (id) => cards.get(id),
    fits,
    faceDown,
    nextLine() {
      if (s.over) return null;
      s.handChanged = syncHand();
      const lines = data.stones[Math.min(s.pos, N - 1)].lines;
      const i = s.lineIdx[s.pos]++ % lines.length;
      s.line = lines[i];
      s.inked = s.freeInk;
      s.freeInk = false;
      s.looked = false;
      if (s.line.steam) s.steam = clamp(s.steam + s.line.steam, 0, RULES.steamMax);
      return s.line;
    },
    canLook() { return !s.over && !s.inked && s.calm >= RULES.lookMinCalm; },
    look() {
      if (!s.canLook()) return { type: 'look', ok: false };
      s.calm -= RULES.lookCost;
      s.inked = true;
      s.looked = true;
      return { type: 'look', ok: true, need: s.line.need, seems: s.line.seems || s.line.need, tell: s.line.tell || null };
    },
    preview(id) {
      const card = cards.get(id);
      if (!card) return null;
      const result = judge(card);
      return { result, steps: result === 'fit' ? Math.min(cap(), s.pos + 1) - s.pos : result === 'backfire' ? -Math.min(1, s.pos - s.floor) : 0 };
    },
    play(id) {
      const card = cards.get(id);
      if (!card || !s.hand.includes(id) || s.over) return { type: 'play', ok: false };
      const out = { type: 'play', ok: true, card, from: s.pos };
      s.lastCard = id;
      const r = judge(card);
      if (r === 'lean') {
        // answering for them: they lean on Maya instead of deciding
        loseCalm(out);
        out.result = 'lean';
        s.played.push({ id, result: 'lean' });
        s.turn++;
        s.over = 'notyet'; s.reason = 'lean';
        out.over = s.over;
        return out;
      }
      if (r === 'hot') { out.result = 'hot'; s.played.push({ id, result: 'hot' }); return endTurn(out); }
      if (r === 'interrupt') { loseCalm(out); out.result = 'interrupt'; }
      else if (r === 'fit') {
        s.pos = Math.min(cap(), s.pos + 1);
        s.steam = Math.max(0, s.steam - 1);
        out.result = 'fit';
        if (card.once) { s.gone.add(id); out.gone = true; }
      } else if (r === 'backfire') {
        loseCalm(out);
        s.steam = Math.min(RULES.steamMax, s.steam + 1);
        s.pos = Math.max(s.floor, s.pos - 1);
        out.result = 'backfire';
      } else {
        loseCalm(out);
        out.result = 'miss';
      }
      out.steps = s.pos - out.from;
      s.played.push({ id, result: out.result });
      s.lastMiss = out.result === 'miss' || out.result === 'interrupt' || out.result === 'backfire' ? id : null;
      // the card said goes to the discard, the next one comes into the same place in the hand
      const at = s.hand.indexOf(id);
      if (!out.gone) s.discard.push(id);
      s.hand.splice(at, 1);
      if (s.atStone == null) { const n = drawOne(); if (n) s.hand.splice(at, 0, n); }
      return endTurn(out);
    },
    listen() {
      if (s.over) return { type: 'listen', ok: false };
      const out = { type: 'listen', ok: true, from: s.pos, cooled: s.steam > 0 };
      const wasHot = s.steam >= RULES.hot;
      s.steam = Math.max(0, s.steam - 1);
      s.freeInk = true;
      if (s.line?.heard && !wasHot && !onTheirs()) { s.pos = Math.min(cap(), s.pos + 1); out.heard = true; }
      out.steps = s.pos - out.from;
      return endTurn(out);
    },
    breathe() {
      if (s.over) return { type: 'breathe', ok: false };
      const out = { type: 'breathe', ok: true, gained: s.calm < s.calmMax };
      s.calm = Math.min(s.calmMax, s.calm + 1);
      freshHand();
      return endTurn(out);
    },
    stepBack() {
      if (s.over || !onTheirs()) return { type: 'stepBack', ok: false };
      const out = { type: 'stepBack', ok: true, from: s.pos };
      s.pos += 1;
      out.steps = 1;
      return endTurn(out);
    },
    /** Can this bag item be offered now? talk = the item's `talk` entry (items.js). -> '' | reason */
    canUse(itemId, talk) {
      const lim = data.items || {};
      if (s.over) return 'over';
      if (!talk) return 'none';
      if ((lim.ban || []).includes(itemId)) return 'ban';
      if (s.itemsUsed.length >= (lim.max ?? RULES.items)) return 'max';
      if (s.itemsUsed.includes(itemId)) return 'max';
      if (talk.start && (s.turn > 0 || onTheirs())) return 'late';
      if (talk.calm && s.calm >= s.calmMax) return 'full';
      if (talk.steam && s.steam <= 0) return 'cool';
      if (talk.undo && !s.lastMiss) return 'nothing';
      if (talk.check && s.checked) return 'nothing';
      return '';
    },
    useItem(itemId, talk) {
      const why = s.canUse(itemId, talk);
      if (why) return { type: 'item', ok: false, why };
      const out = { type: 'item', ok: true, id: itemId, from: s.pos };
      s.itemsUsed.push(itemId);
      if (talk.calm) { s.calm = Math.min(s.calmMax, s.calm + talk.calm); out.calm = talk.calm; }
      if (talk.steam) { s.steam = clamp(s.steam + talk.steam, 0, RULES.steamMax); out.steam = talk.steam; }
      if (talk.start) { s.pos = Math.min(cap(), s.pos + talk.start); s.floor = s.pos; s.best = Math.max(s.best, s.pos); out.steps = s.pos - out.from; }
      if (talk.shield) { s.shield += talk.shield; out.shield = true; }
      if (talk.preview) out.preview = true; // the UI shows s.preview(card) on the lifted card until one is said
      if (talk.check) { s.checked = true; out.check = true; }
      if (talk.undo) {
        const id = s.lastMiss;
        s.lastMiss = null;
        if (id && !s.hand.includes(id)) {
          const k = s.discard.indexOf(id);
          if (k >= 0) s.discard.splice(k, 1);
          if (s.hand.length >= handSize && s.atStone == null) s.discard.push(s.hand.pop());
          s.hand.unshift(id);
          out.back = id;
        }
      }
      return out;
    },
    view() {
      return { N, pos: s.pos, steam: s.steam, calm: s.calm, calmMax: s.calmMax, turn: s.turn, turns: s.turns, inked: s.inked, hand: [...s.hand], over: s.over, onTheirs: onTheirs(), faceDown: faceDown(), shield: s.shield, items: [...s.itemsUsed] };
    },
  });
  Object.defineProperty(s, 'onTheirs', { get: onTheirs });
  Object.defineProperty(s, 'hot', { get: () => s.steam >= RULES.hot });
  return s;
}

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
