import React, { useState } from 'react';
import { View, TextInput, Alert } from 'react-native';
import { useTheme } from '../theme';
import { useData } from '../store';
import { ledger, peso, fmtDate, fmtTime } from '../calc';
import { Btn, Card, Chip, Field, Hscroll, Screen, Txt } from '../ui';

const TAGS = ['Allowance', 'Salary', 'Bonus', 'Gift', 'Other'];

export default function TxForm({ navigation, route }) {
  const t = useTheme(); const { state, addTx, updateTx } = useData();
  const { type: pType, accountId, editId } = route.params || {};
  const editing = editId ? state.tx.find((x) => x.id === editId) : null;
  const type = editing ? editing.type : pType; const isSave = type === 'save';
  const accounts = state.accounts.filter((a) => !a.archived || (editing && a.id === editing.accountId));
  const [acc, setAcc] = useState(editing ? editing.accountId : accountId || 'general');
  const [amt, setAmt] = useState(editing ? String(editing.amount) : '');
  const [note, setNote] = useState(editing ? editing.note || '' : '');
  const [tag, setTag] = useState(editing ? editing.tag || '' : '');
  const [err, setErr] = useState('');
  const { bal } = ledger(state.accounts, state.tx);
  const value = parseFloat(amt);
  const onAmt = (v) => { const c = v.replace(/[^0-9.]/g, ''); if (/^\d*\.?\d{0,2}$/.test(c)) { setAmt(c); setErr(''); } };
  const cur = bal[acc] || 0;
  const preview = value > 0 ? cur + (isSave ? value : -value) : cur;
  const when = editing ? editing.ts : new Date().toISOString();

  const submit = () => {
    if (!(value > 0)) return setErr('Enter an amount greater than zero.');
    if (editing) {
      const e = updateTx(editing.id, { accountId: acc, amount: value, note: note.trim(), tag });
      return e ? setErr(e) : navigation.goBack();
    }
    if (!isSave && value > cur + 1e-9) return setErr(`Amount is more than the available balance of ${peso(cur)}.`);
    const a = state.accounts.find((x) => x.id === acc);
    const before = a.target > 0 ? (cur / a.target) * 100 : 0;
    const e = addTx({ type, accountId: acc, amount: value, note: note.trim(), tag });
    if (e) return setErr(e);
    const afterPct = a.target > 0 ? ((cur + (isSave ? value : -value)) / a.target) * 100 : 0;
    navigation.goBack();
    const hit = isSave ? [100, 75, 50, 25].find((m) => before < m && afterPct >= m) : null;
    if (hit) Alert.alert(hit === 100 ? 'Goal completed!' : `${hit}% reached`, hit === 100 ? `You reached your target for ${a.name}. Well done!` : `Nice work. ${a.name} is now ${hit}% funded.`);
  };

  return (
    <Screen>
      <Txt size={13} weight="600" color={t.sub}>{isSave ? 'Savings account' : 'Withdraw from'}</Txt>
      <Hscroll>{accounts.map((a) => <Chip key={a.id} label={`${a.name} · ${peso(bal[a.id] || 0)}`} active={acc === a.id} onPress={() => { setAcc(a.id); setErr(''); }} />)}</Hscroll>
      <Card style={{ alignItems: 'center', borderWidth: 2, borderColor: err ? t.red : isSave ? t.green : t.outline }}>
        <Txt size={12} color={t.sub}>Amount (type any amount)</Txt>
        <TextInput accessibilityLabel="Amount" value={amt} onChangeText={onAmt} keyboardType="decimal-pad" placeholder="₱0.00" placeholderTextColor={t.sub} autoFocus
          style={{ fontSize: 38, fontWeight: '700', color: isSave ? t.green : t.red, textAlign: 'center', minWidth: 200, paddingVertical: 4 }} />
        <Txt size={12} color={t.sub}>Any value works, like ₱101 or ₱103.50</Txt>
      </Card>
      {!!err && <Txt size={13} weight="600" color={t.red}>{err}</Txt>}
      {isSave && !editing && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Txt size={12} color={t.sub}>Quick fill:</Txt>
          {[50, 100, 200, 500, 1000].map((q) => <Chip key={q} label={peso(q).replace('.00', '')} onPress={() => onAmt(String(q))} />)}
        </View>
      )}
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}><Txt size={13} weight="600">Date and time</Txt><Txt size={12} color={t.sub}>{editing ? 'Recorded when you saved it' : 'Recorded automatically when you confirm'}</Txt></View>
          <Txt size={13} weight="700" style={{ textAlign: 'right' }}>{fmtDate(when)}{'\n'}{fmtTime(when)}</Txt>
        </View>
      </Card>
      <Field label={isSave ? 'Note (optional)' : 'Reason (optional)'} value={note} onChangeText={setNote} placeholder={isSave ? 'e.g. Weekly allowance' : 'e.g. Phone repair'} />
      {isSave && <Hscroll>{TAGS.map((x) => <Chip key={x} label={x} active={tag === x} onPress={() => setTag(tag === x ? '' : x)} />)}</Hscroll>}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Txt color={t.sub}>New balance</Txt><Txt weight="700">{peso(preview)}</Txt></View>
      <Btn title={editing ? 'Save changes' : isSave ? 'Confirm Save' : 'Confirm Withdrawal'} onPress={submit} kind={isSave || editing ? 'primary' : 'danger'} />
    </Screen>
  );
}
