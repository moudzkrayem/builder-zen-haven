import React, { useMemo, useState } from "react";
import { getAnalytics, clearAnalytics } from "../lib/analytics";
import { getUsers, getRatings, User, Rating } from "../lib/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEvents } from "@/contexts/EventsContext";

function formatMs(ms: number | undefined) {
  if (!ms) return "0s";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem}s`;
}

function PieChart({ data, size = 160 }: { data: number[]; size?: number }) {
  const total = data.reduce((a, b) => a + b, 0) || 1;
  const colors = ["#4f46e5", "#06b6d4", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6"];
  let angle = -90;
  const radius = size / 2;
  const cx = size / 2;
  const cy = size / 2;

  const paths = data.map((value, i) => {
    const portion = value / total;
    const sweep = portion * 360;
    const startAngle = angle;
    const endAngle = angle + sweep;
    angle = endAngle;

    const large = sweep > 180 ? 1 : 0;
    const rad = (a: number) => (a * Math.PI) / 180;
    const x1 = cx + radius * Math.cos(rad(startAngle));
    const y1 = cy + radius * Math.sin(rad(startAngle));
    const x2 = cx + radius * Math.cos(rad(endAngle));
    const y2 = cy + radius * Math.sin(rad(endAngle));

    const d = [`M ${cx} ${cy}`, `L ${x1} ${y1}`, `A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`, "Z"].join(" ");
    return { d, color: colors[i % colors.length], value };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.color} stroke="#ffffff" strokeWidth={1} />
      ))}
    </svg>
  );
}

function BarChart({ labels, values, height = 120 }: { labels: string[]; values: number[]; height?: number }) {
  const max = Math.max(...values, 1);
  return (
    <div className="w-full">
      <div className="flex items-end space-x-2 h-32">
        {values.map((v, i) => (
          <div key={i} className="flex-1 text-center">
            <div
              title={`${labels[i]}: ${v}`}
              style={{ height: `${(v / max) * 100}%` }}
              className="bg-primary rounded-t transition-all"
            />
            <div className="text-xs mt-1 truncate">{labels[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const analytics = useMemo(() => getAnalytics(), []);
  const users = useMemo(() => getUsers(), []);
  const ratings = useMemo(() => getRatings(), []);

  // selection for visible fields
  const [showEmail, setShowEmail] = useState(true);
  const [showSocial, setShowSocial] = useState(true);
  const [showTime, setShowTime] = useState(true);
  const [showClicks, setShowClicks] = useState(true);
  const [minRatingFilter, setMinRatingFilter] = useState(0);

  // interactive controls
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"name" | "avgReceived" | "eventsJoined">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const totalUsers = users.length;
  const totalClicks = analytics.clicks.length;
  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b.rating, 0) / ratings.length).toFixed(2) : "-";

  // clicks by page for pie
  const clicksByPage = analytics.clicks.reduce<Record<string, number>>((acc, c) => {
    acc[c.page] = (acc[c.page] || 0) + 1;
    return acc;
  }, {});

  const pages = Object.keys(clicksByPage);
  const clicksValues = pages.map((p) => clicksByPage[p]);

  // ratings distribution for bar chart
  const ratingCounts = [0, 0, 0, 0, 0];
  ratings.forEach((r) => {
    const idx = Math.max(1, Math.min(5, Math.round(r.rating))) - 1;
    ratingCounts[idx]++;
  });

  // compute per-user aggregates
  const userAggregates = users.map((u) => {
    const userClicks = analytics.clicks.filter((c) => c.page.includes(u.id)).length; // heuristic
    const visits = analytics.pageVisits.filter((p) => p.path.includes(u.id));
    const timeSpent = visits.reduce((a, b) => a + (b.duration || 0), 0);
    const given = ratings.filter((r) => r.fromUserId === u.id);
    const received = ratings.filter((r) => r.toUserId === u.id);
    const avgGiven = given.length ? given.reduce((a, b) => a + b.rating, 0) / given.length : null;
    const avgReceived = received.length ? received.reduce((a, b) => a + b.rating, 0) / received.length : null;
    return { user: u, userClicks, timeSpent, given, received, avgGiven, avgReceived };
  });

  // filtered users by min rating
  const filtered = userAggregates.filter((ua) => {
    const receivedAvg = ua.avgReceived || 0;
    return receivedAvg >= minRatingFilter;
  }).filter(ua => ua.user.name.toLowerCase().includes(search.toLowerCase()));

  // sort
  const sorted = filtered.sort((a, b) => {
    let av: any = a.user.name;
    let bv: any = b.user.name;
    if (sortField === "avgReceived") {
      av = a.avgReceived || 0;
      bv = b.avgReceived || 0;
    } else if (sortField === "eventsJoined") {
      av = a.user.eventsJoined || 0;
      bv = b.user.eventsJoined || 0;
    }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  function exportCSV() {
    const rows = [
      ["id", "name", "email", "location", "signupDate", "lastActive", "eventsJoined", "messagesCount", "avgReceived", "avgGiven"],
      ...sorted.map((ua) => [
        ua.user.id,
        ua.user.name,
        ua.user.email || "",
        ua.user.location || "",
        ua.user.signupDate || "",
        ua.user.lastActive || "",
        String(ua.user.eventsJoined || 0),
        String(ua.user.messagesCount || 0),
        ua.avgReceived ? ua.avgReceived.toFixed(2) : "",
        ua.avgGiven ? ua.avgGiven.toFixed(2) : "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <img src="/placeholder.svg" alt="logo" className="w-10 h-10" />
          <div>
            <h1 className="text-2xl font-bold">Trybe Admin</h1>
            <div className="text-sm text-muted-foreground">Analytics & user management</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" onClick={() => { clearAnalytics(); window.location.reload(); }}>Clear Analytics</Button>
          <Button onClick={() => window.location.reload()}>Refresh</Button>
          <Button variant="outline" onClick={exportCSV}>Export CSV</Button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-primary/5 border rounded">
          <div className="text-sm text-muted-foreground">Total Users</div>
          <div className="text-2xl font-semibold">{totalUsers}</div>
        </div>
        <div className="p-4 bg-primary/5 border rounded">
          <div className="text-sm text-muted-foreground">Total Clicks</div>
          <div className="text-2xl font-semibold">{totalClicks}</div>
        </div>
        <div className="p-4 bg-primary/5 border rounded">
          <div className="text-sm text-muted-foreground">Avg Rating</div>
          <div className="text-2xl font-semibold">{avgRating}</div>
        </div>
        <div className="p-4 bg-primary/5 border rounded">
          <div className="text-sm text-muted-foreground">Total Ratings</div>
          <div className="text-2xl font-semibold">{ratings.length}</div>
        </div>
      </section>

      <section className="mb-6 p-4 border rounded bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 w-full">
            <Input placeholder="Search users by name" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="rounded border px-2 py-1" value={sortField} onChange={(e) => setSortField(e.target.value as any)}>
              <option value="name">Sort: Name</option>
              <option value="avgReceived">Sort: Avg Received</option>
              <option value="eventsJoined">Sort: Events Joined</option>
            </select>
            <select className="rounded border px-2 py-1" value={sortDir} onChange={(e) => setSortDir(e.target.value as any)}>
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Field Selection</h3>
            <label className="flex items-center space-x-2 mb-2"><input type="checkbox" checked={showEmail} onChange={(e) => setShowEmail(e.target.checked)} /> <span>Email</span></label>
            <label className="flex items-center space-x-2 mb-2"><input type="checkbox" checked={showSocial} onChange={(e) => setShowSocial(e.target.checked)} /> <span>Social Links</span></label>
            <label className="flex items-center space-x-2 mb-2"><input type="checkbox" checked={showTime} onChange={(e) => setShowTime(e.target.checked)} /> <span>Time Spent</span></label>
            <label className="flex items-center space-x-2 mb-2"><input type="checkbox" checked={showClicks} onChange={(e) => setShowClicks(e.target.checked)} /> <span>Click Count</span></label>

            <div className="mt-4">
              <label className="text-sm">Min Received Rating Filter: <strong>{minRatingFilter}</strong></label>
              <input className="w-full" type="range" min={0} max={5} value={minRatingFilter} onChange={(e) => setMinRatingFilter(Number(e.target.value))} />
            </div>
          </div>

          <div className="p-4 border rounded col-span-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Clicks by Page</h3>
              <div className="text-sm text-muted-foreground">Top pages and distribution</div>
            </div>
            <div className="flex items-center space-x-4">
              <div>
                <PieChart data={clicksValues.length ? clicksValues : [1]} size={160} />
              </div>
              <div className="flex-1">
                {pages.length === 0 && <div className="text-sm text-muted-foreground">No click data</div>}
                {pages.map((p, i) => (
                  <div key={p} className="flex items-center justify-between mb-1">
                    <div className="truncate">{p}</div>
                    <div className="font-mono">{clicksByPage[p]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 border rounded">
          <h3 className="font-semibold mb-2">Ratings Distribution</h3>
          <BarChart labels={["1","2","3","4","5"]} values={ratingCounts} />
        </div>

        <div className="p-4 border rounded">
          <h3 className="font-semibold mb-2">Recent Ratings</h3>
          <div className="space-y-2 max-h-48 overflow-auto">
            {ratings.slice().reverse().map((r) => (
              <div key={r.id} className="p-2 border rounded">
                <div className="text-sm"><strong>{r.rating}★</strong> — {r.comment}</div>
                <div className="text-xs text-muted-foreground">From: {getUsers().find(u=>u.id===r.fromUserId)?.name || r.fromUserId} {r.toUserId ? `to ${getUsers().find(u=>u.id===r.toUserId)?.name}` : r.eventId ? `for event ${r.eventId}` : ''}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Users</h3>
        <div className="overflow-auto border rounded">
          <table className="min-w-full table-auto">
            <thead className="bg-muted p-2">
              <tr>
                <th className="p-2 text-left">Name</th>
                {showEmail && <th className="p-2 text-left">Email</th>}
                {showSocial && <th className="p-2 text-left">Social</th>}
                {showTime && <th className="p-2 text-left">Time Spent</th>}
                {showClicks && <th className="p-2 text-left">Clicks</th>}
                <th className="p-2 text-left">Avg Received</th>
                <th className="p-2 text-left">Avg Given</th>
                <th className="p-2 text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((ua) => (
                <tr key={ua.user.id} className="border-t">
                  <td className="p-2">{ua.user.name}</td>
                  {showEmail && <td className="p-2">{ua.user.email || '-'}</td>}
                  {showSocial && <td className="p-2">{ua.user.social ? Object.values(ua.user.social).filter(Boolean).join(' | ') : '-'}</td>}
                  {showTime && <td className="p-2">{formatMs(ua.timeSpent)}</td>}
                  {showClicks && <td className="p-2">{ua.userClicks}</td>}
                  <td className="p-2">{ua.avgReceived ? ua.avgReceived.toFixed(2) : '-'}</td>
                  <td className="p-2">{ua.avgGiven ? ua.avgGiven.toFixed(2) : '-'}</td>
                  <td className="p-2">
                    <details>
                      <summary className="cursor-pointer">View</summary>
                      <div className="mt-2">
                        <div className="text-sm font-semibold">Ratings Given</div>
                        {ua.given.length === 0 && <div className="text-sm text-muted-foreground">None</div>}
                        {ua.given.map((g: Rating) => (
                          <div key={g.id} className="text-sm">{g.rating}★ — {g.comment} <span className="text-xs text-muted-foreground">{g.eventId ? `event ${g.eventId}` : g.toUserId ? `to ${g.toUserId}` : ''}</span></div>
                        ))}

                        <div className="mt-2 text-sm font-semibold">Ratings Received</div>
                        {ua.received.length === 0 && <div className="text-sm text-muted-foreground">None</div>}
                        {ua.received.map((g: Rating) => (
                          <div key={g.id} className="text-sm">{g.rating}★ — {g.comment} <span className="text-xs text-muted-foreground">from {g.fromUserId}</span></div>
                        ))}
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
