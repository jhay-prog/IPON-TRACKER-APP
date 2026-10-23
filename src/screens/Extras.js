import React, { useState } from 'react';
import { View, Pressable, Alert, Platform } from 'react-native';
import Constants from 'expo-constants';
import { useTheme } from '../theme';
import { useData } from '../store';
import { streaks, dayKey, sod, peso, fmtDate, ledger } from '../calc';
import { Btn, Card, Chip, Divider, Empty, Field, Hscroll, Progress, Screen, Section, Txt, TxRow } from '../ui';

export function Calendar({ navigation }) {
  const t = useTheme(); const { state } = useData();
  const [m, setM] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [sel, setSel] = useState(dayKey(new Date()));
  const info = {}; state.tx.forEach((x) => { const k = dayKey(x.ts); info[k] = info[k] || {}; info[k][x.type === 'save' ? 's' : 'w'] = true; });
  const { after } = ledger(state.accounts, state.tx);
  const lead = m.getDay(); const n = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: n }, (_, i) => i + 1)];
  const key = (d) => dayKey(new Date(m.getFullYear(), m.getMonth(), d));
  const dayTx = state.tx.filter((x) => dayKey(x.ts) === sel).sort((a, b) => (a.ts < b.ts ? 1 : -1));
  return (
    <Screen>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Chip label="‹" onPress={() => setM(new Date(m.getFullYear(), m.getMonth() - 1, 1))} />
          <Txt weight="700">{m.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</Txt>
          <Chip label="›" onPress={() => setM(new Date(m.getFullYear(), m.getMonth() + 1, 1))} />
        </View>
        <View style={{ flexDirection: 'row' }}>{'SMTWTFS'.split('').map((d, i) => <Txt key={i} size={11} color={t.sub} style={{ flex: 1, textAlign: 'center' }}>{d}</Txt>)}</View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {cells.map((d, i) => {
            const k = d ? key(d) : null; const f = k ? info[k] : null;
            return (
              <Pressable key={i} disabled={!d} accessibilityRole="button" onPress={() => setSel(k)} style={{ width: `${100 / 7}%`, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: k === sel ? t.elev : 'transparent' }}>
                <Txt size={13} weight={k === dayKey(new Date()) ? '700' : '400'}>{d || ''}</Txt>
                <View style={{ flexDirection: 'row', gap: 3, height: 6, marginTop: 3 }}>{f && f.s && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.green }} />}{f && f.w && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.red }} />}</View>
              </Pressable>
            );
          })}
        </View>
        <Txt size={12} color={t.sub} style={{ marginTop: 8 }}>Green dot: saved. Red dot: withdrew.</Txt>
      </Card>
      <Section title={fmtDate(sel + 'T12:00:00')} />
      <Card style={{ paddingVertical: 4 }}>
        {dayTx.length === 0 ? <Empty text="Nothing recorded on this day." /> : dayTx.map((x, i) => <View key={x.id}>{i > 0 && <Divider />}<TxRow tx={x} acct={state.accounts.find((a) => a.id === x.accountId)} after={after[x.id]} onPress={() => navigation.navigate('TxDetail', { id: x.id })} /></View>)}
      </Card>
    </Screen>
  );
}

const KINDS = [['weekday', 'Every weekday'], ['day', 'Every day'], ['week', 'Every week']];
function progress(c, tx) {
  const start = sod(new Date()); start.setDate(start.getDate() - start.getDay());
  const mine = tx.filter((x) => x.type === 'save' && new Date(x.ts) >= start);
  if (c.kind === 'week') { const s = mine.reduce((a, x) => a + x.amount, 0); return { done: Math.min(s, c.amount), goal: c.amount, label: `${peso(s)} of ${peso(c.amount)} this week`, pct: (s / c.amount) * 100 }; }
  const per = {}; mine.forEach((x) => { const k = dayKey(x.ts); per[k] = (per[k] || 0) + x.amount; });
  const goal = c.kind === 'weekday' ? 5 : 7; let met = 0;
  for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(d.getDate() + i); const wk = d.getDay() > 0 && d.getDay() < 6; if ((c.kind === 'day' || wk) && (per[dayKey(d)] || 0) >= c.amount) met++; }
  return { done: met, goal, label: `${met} of ${goal} days this week`, pct: (met / goal) * 100 };
}

