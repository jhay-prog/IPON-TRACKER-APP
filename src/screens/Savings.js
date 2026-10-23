import React, { useLayoutEffect, useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { useTheme, ICON_COLORS } from '../theme';
import { useData } from '../store';
import { ledger, peso, goalInfo, fmtDate } from '../calc';
import { Btn, Card, Divider, Empty, Field, Progress, Screen, Section, Txt, TxRow } from '../ui';

const Tile = ({ color }) => <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: color }} />;

function AccountCard({ a, bal, tx, onPress }) {
  const t = useTheme(); const i = goalInfo(a, bal, tx);
  return (
    <Card onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Tile color={a.color || ICON_COLORS[0]} />
        <View style={{ flex: 1 }}><Txt weight="600" size={15}>{a.name}</Txt><Txt size={12} color={t.sub}>{peso(bal)} of {peso(a.target)}</Txt></View>
        <Txt weight="700" color={t.green}>{Math.floor(i.pct)}%</Txt>
      </View>
      <Progress pct={i.pct} />
    </Card>
  );
}

export function MySavings({ navigation }) {
  const t = useTheme(); const { state } = useData();
  const { bal } = ledger(state.accounts, state.tx);
  const g = state.accounts.find((a) => a.general);
  const goals = state.accounts.filter((a) => !a.general && !a.archived);
  const arch = state.accounts.filter((a) => a.archived).length;
  const dep = state.tx.filter((x) => x.accountId === 'general' && x.type === 'save').reduce((s, x) => s + x.amount, 0);
  const wd = state.tx.filter((x) => x.accountId === 'general' && x.type === 'withdraw').reduce((s, x) => s + x.amount, 0);
  return (
    <Screen tab>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Txt size={20} weight="700">My Savings</Txt>
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate('GoalForm')} style={{ minHeight: 44, paddingHorizontal: 16, borderRadius: 14, backgroundColor: t.hero, justifyContent: 'center' }}><Txt size={13} weight="600" color={t.heroText}>+ New goal</Txt></Pressable>
      </View>
      <Pressable accessibilityRole="button" onPress={() => navigation.navigate('GoalDetail', { id: g.id })} style={{ backgroundColor: t.hero, borderRadius: 20, padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Tile color="#6EE7B7" /><View><Txt size={16} weight="700" color={t.heroText}>General Savings</Txt><Txt size={12} color={t.heroSub}>Main account · No target</Txt></View></View>
        <Txt size={30} weight="700" color={t.heroText} style={{ marginVertical: 10 }}>{peso(bal.general || 0)}</Txt>
        <View style={{ flexDirection: 'row', gap: 16 }}><Txt size={12} color={t.heroSub}>Deposits <Txt size={12} weight="700" color="#6EE7B7">{peso(dep)}</Txt></Txt><Txt size={12} color={t.heroSub}>Withdrawals <Txt size={12} weight="700" color="#FCA5A5">{peso(wd)}</Txt></Txt></View>
      </Pressable>
      <Section title="YOUR GOALS" />
      {goals.length === 0 && <Card><Empty text="No goals yet. Create one for a phone, a trip, or an emergency fund." /></Card>}
      {goals.map((a) => <AccountCard key={a.id} a={a} bal={bal[a.id] || 0} tx={state.tx} onPress={() => navigation.navigate('GoalDetail', { id: a.id })} />)}
      {arch > 0 && <Btn kind="ghost" title={`View archived goals (${arch})`} onPress={() => navigation.navigate('Archived')} />}
    </Screen>
  );
}

export function GoalDetail({ navigation, route }) {
  const t = useTheme(); const { state, setArchived } = useData();
  const a = state.accounts.find((x) => x.id === route.params.id);
  useLayoutEffect(() => { if (a) navigation.setOptions({ title: a.name }); }, [navigation, a]);
  if (!a) return <Screen><Empty text="This account no longer exists." /></Screen>;
  const { bal, after } = ledger(state.accounts, state.tx);
  const b = bal[a.id] || 0; const i = goalInfo(a, b, state.tx);
  const list = state.tx.filter((x) => x.accountId === a.id).sort((p, q) => (p.ts < q.ts ? 1 : -1));
  const dep = list.filter((x) => x.type === 'save').reduce((s, x) => s + x.amount, 0);
  const wd = list.filter((x) => x.type === 'withdraw').reduce((s, x) => s + x.amount, 0);
  const rawPct = a.target > 0 ? (b / a.target) * 100 : 0;
  const Stat = ({ l, v, c }) => <Card style={{ flex: 1, padding: 10 }}><Txt size={12} color={t.sub}>{l}</Txt><Txt weight="700" color={c}>{v}</Txt></Card>;
  const archive = () => Alert.alert(a.archived ? 'Restore goal?' : 'Archive goal?', a.archived ? 'It will show in My Savings again.' : 'It moves out of the way but keeps every transaction.', [
    { text: 'Cancel', style: 'cancel' }, { text: a.archived ? 'Restore' : 'Archive', onPress: () => { setArchived(a.id, !a.archived); navigation.goBack(); } },
  ]);
  return (
    <Screen>
      <Card>
        <Txt size={12} color={t.sub}>Current balance</Txt>
        <Txt size={32} weight="700">{peso(b)}</Txt>
        {a.target > 0 && <><Progress pct={i.pct} /><View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Txt size={13} weight="700" color={t.green}>{Math.floor(rawPct)}% complete{rawPct > 100 ? ' (over target)' : ''}</Txt><Txt size={13} color={t.sub}>Target {peso(a.target)}</Txt></View></>}
        {!!a.desc && <Txt size={13} color={t.sub} style={{ marginTop: 8 }}>{a.desc}</Txt>}
        <Txt size={12} color={t.sub} style={{ marginTop: 8 }}>Created {fmtDate(a.created)}{a.deadline ? ` · Target date ${a.deadline}` : ''}</Txt>
      </Card>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {a.target > 0 && <Stat l="Remaining" v={peso(i.remaining)} />}<Stat l="Deposits" v={peso(dep)} c={t.green} /><Stat l="Withdrawn" v={peso(wd)} c={t.red} />
      </View>
      {a.target > 0 && (
        <Card>
          <Txt weight="700">Savings plan</Txt>
          {i.plan && !i.plan.overdue && <Txt size={13} style={{ marginTop: 6 }}>To finish by {a.deadline}: <Txt weight="700">{peso(i.plan.daily)}</Txt>/day · <Txt weight="700">{peso(i.plan.weekly)}</Txt>/week · <Txt weight="700">{peso(i.plan.monthly)}</Txt>/month</Txt>}
          {i.plan && i.plan.overdue && <Txt size={13} color={t.red} style={{ marginTop: 6 }}>The target date has passed. Edit the goal to set a new one.</Txt>}
          {!a.deadline && i.remaining > 0 && <Txt size={13} color={t.sub} style={{ marginTop: 6 }}>Add a target date to get a daily, weekly and monthly amount.</Txt>}
          <Txt size={12} color={t.sub} style={{ marginTop: 6 }}>{i.remaining <= 0 ? 'Goal reached.' : i.eta ? `At your pace of the last 30 days: about ${fmtDate(i.eta.toISOString())}` : 'Save regularly to see an estimated finish date.'}</Txt>
        </Card>
      )}
      {a.target > 0 && (
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {[25, 50, 75, 100].map((m) => <View key={m} style={{ flex: 1, alignItems: 'center' }}><View style={{ height: 8, alignSelf: 'stretch', borderRadius: 4, backgroundColor: rawPct >= m ? t.green : t.outline, marginBottom: 4 }} /><Txt size={12} weight="600" color={rawPct >= m ? t.green : t.sub}>{m}%</Txt></View>)}
        </View>
      )}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Btn title="Save" style={{ flex: 1 }} onPress={() => navigation.navigate('TxForm', { type: 'save', accountId: a.id })} />
        <Btn title="Withdraw" kind="danger" style={{ flex: 1 }} onPress={() => navigation.navigate('TxForm', { type: 'withdraw', accountId: a.id })} />
      </View>
      <Section title="History" />
      <Card style={{ paddingVertical: 4 }}>
        {list.length === 0 ? <Empty text="No transactions in this account yet." /> : list.map((x, k) => <View key={x.id}>{k > 0 && <Divider />}<TxRow tx={x} acct={a} after={after[x.id]} onPress={() => navigation.navigate('TxDetail', { id: x.id })} /></View>)}
      </Card>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Btn kind="ghost" title="Edit" style={{ flex: 1 }} onPress={() => navigation.navigate('GoalForm', { id: a.id })} />
        {!a.general && <Btn kind="ghost" title={a.archived ? 'Restore' : 'Archive'} style={{ flex: 1 }} onPress={archive} />}
      </View>
    </Screen>
  );
}

export function GoalForm({ navigation, route }) {
  const t = useTheme(); const { state, addAccount, updateAccount } = useData();
  const a = route.params?.id ? state.accounts.find((x) => x.id === route.params.id) : null;
  useLayoutEffect(() => { navigation.setOptions({ title: a ? 'Edit ' + (a.general ? 'General Savings' : 'goal') : 'New savings goal' }); }, [navigation, a]);
  const [name, setName] = useState(a ? a.name : ''); const [target, setTarget] = useState(a && a.target ? String(a.target) : '');
  const [initial, setInitial] = useState(''); const [desc, setDesc] = useState(a ? a.desc || '' : '');
  const [date, setDate] = useState(a ? a.deadline || '' : ''); const [color, setColor] = useState(a ? a.color : ICON_COLORS[0]);
  const [err, setErr] = useState({});
  const num = (s) => (s.trim() === '' ? 0 : Number(s.replace(/,/g, '')));
  const submit = () => {
    const e = {};
    if (!name.trim()) e.name = 'Give your goal a name.';
    if (!(a && a.general) && !(num(target) > 0)) e.target = 'Enter a target amount above zero.';
    if (!a && (Number.isNaN(num(initial)) || num(initial) < 0)) e.initial = 'Enter a valid amount.';
    if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(date + 'T00:00:00').getTime()))) e.date = 'Use the format YYYY-MM-DD.';
    setErr(e); if (Object.keys(e).length) return;
    const data = { name: name.trim(), target: a && a.general ? 0 : num(target), desc: desc.trim(), deadline: date || null, color };
    if (a) updateAccount(a.id, a.general ? { desc: data.desc } : data);
    else addAccount({ ...data, initial: num(initial) });
    navigation.goBack();
  };
  const gen = a && a.general;
  return (
    <Screen>
      {!gen && <Field label="Goal name" value={name} onChangeText={setName} placeholder="e.g. New Phone" error={err.name} />}
      {!gen && (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="Target amount" value={target} onChangeText={setTarget} keyboardType="decimal-pad" placeholder="25000" error={err.target} /></View>
          {!a && <View style={{ flex: 1 }}><Field label="Starting amount" value={initial} onChangeText={setInitial} keyboardType="decimal-pad" placeholder="0" error={err.initial} /></View>}
        </View>
      )}
      {!gen && <Field label="Target date (optional)" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" autoCapitalize="none" error={err.date} />}
      <Field label="Why are you saving?" value={desc} onChangeText={setDesc} placeholder="Notes and purpose" multiline />
      {!gen && <><Txt size={13} weight="600" color={t.sub}>Icon color</Txt>
        <View style={{ flexDirection: 'row', gap: 12 }}>{ICON_COLORS.map((c) => <Pressable key={c} accessibilityRole="button" accessibilityLabel={'Color ' + c} onPress={() => setColor(c)} style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: t.text }} />)}</View></>}
      <Btn title={a ? 'Save changes' : 'Create goal'} onPress={submit} />
    </Screen>
  );
}

export function Archived({ navigation }) {
  const { state, setArchived } = useData();
  const { bal } = ledger(state.accounts, state.tx);
  const list = state.accounts.filter((a) => a.archived);
  return (
    <Screen>
      {list.length === 0 && <Empty text="No archived goals." />}
      {list.map((a) => (
        <View key={a.id} style={{ gap: 8 }}>
          <AccountCard a={a} bal={bal[a.id] || 0} tx={state.tx} onPress={() => navigation.navigate('GoalDetail', { id: a.id })} />
          <Btn kind="ghost" title="Restore" onPress={() => setArchived(a.id, false)} />
        </View>
      ))}
    </Screen>
  );
}
