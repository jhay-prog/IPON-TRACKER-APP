// Pure helpers: money formatting, ledger, goal maths, streaks and chart data.
export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
export const peso = (n) => {
  const v = round2(n || 0);
  const [i, d] = Math.abs(v).toFixed(2).split('.');
  return (v < 0 ? '-' : '') + '₱' + i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + d;
};
export const sod = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const dayKey = (d) => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
export const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
export const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const signed = (t) => (t.type === 'save' ? t.amount : -t.amount);

// Current Category Balance = Initial + Deposits - Withdrawals. Also gives the balance after every
// transaction, and an error if any account would ever go negative (keeps the ledger consistent).
export function ledger(accounts, tx) {
  const bal = {}; const after = {}; let error = null;
  accounts.forEach((a) => { bal[a.id] = a.initial || 0; });
  [...tx].sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0)).forEach((t) => {
    if (bal[t.accountId] === undefined) { error = 'That account no longer exists.'; return; }
    bal[t.accountId] = round2(bal[t.accountId] + signed(t));
    if (bal[t.accountId] < -0.001) { const a = accounts.find((x) => x.id === t.accountId); error = `This would make ${a.name} go below ₱0.00 on ${fmtDate(t.ts)}.`; }
    after[t.id] = bal[t.accountId];
  });
  return { bal, after, error };
}
export const totals = (tx) => tx.reduce((s, t) => (t.type === 'save' ? { ...s, dep: s.dep + t.amount } : { ...s, wd: s.wd + t.amount }), { dep: 0, wd: 0 });

export const RANGES = ['7D', '30D', '3M', '6M', '1Y', 'All'];
export const rangeStart = (k) => {
  const days = { '7D': 7, '30D': 30, '3M': 91, '6M': 182, '1Y': 365 }[k];
  if (!days) return null;
  const d = sod(new Date()); d.setDate(d.getDate() - days + 1); return d;
};
export const inRange = (t, k) => { const s = rangeStart(k); return !s || new Date(t.ts) >= s; };

export function goalInfo(a, bal, tx) {
  const target = a.target || 0;
  const pct = target > 0 ? Math.min(100, (bal / target) * 100) : 0;
  const remaining = Math.max(0, target - bal);
  let plan = null; let eta = null;
  if (target > 0 && remaining > 0 && a.deadline) {
    const days = Math.ceil((new Date(a.deadline + 'T23:59:59') - new Date()) / 86400000);
    plan = days > 0 ? { days, daily: remaining / days, weekly: (remaining / days) * 7, monthly: (remaining / days) * 30.4 } : { days: 0, overdue: true };
  }
  if (target > 0 && remaining > 0) {
    const since = new Date(Date.now() - 30 * 86400000);
    const net = tx.filter((t) => t.accountId === a.id && new Date(t.ts) >= since).reduce((s, t) => s + signed(t), 0);
    const span = Math.max(1, Math.min(30, Math.ceil((Date.now() - new Date(a.created)) / 86400000)));
    if (net / span > 0) eta = new Date(Date.now() + (remaining / (net / span)) * 86400000);
  }
  return { target, pct, remaining, plan, eta };
}

const weekStart = (d) => { const x = sod(d); x.setDate(x.getDate() - x.getDay()); return x; };
export function streaks(tx) {
  const saves = tx.filter((t) => t.type === 'save');
  const days = new Set(saves.map((t) => dayKey(t.ts)));
  let cur = 0; const d = sod(new Date());
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d))) { cur++; d.setDate(d.getDate() - 1); }
  let best = 0; let run = 0; let prev = null;
  [...days].sort().forEach((k) => {
    const dt = new Date(k + 'T00:00:00');
    run = prev && Math.round((dt - prev) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run); prev = dt;
  });
  const weeks = new Set(saves.map((t) => dayKey(weekStart(t.ts))));
  const w = weekStart(new Date()); if (!weeks.has(dayKey(w))) w.setDate(w.getDate() - 7);
  let wk = 0; while (weeks.has(dayKey(w))) { wk++; w.setDate(w.getDate() - 7); }
  return { cur, best, weeks: wk };
}

export function buckets(tx, mode, n) {
  const out = []; const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    let s; let e; let label;
    if (mode === 'W') { s = weekStart(now); s.setDate(s.getDate() - 7 * i); e = new Date(s); e.setDate(e.getDate() + 7); label = `${s.getMonth() + 1}/${s.getDate()}`; }
    else if (mode === 'M') { s = new Date(now.getFullYear(), now.getMonth() - i, 1); e = new Date(now.getFullYear(), now.getMonth() - i + 1, 1); label = s.toLocaleString('en-US', { month: 'short' }); }
    else { s = new Date(now.getFullYear() - i, 0, 1); e = new Date(now.getFullYear() - i + 1, 0, 1); label = String(s.getFullYear()); }
    let dep = 0; let wd = 0;
    tx.forEach((t) => { const d = new Date(t.ts); if (d >= s && d < e) { if (t.type === 'save') dep += t.amount; else wd += t.amount; } });
    out.push({ label, dep, wd, from: s });
  }
  return out;
}

// Total savings over time, rebuilt from the recorded transactions.
export function growth(accounts, tx, range) {
  const init = accounts.reduce((x, a) => x + (a.initial || 0), 0);
  let v = init; const pts = [];
  [...tx].sort((a, b) => (a.ts < b.ts ? -1 : 1)).forEach((t) => { v += signed(t); pts.push({ t: new Date(t.ts).getTime(), v: round2(v) }); });
  const s = rangeStart(range);
  const first = s ? s.getTime() : pts.length ? pts[0].t - 86400000 : Date.now() - 86400000;
  const before = pts.filter((p) => p.t < first);
  return [{ t: first, v: before.length ? before[before.length - 1].v : init }, ...pts.filter((p) => p.t >= first), { t: Date.now(), v: pts.length ? pts[pts.length - 1].v : init }];
}

export function activity(tx, n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = sod(new Date()); d.setDate(d.getDate() - i);
    const k = dayKey(d);
    out.push({ label: String(d.getDate()), v: tx.filter((t) => t.type === 'save' && dayKey(t.ts) === k).reduce((s, t) => s + t.amount, 0), day: d.getDay() });
  }
  return out;
}
