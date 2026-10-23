import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { ledger, round2, uid } from './calc';

const KEY = 'ipon.data.v1';
export const GENERAL = 'general';
export const LockCtx = createContext(() => {});
const fresh = () => ({
  settings: { dark: true },
  accounts: [{ id: GENERAL, name: 'General Savings', general: true, initial: 0, target: 0, desc: '', deadline: null, color: '#6EE7B7', created: new Date().toISOString(), archived: false }],
  tx: [], challenges: [], reminders: [],
});
const Ctx = createContext(null);
export const useData = () => useContext(Ctx);

export function DataProvider({ children }) {
  const [state, setState] = useState(null);
  const ref = useRef(null);
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((s) => (s ? { ...fresh(), ...JSON.parse(s) } : fresh())).catch(() => fresh()).then((d) => { ref.current = d; setState(d); });
  }, []);
  const commit = useCallback((d) => { ref.current = d; setState(d); AsyncStorage.setItem(KEY, JSON.stringify(d)); }, []);

  const api = useMemo(() => {
    const tryTx = (tx) => { const r = ledger(ref.current.accounts, tx); if (r.error) return r.error; commit({ ...ref.current, tx }); return null; };
    const upd = (k, fn) => commit({ ...ref.current, [k]: fn(ref.current[k]) });
    return {
      // Date and time are stamped automatically here, at the moment the transaction is saved.
      addTx: (t) => tryTx([...ref.current.tx, { id: uid(), ...t, amount: round2(t.amount), ts: new Date().toISOString() }]),
      updateTx: (id, p) => tryTx(ref.current.tx.map((x) => (x.id === id ? { ...x, ...p, amount: round2(p.amount ?? x.amount) } : x))),
      deleteTx: (id) => tryTx(ref.current.tx.filter((x) => x.id !== id)),
      addAccount: (a) => { const id = uid(); upd('accounts', (l) => [...l, { id, general: false, archived: false, created: new Date().toISOString(), ...a }]); return id; },
      updateAccount: (id, p) => upd('accounts', (l) => l.map((a) => (a.id === id ? { ...a, ...p } : a))),
      setArchived: (id, v) => upd('accounts', (l) => l.map((a) => (a.id === id && !a.general ? { ...a, archived: v } : a))),
      setSettings: (p) => commit({ ...ref.current, settings: { ...ref.current.settings, ...p } }),
      addChallenge: (c) => upd('challenges', (l) => [...l, { id: uid(), created: new Date().toISOString(), ...c }]),
      removeChallenge: (id) => upd('challenges', (l) => l.filter((c) => c.id !== id)),
      addReminder: (r) => upd('reminders', (l) => [...l, { id: uid(), ...r }]),
      removeReminder: (id) => upd('reminders', (l) => l.filter((r) => r.id !== id)),
      replaceAll: (d) => {
        const base = fresh();
        const next = { ...base, ...d, settings: { ...base.settings, ...(d.settings || {}) }, reminders: [] };
        if (!next.accounts.some((a) => a.id === GENERAL)) next.accounts = [base.accounts[0], ...next.accounts];
        const r = ledger(next.accounts, next.tx); if (r.error) return r.error;
        commit(next); return null;
      },
      wipeAll: async () => {
        if (Constants.executionEnvironment === 'standalone' || Constants.executionEnvironment === 'bare') {
          const Notifications = await import('expo-notifications');
          await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
        }
        await AsyncStorage.removeItem(KEY);
        commit(fresh());
      },
    };
  }, [commit]);

  return <Ctx.Provider value={{ state, ...api }}>{children}</Ctx.Provider>;
}
