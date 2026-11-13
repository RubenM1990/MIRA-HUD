// Named moments the look announces (entering / leaving MIRA mode). Hook your own sound
// effects in here if you want them; by default nothing plays.
export const MOMENT = { MIRA_ENTER: "mira_enter", MIRA_EXIT: "mira_exit" };
const listeners = new Set();
export function onMoment(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function moment(name) { for (const fn of listeners) { try { fn(name); } catch (_) {} } }