export function Challenges() {
  const t = useTheme(); const { state, addChallenge, removeChallenge } = useData();
  const s = streaks(state.tx);
  const [kind, setKind] = useState('weekday'); const [amt, setAmt] = useState(''); const [err, setErr] = useState('');
  const add = () => {
    const v = Number(amt);
    if (!(v > 0)) return setErr('Enter an amount above zero.');
    addChallenge({ kind, amount: v }); setAmt(''); setErr('');
  };
  const del = (c) => Alert.alert('Remove challenge?', '', [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: () => removeChallenge(c.id) }]);
  return (
    <Screen>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Card style={{ flex: 1 }}><Txt size={12} color={t.sub}>Current streak</Txt><Txt size={24} weight="700" color={t.green}>{s.cur} {s.cur === 1 ? 'day' : 'days'}</Txt><Txt size={12} color={t.sub}>Best: {s.best}</Txt></Card>
        <Card style={{ flex: 1 }}><Txt size={12} color={t.sub}>Weekly streak</Txt><Txt size={24} weight="700" color={t.green}>{s.weeks} {s.weeks === 1 ? 'week' : 'weeks'}</Txt><Txt size={12} color={t.sub}>With a deposit</Txt></Card>
      </View>
      <Section title="Your challenges" />
      {state.challenges.length === 0 && <Card><Empty text="No challenges yet. Add one below, like saving ₱100 every weekday." /></Card>}
      {state.challenges.map((c) => { const p = progress(c, state.tx); return (
        <Card key={c.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Txt weight="700">{peso(c.amount)} · {KINDS.find((k) => k[0] === c.kind)[1].toLowerCase()}</Txt><Pressable accessibilityRole="button" onPress={() => del(c)}><Txt size={13} color={t.sub}>Remove</Txt></Pressable></View>
          <Progress pct={p.pct} /><Txt size={12} color={t.sub}>{p.label}{p.pct >= 100 ? ' · Complete!' : ''}</Txt>
        </Card>); })}
      <Section title="New challenge" />
      <Hscroll>{KINDS.map(([k, l]) => <Chip key={k} label={l} active={kind === k} onPress={() => setKind(k)} />)}</Hscroll>
      <Field label="Amount per period" value={amt} onChangeText={setAmt} keyboardType="decimal-pad" placeholder="100" error={err} />
      <Btn title="Add challenge" onPress={add} />
    </Screen>
  );
}

export async function ensureNotifications() {
  if (Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo') return false;
  const Notifications = await import('expo-notifications');
  const cur = await Notifications.getPermissionsAsync();
  const ok = cur.granted || (await Notifications.requestPermissionsAsync()).granted;
  if (ok && Platform.OS === 'android') await Notifications.setNotificationChannelAsync('default', { name: 'Saving reminders', importance: Notifications.AndroidImportance.DEFAULT });
  return ok;
}

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const pad = (n) => String(n).padStart(2, '0');
export function Reminders() {
  const t = useTheme(); const { state, addReminder, removeReminder } = useData();
  const [hh, setHh] = useState('18'); const [mm, setMm] = useState('00'); const [rep, setRep] = useState('weekly'); const [wd, setWd] = useState(5); const [err, setErr] = useState('');
  const add = async () => {
    const h = Number(hh); const m = Number(mm);
    if (!(h >= 0 && h <= 23 && m >= 0 && m <= 59) || hh === '' || mm === '') return setErr('Enter a time like 18 : 00 (24-hour).');
    if (Constants.executionEnvironment === 'storeClient') return setErr('Saving reminders are unavailable in Expo Go. Install the standalone Ipon app to use them.');
    try {
      if (!(await ensureNotifications())) return setErr('Notifications are turned off for this app in your phone settings.');
      const Notifications = await import('expo-notifications');
      const trigger = rep === 'daily' ? { hour: h, minute: m, repeats: true } : { weekday: wd + 1, hour: h, minute: m, repeats: true };
      const notifId = await Notifications.scheduleNotificationAsync({ content: { title: 'Time to save', body: 'Add today\'s savings to Ipon.' }, trigger });
      addReminder({ hour: h, minute: m, repeat: rep, weekday: wd, notifId }); setErr('');
    } catch (error) {
      setErr(`Could not schedule reminder: ${error.message}`);
    }
  };
  const del = async (r) => {
    if (Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo') {
      removeReminder(r.id);
      return;
    }
    try {
      const Notifications = await import('expo-notifications');
      await Notifications.cancelScheduledNotificationAsync(r.notifId);
      removeReminder(r.id);
    } catch (error) {
      setErr(`Could not remove reminder: ${error.message}`);
    }
  };
  return (
    <Screen>
      <Section title="Your reminders" />
      {state.reminders.length === 0 && <Card><Empty text="No reminders yet." /></Card>}
      {state.reminders.map((r) => (
        <Card key={r.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View><Txt weight="700">{pad(r.hour)}:{pad(r.minute)}</Txt><Txt size={12} color={t.sub}>{r.repeat === 'daily' ? 'Every day' : `Every ${WD[r.weekday]}`}</Txt></View>
          <Pressable accessibilityRole="button" onPress={() => del(r)} style={{ minHeight: 44, justifyContent: 'center' }}><Txt color={t.red}>Remove</Txt></Pressable>
        </Card>
      ))}
      <Section title="New reminder" />
      <Hscroll>{[['daily', 'Daily'], ['weekly', 'Weekly']].map(([k, l]) => <Chip key={k} label={l} active={rep === k} onPress={() => setRep(k)} />)}</Hscroll>
      {rep === 'weekly' && <Hscroll>{WD.map((d, i) => <Chip key={d} label={d} active={wd === i} onPress={() => setWd(i)} />)}</Hscroll>}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><Field label="Hour (0-23)" value={hh} onChangeText={setHh} keyboardType="number-pad" maxLength={2} /></View>
        <View style={{ flex: 1 }}><Field label="Minute" value={mm} onChangeText={setMm} keyboardType="number-pad" maxLength={2} error={err} /></View>
      </View>
      <Btn title="Add reminder" onPress={add} />
    </Screen>
  );
}
