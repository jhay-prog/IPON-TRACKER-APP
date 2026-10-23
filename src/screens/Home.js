import React, { useMemo, useState } from 'react';
import { View, Pressable, Image } from 'react-native';
import { useTheme } from '../theme';
import { useData } from '../store';
import { ledger, totals, peso, goalInfo } from '../calc';
import { Btn, Card, Empty, Icon, Progress, Screen, Section, Txt, TxRow, Divider } from '../ui';

const Quick = ({ icon, label, color, onPress }) => {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ flex: 1, minHeight: 70, borderRadius: 16, backgroundColor: t.card, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      <Icon name={icon} color={color} size={20} /><Txt size={12} weight="600">{label}</Txt>
    </Pressable>
  );
};

export default function Home({ navigation }) {
  const t = useTheme(); const { state } = useData(); const [hide, setHide] = useState(false);
  const { bal, after } = useMemo(() => ledger(state.accounts, state.tx), [state]);
  const total = Object.values(bal).reduce((a, b) => a + b, 0);
  const { dep, wd } = totals(state.tx);
  const now = new Date(); const m0 = new Date(now.getFullYear(), now.getMonth(), 1); const m1 = new Date(now.getFullYear(), now.getMonth() - 1, 1); const m2 = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const sum = (a, b) => state.tx.filter((x) => x.type === 'save' && new Date(x.ts) >= a && new Date(x.ts) < b).reduce((s, x) => s + x.amount, 0);
  const thisM = sum(m0, m2); const lastM = sum(m1, m0); const diff = thisM - lastM;
  const goals = state.accounts.filter((a) => !a.general && !a.archived);
  const recent = [...state.tx].sort((a, b) => (a.ts < b.ts ? 1 : -1)).slice(0, 5);
  const M = (v) => (hide ? '₱ ••••' : peso(v));
  const hr = now.getHours();
  return (
    <Screen tab>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Image source={require('../../assets/ipon-logo.png')} style={{ width: 44, height: 44, borderRadius: 12 }} accessibilityLabel="Ipon logo" />
        <View><Txt size={13} color={t.sub}>{hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening'}</Txt><Txt size={20} weight="700">Ipon</Txt></View>
      </View>
      <View style={{ backgroundColor: t.hero, borderRadius: 20, padding: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt size={13} color={t.heroSub}>Total Savings</Txt>
          <Pressable accessibilityRole="button" accessibilityLabel={hide ? 'Show balances' : 'Hide balances'} onPress={() => setHide(!hide)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', margin: -10 }}><Icon name={hide ? 'eyeoff' : 'eye'} color={t.heroText} /></Pressable>
        </View>
        <Txt size={34} weight="700" color={t.heroText} style={{ marginVertical: 4 }}>{M(total)}</Txt>
        <Txt size={12} color={t.heroSub}>General Savings <Txt size={12} weight="700" color={t.heroText}>{M(bal.general || 0)}</Txt></Txt>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
          <View style={{ flex: 1 }}><Txt size={12} color={t.heroSub}>Deposits</Txt><Txt weight="600" color="#6EE7B7">{M(dep)}</Txt></View>
          <View style={{ flex: 1 }}><Txt size={12} color={t.heroSub}>Withdrawals</Txt><Txt weight="600" color="#FCA5A5">{M(wd)}</Txt></View>
          <View style={{ flex: 1 }}><Txt size={12} color={t.heroSub}>This month</Txt><Txt weight="600" color={t.heroText}>{M(thisM)}</Txt></View>
        </View>
        {!hide && <Txt size={12} color={t.heroSub} style={{ marginTop: 8 }}>{diff >= 0 ? '+' : '−'}{peso(Math.abs(diff))} vs last month ({peso(lastM)})</Txt>}
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Quick icon="plus" label="Save" color={t.green} onPress={() => navigation.navigate('TxForm', { type: 'save' })} />
        <Quick icon="minus" label="Withdraw" color={t.red} onPress={() => navigation.navigate('TxForm', { type: 'withdraw' })} />
        <Quick icon="goal" label="New goal" color={t.text} onPress={() => navigation.navigate('GoalForm')} />
      </View>
      <Section title="Savings Goals" right={<Pressable accessibilityRole="button" onPress={() => navigation.navigate('Savings')}><Txt size={13} color={t.sub}>See all</Txt></Pressable>} />
      {goals.length === 0 ? <Card><Empty text="No goals yet. Tap New goal to set your first target." /></Card> : (
        <View style={{ gap: 10 }}>
          {goals.slice(0, 3).map((g) => { const i = goalInfo(g, bal[g.id] || 0, state.tx); return (
            <Card key={g.id} onPress={() => navigation.navigate('GoalDetail', { id: g.id })}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Txt weight="600">{g.name}</Txt><Txt weight="700" color={t.green}>{Math.floor(i.pct)}%</Txt></View>
              <Progress pct={i.pct} /><Txt size={12} color={t.sub}>{M(bal[g.id] || 0)} of {peso(g.target)}</Txt>
            </Card>); })}
        </View>
      )}
      <Section title="Recent" right={<Pressable accessibilityRole="button" onPress={() => navigation.navigate('Transactions')}><Txt size={13} color={t.sub}>View all</Txt></Pressable>} />
      <Card style={{ paddingVertical: 4 }}>
        {recent.length === 0 ? <Empty text="No transactions yet." /> : recent.map((x, i) => (
          <View key={x.id}>{i > 0 && <Divider />}<TxRow tx={x} acct={state.accounts.find((a) => a.id === x.accountId)} onPress={() => navigation.navigate('TxDetail', { id: x.id })} /></View>
        ))}
      </Card>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Btn kind="ghost" title="Calendar" style={{ flex: 1 }} onPress={() => navigation.navigate('Calendar')} />
        <Btn kind="ghost" title="Streaks & challenges" style={{ flex: 1 }} onPress={() => navigation.navigate('Challenges')} />
      </View>
    </Screen>
  );
}
