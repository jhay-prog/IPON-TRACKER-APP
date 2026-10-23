import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from './theme';
import { Txt } from './ui';

export const chartColors = (t) => (t.mode === 'dark'
  ? ['#E7EEF5', '#34D399', '#5D6F82', '#FCD34D', '#C4B5FD', '#93C5FD', '#FDBA74', '#F9A8D4']
  : ['#0B1F3A', '#047857', '#64748B', '#B45309', '#6D28D9', '#1D4ED8', '#C2410C', '#BE185D']);

export const HBars = ({ rows, max }) => {
  const t = useTheme();
  return (
    <View style={{ gap: 12 }}>
      {rows.map((r, i) => (
        <View key={i}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            <Txt size={13} weight="600" style={{ flex: 1 }} numberOfLines={1}>{r.label}</Txt>
            <Txt size={13} color={r.textColor || t.sub}>{r.text}</Txt>
          </View>
          <View style={{ height: 10, borderRadius: 5, backgroundColor: t.elev, marginTop: 4 }}>
            <View style={{ width: `${Math.max(2, Math.min(100, (r.value / (max || 1)) * 100))}%`, height: 10, borderRadius: 5, backgroundColor: r.color }} />
          </View>
        </View>
      ))}
    </View>
  );
};

export function Donut({ data, sel, onSelect }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const R = 40; const C = 2 * Math.PI * R; let off = 0;
  return (
    <Svg width={150} height={150} viewBox="0 0 100 100" accessibilityLabel="Savings distribution donut chart">
      {data.map((d, i) => {
        const len = total ? (d.value / total) * C : 0;
        const el = <Circle key={i} cx="50" cy="50" r={R} fill="none" stroke={d.color} strokeWidth={sel === i ? 20 : 16} strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} transform="rotate(-90 50 50)" onPress={() => onSelect(i)} />;
        off += len; return el;
      })}
    </Svg>
  );
}

export const Columns = ({ data, sel, onSelect }) => {
  const t = useTheme();
  const max = Math.max(1, ...data.map((d) => Math.max(d.dep, d.wd))); const H = 110;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
      {data.map((d, i) => (
        <Pressable key={i} accessibilityRole="button" onPress={() => onSelect(i)} style={{ flex: 1, alignItems: 'center', opacity: sel == null || sel === i ? 1 : 0.5 }}>
          <View style={{ height: H, flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
            <View style={{ width: 10, height: Math.max(2, (d.dep / max) * H), backgroundColor: t.green, borderRadius: 3 }} />
            <View style={{ width: 10, height: Math.max(2, (d.wd / max) * H), backgroundColor: t.red, borderRadius: 3 }} />
          </View>
          <Txt size={10} color={t.sub} style={{ marginTop: 4 }}>{d.label}</Txt>
        </Pressable>
      ))}
    </View>
  );
};

export const Bars = ({ data, sel, onSelect }) => {
  const t = useTheme();
  const max = Math.max(1, ...data.map((d) => d.v)); const H = 90;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
      {data.map((d, i) => (
        <Pressable key={i} accessibilityRole="button" onPress={() => onSelect(i)} style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ width: '70%', height: Math.max(2, (d.v / max) * H), backgroundColor: sel === i ? t.text : t.green, borderRadius: 3, opacity: d.v ? 1 : 0.3 }} />
          <Txt size={9} color={t.sub} style={{ marginTop: 4 }}>{d.label}</Txt>
        </Pressable>
      ))}
    </View>
  );
};

export function Line({ pts, height = 120, selIdx, onPick }) {
  const t = useTheme(); const [w, setW] = useState(300);
  const xs = pts.map((p) => p.t); const vs = pts.map((p) => p.v);
  const x0 = Math.min(...xs); const x1 = Math.max(...xs); const v0 = Math.min(...vs); const v1 = Math.max(...vs);
  const X = (x) => (x1 === x0 ? 0 : ((x - x0) / (x1 - x0)) * (w - 8) + 4);
  const Y = (v) => (v1 === v0 ? height / 2 : height - 8 - ((v - v0) / (v1 - v0)) * (height - 16));
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.t).toFixed(1)} ${Y(p.v).toFixed(1)}`).join(' ');
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <Pressable accessibilityLabel="Savings growth line chart" onPress={(e) => {
        const lx = e.nativeEvent.locationX; let b = 0; let bd = 1e12;
        pts.forEach((p, i) => { const dd = Math.abs(X(p.t) - lx); if (dd < bd) { bd = dd; b = i; } });
        onPick(b);
      }}>
        <Svg width={w} height={height}>
          <Path d={`${d} L${X(x1)} ${height} L${X(x0)} ${height}Z`} fill={t.green + '22'} />
          <Path d={d} stroke={t.green} strokeWidth={3} fill="none" />
          {selIdx != null && pts[selIdx] && <Circle cx={X(pts[selIdx].t)} cy={Y(pts[selIdx].v)} r={5} fill={t.green} />}
        </Svg>
      </Pressable>
    </View>
  );
}
