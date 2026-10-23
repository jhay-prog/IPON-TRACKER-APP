import React, { useContext, useState } from 'react';
import { View, Switch, Pressable, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../theme';
import { useData, LockCtx } from '../store';
import { ledger, fmtDate, fmtTime } from '../calc';
import { changePassword, wipeAuth } from '../security';
import { Btn, Card, Divider, Field, Screen, Section, Txt } from '../ui';

const Row = ({ label, value, onPress, right }) => {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="button" disabled={!onPress} onPress={onPress} style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Txt weight="500">{label}</Txt>{right || <Txt size={13} color={t.sub}>{value}</Txt>}
    </Pressable>
  );
};

export default function Settings({ navigation }) {
  const t = useTheme(); const { state, setSettings, replaceAll, wipeAll } = useData(); const lock = useContext(LockCtx);
  const csvEscape = (s) => '"' + String(s ?? '').replace(/"/g, '""') + '"';
  const share = async (name, body, mime) => {
    const uri = FileSystem.cacheDirectory + name;
    await FileSystem.writeAsStringAsync(uri, body, { encoding: FileSystem.EncodingType.UTF8 });
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: mime, dialogTitle: name });
    else Alert.alert('Saved', 'File saved to ' + uri);
  };
  const exportCsv = async () => {
    const { after } = ledger(state.accounts, state.tx);
    const rows = [...state.tx].sort((a, b) => (a.ts < b.ts ? -1 : 1)).map((x) => [fmtDate(x.ts), fmtTime(x.ts), x.type === 'save' ? 'Save' : 'Withdraw', state.accounts.find((a) => a.id === x.accountId)?.name, x.amount.toFixed(2), x.note, x.tag, (after[x.id] ?? 0).toFixed(2)].map(csvEscape).join(','));
    await share('ipon-transactions.csv', ['Date,Time,Type,Account,Amount,Note,Tag,Balance after', ...rows].join('\n'), 'text/csv');
  };
  const backup = () => Alert.alert('Back up records', 'The backup file is not encrypted. Keep it somewhere private.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Continue', onPress: () => share(`ipon-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ app: 'ipon', version: 1, ...state, reminders: [] }), 'application/json') },
  ]);
  const restore = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
    if (r.canceled) return;
    try {
      const d = JSON.parse(await FileSystem.readAsStringAsync(r.assets[0].uri));
      if (d.app !== 'ipon' || !Array.isArray(d.accounts) || !Array.isArray(d.tx)) throw new Error('bad');
      Alert.alert('Restore backup?', `This replaces everything in the app with ${d.tx.length} transactions from the file.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restore', style: 'destructive', onPress: () => { const e = replaceAll(d); Alert.alert(e ? 'Could not restore' : 'Restored', e || 'Your records were restored.'); } },
      ]);
    } catch (e) { Alert.alert('Not a valid backup', 'Choose a backup file created by Ipon.'); }
  };
  const erase = () => Alert.alert('Erase all data?', 'This deletes every account, goal and transaction on this device. It cannot be undone.', [
    { text: 'Cancel', style: 'cancel' }, { text: 'Erase all', style: 'destructive', onPress: async () => { await wipeAll(); Alert.alert('Done', 'All savings data was erased. Your password is unchanged.'); } },
  ]);
  const Group = ({ title, children }) => <><Section title={title} /><Card style={{ paddingVertical: 0 }}>{children}</Card></>;
  return (
    <Screen tab>
      <Txt size={20} weight="700">Settings</Txt>
      <Group title="SECURITY">
        <Row label="Change password" onPress={() => navigation.navigate('ChangePassword')} /><Divider />
        <Row label="Lock app now" onPress={lock} />
      </Group>
      <Group title="APPEARANCE">
        <Row label="Dark mode" right={<Switch value={state.settings.dark !== false} onValueChange={(v) => setSettings({ dark: v })} accessibilityLabel="Dark mode" />} /><Divider />
        <Row label="Currency" value="₱ Philippine peso" />
      </Group>
      <Group title="REMINDERS"><Row label="Saving reminders" value={`${state.reminders.length} set`} onPress={() => navigation.navigate('Reminders')} /></Group>
      <Group title="MORE">
        <Row label="Calendar" onPress={() => navigation.navigate('Calendar')} /><Divider />
        <Row label="Streaks and challenges" onPress={() => navigation.navigate('Challenges')} /><Divider />
        <Row label="Archived goals" onPress={() => navigation.navigate('Archived')} />
      </Group>
      <Group title="DATA">
        <Row label="Export transactions (CSV)" onPress={exportCsv} /><Divider />
        <Row label="Back up records" onPress={backup} /><Divider />
        <Row label="Restore from backup" onPress={restore} />
      </Group>
      <Btn kind="danger" title="Erase all savings data" onPress={erase} />
      <Txt size={12} color={t.sub} style={{ textAlign: 'center' }}>Ipon only tracks savings you enter. It never holds or moves real money.</Txt>
    </Screen>
  );
}

export function ChangePassword({ navigation }) {
  const [cur, setCur] = useState(''); const [n1, setN1] = useState(''); const [n2, setN2] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const go = async () => {
    if (n1.length < 8) return setErr('New password needs at least 8 characters.');
    if (n1 !== n2) return setErr('New passwords do not match.');
    setBusy(true); setErr('');
    const ok = await changePassword(cur, n1); setBusy(false);
    if (!ok) return setErr('Current password is incorrect.');
    Alert.alert('Password changed', 'Use your new password next time you unlock.'); navigation.goBack();
  };
  return (
    <Screen>
      <Field label="Current password" secureTextEntry value={cur} onChangeText={setCur} autoCapitalize="none" />
      <Field label="New password" secureTextEntry value={n1} onChangeText={setN1} autoCapitalize="none" />
      <Field label="Confirm new password" secureTextEntry value={n2} onChangeText={setN2} autoCapitalize="none" error={err} />
      <Btn title={busy ? 'Changing…' : 'Change password'} disabled={busy} onPress={go} />
    </Screen>
  );
}
