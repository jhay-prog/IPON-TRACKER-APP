import React from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './theme';
import { peso, fmtDate, fmtTime } from './calc';

const P = {
  Home: 'M3 11l9-7 9 7v9H3z', Savings: 'M4 7h16v12H4zM4 7l3-3h10l3 3', Transactions: 'M4 6h16M4 12h16M4 18h10',
  Analytics: 'M5 20V10M12 20V4M19 20v-7', Settings: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v3M12 19v3',
  plus: 'M12 5v14M5 12h14', minus: 'M5 12h14', goal: 'M12 3l2.5 6 6.5.5-5 4.5 1.5 6.5-5.5-3.5L6.5 20.5 8 14 3 9.5 9.5 9z',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z', eyeoff: 'M3 3l18 18M2 12s4-7 10-7M22 12s-4 7-10 7',
  lock: 'M5 11h14v9H5zM8 11V8a4 4 0 018 0v3',
};
export const Icon = ({ name, size = 20, color }) => {
  const t = useTheme();
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || t.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d={P[name] || P.Home} /></Svg>;
};
export const Txt = ({ size = 14, weight = '400', color, style, children, ...p }) => {
  const t = useTheme();
  return <Text style={[{ fontSize: size, fontWeight: weight, color: color || t.text }, style]} {...p}>{children}</Text>;
};
export const Screen = ({ children, scroll = true, tab, style }) => {
  const t = useTheme(); const ins = useSafeAreaInsets();
  const pad = { padding: 20, paddingTop: tab ? ins.top + 12 : 20, gap: 12 };
  if (!scroll) return <View style={[{ flex: 1, backgroundColor: t.bg }, pad, style]}>{children}</View>;
  return <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={[pad, { paddingBottom: 40 }, style]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView>;
};
export const Card = ({ children, style, onPress }) => {
  const t = useTheme();
  const s = [{ backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 16, padding: 14 }, style];
  return onPress ? <Pressable accessibilityRole="button" onPress={onPress} style={s}>{children}</Pressable> : <View style={s}>{children}</View>;
};
export const Btn = ({ title, onPress, kind = 'primary', disabled, style }) => {
  const t = useTheme();
  const k = { primary: [t.btn, t.btnText], ghost: [t.card, t.text], danger: [t.card, t.red], light: [t.text, t.bg] }[kind];
  const bordered = kind === 'ghost' || kind === 'danger';
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
      style={[{ minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, backgroundColor: disabled ? t.elev : k[0], borderWidth: bordered ? 1 : 0, borderColor: kind === 'danger' ? t.red : t.outline }, style]}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: disabled ? t.sub : k[1] }}>{title}</Text>
    </Pressable>
  );
};
export const Field = ({ label, error, style, ...p }) => {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {!!label && <Txt size={13} weight="600" color={t.sub}>{label}</Txt>}
      <TextInput accessibilityLabel={label} placeholderTextColor={t.sub} {...p}
        style={[{ minHeight: 50, borderRadius: 12, borderWidth: 1, borderColor: error ? t.red : t.outline, backgroundColor: t.card, color: t.text, paddingHorizontal: 14, fontSize: 15 }, style]} />
      {!!error && <Txt size={12} color={t.red}>{error}</Txt>}
    </View>
  );
};
export const Chip = ({ label, active, onPress }) => {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress}
      style={{ paddingHorizontal: 14, minHeight: 40, borderRadius: 20, justifyContent: 'center', backgroundColor: active ? t.text : t.card, borderWidth: 1, borderColor: active ? t.text : t.outline }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: active ? t.bg : t.text }}>{label}</Text>
    </Pressable>
  );
};
export const Hscroll = ({ children }) => <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ flexGrow: 0 }}>{children}</ScrollView>;
export const Progress = ({ pct, color }) => {
  const t = useTheme();
  return <View style={{ height: 8, borderRadius: 4, backgroundColor: t.elev, marginVertical: 8 }}><View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: 8, borderRadius: 4, backgroundColor: color || t.green }} /></View>;
};
export const Empty = ({ text }) => { const t = useTheme(); return <View style={{ paddingVertical: 24, alignItems: 'center' }}><Txt color={t.sub} style={{ textAlign: 'center' }}>{text}</Txt></View>; };
export const Section = ({ title, right }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
    <Txt size={15} weight="700">{title}</Txt>{right}
  </View>
);
export const Divider = () => { const t = useTheme(); return <View style={{ height: 1, backgroundColor: t.border }} />; };
export function TxRow({ tx, acct, after, onPress }) {
  const t = useTheme(); const s = tx.type === 'save';
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 }}>
      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: (s ? t.green : t.red) + '22', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={s ? 'plus' : 'minus'} color={s ? t.green : t.red} size={18} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt weight="600" numberOfLines={1}>{tx.note || (s ? 'Saved' : 'Withdrew')}</Txt>
        <Txt size={12} color={t.sub} numberOfLines={1}>{acct ? acct.name : 'Account'} · {fmtDate(tx.ts)}, {fmtTime(tx.ts)}</Txt>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Txt weight="700" color={s ? t.green : t.red}>{s ? '+' : '−'}{peso(tx.amount)}</Txt>
        {after != null && <Txt size={11} color={t.sub}>Bal {peso(after)}</Txt>}
      </View>
    </Pressable>
  );
}
