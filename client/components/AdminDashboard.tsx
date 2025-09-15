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
  const staticRatings = useMemo(() => getRatings(), []);
  const { userRatings: ctxUserRatings, hostRatings: ctxHostRatings } = useEvents();

  // merge event ratings from static + context
  const eventRatings = [...staticRatings.filter(r => typeof r.eventId !== 'undefined'), ...ctxUserRatings.map(r => ({ id: `ctx-${r.eventId}-${r.rating}`, fromUserId: 'current', eventId: r.eventId, rating: r.rating, createdAt: new Date().toISOString() }))];

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

  const ctxUserRatingsMapped = ctxUserRatings.map(r=>({ id: `ctx-${r.eventId}-${r.rating}`, fromUserId: 'current', toUserId: undefined, eventId: r.eventId, rating: r.rating, comment: undefined, createdAt: new Date().toISOString() }));

  const allRatings = [...staticRatings, ...ctxUserRatingsMapped];

  const avgEventRating = eventRatings.length ? (eventRatings.reduce((a,b)=>a+b.rating,0)/eventRatings.length) : null;
  const avgEventRatingStr = avgEventRating ? avgEventRating.toFixed(2) : "-";

  const avgHostRating = ctxHostRatings.length ? (ctxHostRatings.reduce((a,b)=>a+b.rating,0)/ctxHostRatings.length) : null;
  const avgHostRatingStr = avgHostRating ? avgHostRating.toFixed(2) : "-";

  // clicks by page for pie
  const clicksByPage = analytics.clicks.reduce<Record<string, number>>((acc, c) => {
    acc[c.page] = (acc[c.page] || 0) + 1;
    return acc;
  }, {});

  const pages = Object.keys(clicksByPage);
  const clicksValues = pages.map((p) => clicksByPage[p]);

  // ratings distribution for bar chart (use eventRatings)
  const ratingCounts = [0, 0, 0, 0, 0];
  eventRatings.forEach((r) => {
    const idx = Math.max(1, Math.min(5, Math.round(r.rating))) - 1;
    ratingCounts[idx]++;
  });

  // compute per-user aggregates
  const userAggregates = users.map((u) => {
    const userClicks = analytics.clicks.filter((c) => c.page.includes(u.id)).length; // heuristic
    const visits = analytics.pageVisits.filter((p) => p.path.includes(u.id));
    const timeSpent = visits.reduce((a, b) => a + (b.duration || 0), 0);
    const given = allRatings.filter((r) => r.fromUserId === u.id);
    const received = allRatings.filter((r) => r.toUserId === u.id);
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
    <div className="min-h-screen bg-gradient-to-br from-white to-primary/5 p-6">
      <div className="max-w-[1300px] mx-auto bg-white rounded-2xl shadow-xl overflow-hidden flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gradient-to-b from-primary/5 to-white border-r border-border p-6">
          <div className="flex items-center mb-6">
            <img src="https://cdn.builder.io/api/v1/image/assets%2F5c6becf7cef04a3db5d3620ce9b103bd%2F7160f5ce4d0f451fbbc6983b119c4dd6?format=webp&width=800" alt="brand" className="w-10 h-10 mr-3" />
            <div>
              <div className="text-lg font-bold">Trybe</div>
              <div className="text-xs text-muted-foreground">Admin Studio</div>
            </div>
          </div>

          <nav className="space-y-2">
            <button className="w-full text-left px-3 py-2 rounded-md bg-primary text-white font-semibold">Overview</button>
            <button className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50">Users</button>
            <button className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50">Events</button>
            <button className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50">Analytics</button>
            <button className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50">Settings</button>
          </nav>

          <div className="mt-8 text-xs text-muted-foreground">
            <div className="font-semibold">Today</div>
            <div className="mt-2">Active users: <strong>{totalUsers}</strong></div>
            <div>Clicks: <strong>{totalClicks}</strong></div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          <header className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">Overview</h2>
              <div className="text-sm text-muted-foreground">Insights & metrics</div>
            </div>

            <div className="flex items-center space-x-2">
              <Input placeholder="Search users, events..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <Button variant="ghost" onClick={() => { clearAnalytics(); window.location.reload(); }}>Clear</Button>
              <Button onClick={() => window.location.reload()}>Refresh</Button>
              <Button variant="outline" onClick={exportCSV}>Export</Button>
            </div>
          </header>

          {/* Top cards */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-white border rounded-xl shadow-sm">
              <div className="text-sm text-muted-foreground">Users</div>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <div className="text-xs text-success mt-1">Last 30 days • +3.2%</div>
            </div>

            <div className="p-4 bg-white border rounded-xl shadow-sm">
              <div className="text-sm text-muted-foreground">Subscriptions</div>
              <div className="text-2xl font-bold">360</div>
              <div className="text-xs text-destructive mt-1">Last 30 days • -1.2%</div>
            </div>

            <div className="p-4 bg-white border rounded-xl shadow-sm">
              <div className="text-sm text-muted-foreground">Generated Images</div>
              <div className="text-2xl font-bold">43,583</div>
              <div className="text-xs text-success mt-1">Last 30 days • +2.6%</div>
            </div>

            <div className="p-4 bg-white border rounded-xl shadow-sm">
              <div className="text-sm text-muted-foreground">Generated Codes</div>
              <div className="text-2xl font-bold">34,385</div>
              <div className="text-xs text-success mt-1">Last 30 days • +3.2%</div>
            </div>
          </section>

          {/* Charts area */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="lg:col-span-2 p-4 bg-white border rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Total New Users</h3>
                <div className="text-sm text-muted-foreground">6 months</div>
              </div>
              <div className="h-56 flex items-center justify-center">
                {/* Placeholder chart area */}
                <div className="w-full h-full flex items-center justify-center">[Line chart placeholder]</div>
              </div>
            </div>

            <div className="p-4 bg-white border rounded-xl shadow-sm">
              <h3 className="font-semibold mb-2">Total New Users</h3>
              <div className="h-56 flex items-center justify-center">[Bar chart placeholder]</div>
            </div>
          </section>

          {/* Lists */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 bg-white border rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Latest Registrations</h4>
                <div className="text-sm text-muted-foreground">Last 7 days</div>
              </div>
              <div className="space-y-2">
                {users.slice(0,5).map(u => (
                  <div key={u.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.signupDate?.split('T')[0]}</div>
                    </div>
                    <div>
                      <Button variant="link">View</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-white border rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Latest Transactions</h4>
                <div className="text-sm text-muted-foreground">Last Month</div>
              </div>
              <div className="space-y-2">
                {users.slice(0,5).map(u => (
                  <div key={u.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-muted-foreground">Package Starter • $11.99</div>
                    </div>
                    <div className="text-sm text-success">Active</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Users table */}
          <section className="mt-6 bg-white border rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Users</h4>
              <div className="text-sm text-muted-foreground">{sorted.length} results</div>
            </div>

            <div className="overflow-auto">
              <table className="min-w-full table-auto">
                <thead className="text-xs text-muted-foreground">
                  <tr>
                    <th className="p-2 text-left">Name</th>
                    {showEmail && <th className="p-2 text-left">Email</th>}
                    {showSocial && <th className="p-2 text-left">Social</th>}
                    {showTime && <th className="p-2 text-left">Time Spent</th>}
                    {showClicks && <th className="p-2 text-left">Clicks</th>}
                    <th className="p-2 text-left">Avg Recv</th>
                    <th className="p-2 text-left">Avg Given</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(u => (
                    <tr key={u.user.id} className="border-t">
                      <td className="p-2">{u.user.name}</td>
                      {showEmail && <td className="p-2">{u.user.email || '-'}</td>}
                      {showSocial && <td className="p-2">{u.user.social ? Object.values(u.user.social).filter(Boolean).join(' | ') : '-'}</td>}
                      {showTime && <td className="p-2">{formatMs(u.timeSpent)}</td>}
                      {showClicks && <td className="p-2">{u.userClicks}</td>}
                      <td className="p-2">{u.avgReceived ? u.avgReceived.toFixed(2) : '-'}</td>
                      <td className="p-2">{u.avgGiven ? u.avgGiven.toFixed(2) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
