import React, { useState } from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme';
import { useData } from '../store';
import { ledger, inRange, RANGES, totals, peso, goalInfo, buckets, growth, activity, fmtDate } from '../calc';
import { Card, Chip, Empty, Hscroll, Screen, Txt } from '../ui';
import { chartColors, HBars, Donut, Columns, Bars, Line } from '../charts';

const Block = ({ title, right, children }) => (
  <Card style={{ gap: 10 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Txt weight="700">{title}</Txt>{right}</View>
    {children}
  </Card>
);

export default function Analytics() {
  const t = useTheme(); const { state } = useData();
  const [range, setRange] = useState('30D'); const [mode, setMode] = useState('M');
  const [sd, setSd] = useState(null); const [sc, setSc] = useState(null); const [sl, setSl] = useState(null); const [sa, setSa] = useState(null);
  const cols = chartColors(t);
  const active = state.accounts.filter((a) => !a.archived);
  const { bal } = ledger(state.accounts, state.tx);
  const txr = state.tx.filter((x) => inRange(x, range));
  const { dep, wd } = totals(txr);
  const cats = active.map((a, i) => ({ id: a.id, label: a.name, value: bal[a.id] || 0, color: cols[i % cols.length] }));
  const pos = cats.filter((c) => c.value > 0); const posTotal = pos.reduce((s, c) => s + c.value, 0);
  const bk = buckets(state.tx, mode, mode === 'Y' ? 5 : mode === 'M' ? 6 : 8);
  const gr = growth(state.accounts, state.tx, range);
  const act = activity(state.tx, 14);
  const goals = active.filter((a) => !a.general && a.target > 0);
  const noData = state.tx.length === 0;
  const days = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
  const perDay = [0, 0, 0, 0, 0, 0, 0]; state.tx.filter((x) => x.type === 'save').forEach((x) => { perDay[new Date(x.ts).getDay()] += 1; });
  const best = perDay.indexOf(Math.max(...perDay));
  const savedDays = act.filter((d) => d.v > 0).length;
  const Sum = ({ l, v, c }) => <Card style={{ flex: 1, padding: 10 }}><Txt size={12} color={t.sub}>{l}</Txt><Txt weight="700" size={14} color={c}>{v}</Txt></Card>;
  return (
    <Screen tab>
      <Txt size={20} weight="700">Analytics</Txt>
      <Hscroll>{RANGES.map((r) => <Chip key={r} label={r} active={range === r} onPress={() => setRange(r)} />)}</Hscroll>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Sum l="Deposits" v={peso(dep)} c={t.green} /><Sum l="Withdrawals" v={peso(wd)} c={t.red} /><Sum l="Net savings" v={(dep - wd >= 0 ? '+' : '−') + peso(Math.abs(dep - wd))} />
      </View>
      <Txt size={11} color={t.sub}>Deposits are money you added to the tracker, not income.</Txt>
      {noData && <Card><Empty text="No data yet. Charts fill in as you record saves and withdrawals." /></Card>}

      <Block title="Savings growth">
        {noData ? <Empty text="Not enough data yet." /> : <>
          <Line pts={gr} selIdx={sl} onPick={setSl} />
          <Txt size={12} color={t.sub}>{sl != null ? `${fmtDate(new Date(gr[sl].t).toISOString())}: ${peso(gr[sl].v)}` : `From ${peso(gr[0].v)} to ${peso(gr[gr.length - 1].v)}. Tap the chart for a value.`}</Txt></>}
      </Block>

      <Block title="Deposits vs withdrawals" right={<View style={{ flexDirection: 'row', gap: 6 }}>{[['W', 'Weekly'], ['M', 'Monthly'], ['Y', 'Yearly']].map(([k, l]) => <Chip key={k} label={l} active={mode === k} onPress={() => { setMode(k); setSc(null); }} />)}</View>}>
        {noData ? <Empty text="Not enough data yet." /> : <>
          <Columns data={bk} sel={sc} onSelect={setSc} />
          <Txt size={12} color={t.sub}>{sc != null ? `${bk[sc].label}: saved ${peso(bk[sc].dep)}, withdrew ${peso(bk[sc].wd)}` : 'Green is saved, red is withdrawn. Tap a column for details.'}</Txt></>}
      </Block>

      <Block title="Savings by category">
        <HBars max={Math.max(1, ...cats.map((c) => c.value))} rows={cats.map((c) => ({ label: c.label, value: c.value, color: c.color, text: peso(c.value) }))} />
      </Block>

      <Block title="Distribution">
        {posTotal === 0 ? <Empty text="Save into an account to see the split." /> : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Donut data={pos} sel={sd} onSelect={setSd} />
            <View style={{ flex: 1, gap: 8 }}>
              {pos.map((c, i) => <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: c.color }} /><Txt size={12} style={{ flex: 1 }} weight={sd === i ? '700' : '400'} numberOfLines={1}>{c.label}</Txt><Txt size={12} weight="700">{Math.round((c.value / posTotal) * 100)}%</Txt></View>)}
              {sd != null && pos[sd] && <Txt size={12} color={t.sub}>{pos[sd].label}: {peso(pos[sd].value)}</Txt>}
            </View>
          </View>
        )}
      </Block>

      <Block title="Goal progress">
        {goals.length === 0 ? <Empty text="Create a goal with a target to track it here." /> : <HBars max={100} rows={goals.map((g) => {
          const i = goalInfo(g, bal[g.id] || 0, state.tx);
          const left = g.deadline ? Math.ceil((new Date(g.deadline + 'T23:59:59') - new Date()) / 86400000) : null;
          const status = i.pct >= 100 ? 'Completed' : left != null && left <= 30 ? 'Due soon' : 'Active';
          return { label: `${g.name} · ${status}`, value: i.pct, color: status === 'Completed' ? t.green : status === 'Due soon' ? t.red : cols[2], text: `${peso(bal[g.id] || 0)} / ${peso(g.target)}`, textColor: t.sub };
        })} />}
      </Block>

      <Block title="Saving activity (last 14 days)">
        {noData ? <Empty text="Not enough data yet." /> : <>
          <Bars data={act} sel={sa} onSelect={setSa} />
          <Txt size={12} color={t.sub}>{sa != null ? `Day ${act[sa].label}: ${peso(act[sa].v)} saved` : `You saved on ${savedDays} of the last 14 days.${Math.max(...perDay) > 0 ? ` Most deposits happen on ${days[best]}.` : ''}`}</Txt></>}
      </Block>
    </Screen>
  );
}
