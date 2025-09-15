import React, { useMemo, useState } from "react";
import { getAnalytics, clearAnalytics } from "../lib/analytics";

function formatMs(ms: number | undefined) {
  if (!ms) return "0s";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem}s`;
}

export default function AdminDashboard() {
  const [tick, setTick] = useState(0);
  const analytics = useMemo(() => getAnalytics(), [tick]);

  const totalClicks = analytics.clicks.length;

  const clicksByPage = analytics.clicks.reduce<Record<string, number>>((acc, c) => {
    acc[c.page] = (acc[c.page] || 0) + 1;
    return acc;
  }, {});

  const timeByPage = analytics.pageVisits.reduce<Record<string, number>>((acc, v) => {
    const dur = v.duration || (v.leave && v.enter ? v.leave - v.enter : 0) || 0;
    acc[v.path] = (acc[v.path] || 0) + dur;
    return acc;
  }, {});

  const topPages = Object.keys(timeByPage).sort((a, b) => (timeByPage[b] || 0) - (timeByPage[a] || 0)).slice(0, 10);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 border rounded">Total Clicks<br/><span className="text-xl font-semibold">{totalClicks}</span></div>
        <div className="p-4 border rounded">Tracked Pages<br/><br/><span className="text-xl font-semibold">{Object.keys(timeByPage).length}</span></div>
        <div className="p-4 border rounded">Logs<br/><br/><span className="text-xl font-semibold">{analytics.logs.length}</span></div>
      </div>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Time Spent by Page</h2>
        <div className="space-y-2">
          {topPages.length === 0 && <div className="text-sm text-muted-foreground">No page visit data yet.</div>}
          {topPages.map((p) => (
            <div key={p} className="flex justify-between items-center p-2 border rounded">
              <div className="truncate">{p}</div>
              <div className="font-mono">{formatMs(timeByPage[p])}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Clicks by Page</h2>
        <div className="space-y-2">
          {Object.keys(clicksByPage).length === 0 && <div className="text-sm text-muted-foreground">No click data yet.</div>}
          {Object.entries(clicksByPage)
            .sort((a, b) => b[1] - a[1])
            .map(([p, count]) => (
              <div key={p} className="flex justify-between items-center p-2 border rounded">
                <div className="truncate">{p}</div>
                <div className="font-mono">{count}</div>
              </div>
            ))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Recent Clicks (last 100)</h2>
        <div className="grid grid-cols-1 gap-2">
          {analytics.clicks.slice().reverse().slice(0, 100).map((c, i) => (
            <div key={i} className="p-2 border rounded text-sm flex justify-between">
              <div className="truncate">{c.tag}</div>
              <div className="font-mono">{new Date(c.timestamp).toLocaleString()} <span className="ml-2">{c.page}</span></div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Recent Logs</h2>
        <div className="space-y-2">
          {analytics.logs.length === 0 && <div className="text-sm text-muted-foreground">No logs yet.</div>}
          {analytics.logs.slice().reverse().slice(0, 100).map((l, i) => (
            <div key={i} className="p-2 border rounded text-sm font-mono">{l}</div>
          ))}
        </div>
      </section>

      <div className="flex space-x-2">
        <button
          onClick={() => {
            clearAnalytics();
            setTick((t) => t + 1);
          }}
          className="px-3 py-2 rounded bg-red-600 text-white"
        >
          Clear Analytics
        </button>
        <button
          onClick={() => setTick((t) => t + 1)}
          className="px-3 py-2 rounded bg-primary text-white"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
