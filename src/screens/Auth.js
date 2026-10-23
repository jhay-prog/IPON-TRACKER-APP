import React, { useState } from 'react';
import { View, Image, ScrollView, ActivityIndicator, Pressable, Alert } from 'react-native';
import { useTheme } from '../theme';
import { Btn, Field, Txt } from '../ui';
import { createPassword, verifyPassword, resetWithRecovery } from '../security';

const Shell = ({ title, sub, children }) => {
  const t = useTheme();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 28, paddingTop: 90, gap: 14, alignItems: 'stretch' }} keyboardShouldPersistTaps="handled">
      <View style={{ alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Image source={require('../../assets/ipon-logo.png')} style={{ width: 100, height: 100, borderRadius: 24 }} accessibilityLabel="Ipon logo" />
        <Txt size={15} weight="700" color={t.green} style={{ letterSpacing: 3 }}>IPON</Txt>
        <Txt size={26} weight="700">{title}</Txt>
        <Txt color={t.sub} style={{ textAlign: 'center' }}>{sub}</Txt>
      </View>
      {children}
      <Txt size={12} color={t.sub} style={{ textAlign: 'center', marginTop: 16 }}>Tracking only. This app never holds or moves real money.</Txt>
    </ScrollView>
  );
};

export function Setup({ onDone }) {
  const t = useTheme();
  const [p1, setP1] = useState(''); const [p2, setP2] = useState(''); const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false); const [code, setCode] = useState(null);
  const submit = async () => {
    if (p1.length < 8) return setErr('Use at least 8 characters.');
    if (p1 !== p2) return setErr('Passwords do not match.');
    setBusy(true); setErr('');
    try { setCode(await createPassword(p1)); } catch (e) { setErr('Could not save your password on this device.'); } finally { setBusy(false); }
  };
  if (code) {
    return (
      <Shell title="Save your recovery code" sub="If you forget your password, this code lets you set a new one without losing your savings. It is shown only once.">
        <View style={{ padding: 20, borderRadius: 16, backgroundColor: t.card, borderWidth: 1, borderColor: t.outline, alignItems: 'center' }}>
          <Txt size={26} weight="700" selectable style={{ letterSpacing: 2 }}>{code}</Txt>
        </View>
        <Btn title="I have written it down" onPress={onDone} />
      </Shell>
    );
  }
  return (
    <Shell title="Create your password" sub="This protects your savings records. It is stored only as a salted hash.">
      <Field label="Password" secureTextEntry value={p1} onChangeText={setP1} autoCapitalize="none" />
      <Field label="Confirm password" secureTextEntry value={p2} onChangeText={setP2} autoCapitalize="none" error={err} />
      <Btn title={busy ? 'Creating…' : 'Create password'} disabled={busy} onPress={submit} />
      {busy && <ActivityIndicator color={t.text} />}
    </Shell>
  );
}

export function Lock({ onUnlock, onErase }) {
  const t = useTheme();
  const [mode, setMode] = useState('pw');
  const [pw, setPw] = useState(''); const [code, setCode] = useState(''); const [np, setNp] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const run = async (fn) => { setBusy(true); setErr(''); try { await fn(); } finally { setBusy(false); } };
  const unlock = () => run(async () => { (await verifyPassword(pw)) ? onUnlock() : setErr('Incorrect password.'); });
  const recover = () => run(async () => {
    if (np.length < 8) return setErr('New password needs at least 8 characters.');
    (await resetWithRecovery(code, np)) ? onUnlock() : setErr('That recovery code is not correct.');
  });
  const erase = () => Alert.alert('Erase everything?', 'This deletes all savings, goals and transactions on this device and removes the password. It cannot be undone.', [
    { text: 'Cancel', style: 'cancel' }, { text: 'Erase all', style: 'destructive', onPress: onErase },
  ]);
  if (mode === 'recover') {
    return (
      <Shell title="Reset password" sub="Enter your recovery code and choose a new password. Your savings stay hidden until you unlock.">
        <Field label="Recovery code" value={code} onChangeText={setCode} autoCapitalize="characters" autoCorrect={false} />
        <Field label="New password" secureTextEntry value={np} onChangeText={setNp} autoCapitalize="none" error={err} />
        <Btn title={busy ? 'Checking…' : 'Reset and unlock'} disabled={busy} onPress={recover} />
        <Btn title="Back" kind="ghost" onPress={() => { setMode('pw'); setErr(''); }} />
        <Pressable accessibilityRole="button" onPress={erase} style={{ minHeight: 44, justifyContent: 'center' }}><Txt color={t.red} style={{ textAlign: 'center' }}>No recovery code? Erase all data and start over</Txt></Pressable>
      </Shell>
    );
  }
  return (
    <Shell title="Welcome back" sub="Enter your password to view your savings.">
      <Field label="Password" secureTextEntry value={pw} onChangeText={setPw} autoCapitalize="none" error={err} onSubmitEditing={unlock} />
      <Btn title={busy ? 'Unlocking…' : 'Unlock'} disabled={busy || !pw} onPress={unlock} />
      <Pressable accessibilityRole="button" onPress={() => { setMode('recover'); setErr(''); }} style={{ minHeight: 44, justifyContent: 'center' }}><Txt color={t.sub} style={{ textAlign: 'center' }}>Forgot password?</Txt></Pressable>
    </Shell>
  );
}
