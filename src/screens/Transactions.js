import React, { useMemo, useState } from 'react';
import { View, FlatList, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { useData } from '../store';
import { ledger, inRange, RANGES, peso, fmtDate, fmtTime } from '../calc';
import { Btn, Card, Chip, Empty, Hscroll, Screen, Txt, TxRow, Divider } from '../ui';

const SORTS = [['new', 'Newest'], ['old', 'Oldest'], ['high', 'Highest'], ['low', 'Lowest']];

export default function Transactions({ navigation }) {
  const t = useTheme(); const ins = useSafeAreaInsets(); const { state } = useData();
  const [q, setQ] = useState(''); const [type, setType] = useState('all'); const [cat, setCat] = useState('all'); const [range, setRange] = useState('All'); const [sort, setSort] = useState('new');
  const { after } = useMemo(() => ledger(state.accounts, state.tx), [state]);
  const data = useMemo(() => {
    const s = q.trim().toLowerCase();
    const l = state.tx.filter((x) => {
      const a = state.accounts.find((y) => y.id === x.accountId);
      return (type === 'all' || x.type === type) && (cat === 'all' || x.accountId === cat) && inRange(x, range)
        && (!s || (x.note || '').toLowerCase().includes(s) || (x.tag || '').toLowerCase().includes(s) || (a ? a.name.toLowerCase().includes(s) : false));
    });
    const by = { new: (a, b) => (a.ts < b.ts ? 1 : -1), old: (a, b) => (a.ts < b.ts ? -1 : 1), high: (a, b) => b.amount - a.amount, low: (a, b) => a.amount - b.amount }[sort];
    return l.sort(by);
  }, [state, q, type, cat, range, sort]);
  const header = (
    <View style={{ gap: 10, paddingBottom: 10 }}>
      <Txt size={20} weight="700">Transactions</Txt>
      <TextInput accessibilityLabel="Search transactions" value={q} onChangeText={setQ} placeholder="Search description or category" placeholderTextColor={t.sub}
        style={{ minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: t.outline, backgroundColor: t.card, color: t.text, paddingHorizontal: 14 }} />
      <Hscroll>{[['all', 'All'], ['save', 'Save'], ['withdraw', 'Withdraw']].map(([k, l]) => <Chip key={k} label={l} active={type === k} onPress={() => setType(k)} />)}</Hscroll>
      <Hscroll><Chip label="All accounts" active={cat === 'all'} onPress={() => setCat('all')} />{state.accounts.map((a) => <Chip key={a.id} label={a.name} active={cat === a.id} onPress={() => setCat(a.id)} />)}</Hscroll>
      <Hscroll>{RANGES.map((r) => <Chip key={r} label={r} active={range === r} onPress={() => setRange(r)} />)}</Hscroll>
      <Hscroll>{SORTS.map(([k, l]) => <Chip key={k} label={l} active={sort === k} onPress={() => setSort(k)} />)}</Hscroll>
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <FlatList data={data} keyExtractor={(x) => x.id} ListHeaderComponent={header} keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingTop: ins.top + 12, paddingBottom: 40 }}
        ListEmptyComponent={<Empty text={state.tx.length ? 'No transactions match your filters.' : 'No transactions yet. Tap Save on the Home tab to add one.'} />}
        renderItem={({ item, index }) => (
          <View style={{ backgroundColor: t.card, paddingHorizontal: 14, borderLeftWidth: 1, borderRightWidth: 1, borderColor: t.border, borderTopWidth: index === 0 ? 1 : 0, borderBottomWidth: index === data.length - 1 ? 1 : 0, borderTopLeftRadius: index === 0 ? 16 : 0, borderTopRightRadius: index === 0 ? 16 : 0, borderBottomLeftRadius: index === data.length - 1 ? 16 : 0, borderBottomRightRadius: index === data.length - 1 ? 16 : 0 }}>
            {index > 0 && <Divider />}
            <TxRow tx={item} acct={state.accounts.find((a) => a.id === item.accountId)} after={after[item.id]} onPress={() => navigation.navigate('TxDetail', { id: item.id })} />
          </View>
        )} />
    </View>
  );
}

export function TxDetail({ navigation, route }) {
  const t = useTheme(); const { state, deleteTx } = useData();
  const x = state.tx.find((y) => y.id === route.params.id);
  if (!x) return <Screen><Empty text="This transaction no longer exists." /></Screen>;
  const a = state.accounts.find((y) => y.id === x.accountId); const s = x.type === 'save';
  const { after } = ledger(state.accounts, state.tx);
  const R = ({ l, v }) => <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}><Txt color={t.sub}>{l}</Txt><Txt weight="600" style={{ flexShrink: 1, textAlign: 'right' }}>{v}</Txt></View>;
  const del = () => Alert.alert('Delete transaction?', 'Balances, charts and history will be recalculated.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => { const e = deleteTx(x.id); if (e) Alert.alert('Cannot delete', e); else navigation.goBack(); } },
  ]);
  return (
    <Screen>
      <Card style={{ alignItems: 'center' }}>
        <Txt size={13} color={t.sub}>{s ? 'Saved' : 'Withdrawn'}</Txt>
        <Txt size={34} weight="700" color={s ? t.green : t.red}>{s ? '+' : '−'}{peso(x.amount)}</Txt>
      </Card>
      <Card>
        <R l="Account" v={a ? a.name : 'Unknown'} /><Divider /><R l="Date" v={fmtDate(x.ts)} /><Divider /><R l="Time" v={fmtTime(x.ts)} /><Divider />
        <R l="Note" v={x.note || 'None'} />{!!x.tag && <><Divider /><R l="Tag" v={x.tag} /></>}<Divider /><R l="Balance after" v={peso(after[x.id])} />
      </Card>
      <Btn title="Edit" kind="ghost" onPress={() => navigation.navigate('TxForm', { editId: x.id })} />
      <Btn title="Delete" kind="danger" onPress={del} />
    </Screen>
  );
}
