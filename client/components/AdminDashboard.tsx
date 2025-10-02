import React, { useEffect, useMemo, useState } from "react";
import { getAnalytics, clearAnalytics } from "../lib/analytics";
import { getUsers, getRatings, User, Rating } from "../lib/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEvents } from "@/contexts/EventsContext";
import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon } from "lucide-react";

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
  const colors = ["#6D28D9", "#7C3AED", "#8B5CF6", "#06B6D4", "#10B981"];
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

function BarChart({ labels, values }: { labels: string[]; values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="w-full">
      <div className="flex items-end space-x-2 h-32">
        {values.map((v, i) => (
          <div key={i} className="flex-1 text-center">
            <div
              title={`${labels[i]}: ${v}`}
              style={{ height: `${(v / max) * 100}%` }}
              className="bg-gradient-to-b from-primary to-purple-600 rounded-t transition-all"
            />
            <div className="text-xs mt-1 truncate">{labels[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function extractUserIdFromPath(path: string) {
  // try common patterns like /profile/:id or ?user= or /u/:id
  const m1 = path.match(/\/profile\/(\w[-\w]*)/i);
  if (m1) return m1[1];
  const m2 = path.match(/[?&]user=([^&]+)/i);
  if (m2) return m2[1];
  const m3 = path.match(/\/u\/(\w[-\w]*)/i);
  if (m3) return m3[1];
  return path; // fallback to path string
}

export default function AdminDashboard() {
  const [analyticsState, setAnalyticsState] = useState(() => getAnalytics());
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (!e.key || e.key === "trybe_analytics_v1") {
        setAnalyticsState(getAnalytics());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const analytics = analyticsState;
  const users = useMemo(() => getUsers(), []);
  const staticRatings = useMemo(() => getRatings(), []);
  const { userRatings: ctxUserRatings, hostRatings: ctxHostRatings, events, isEventFinished, updateEvent } = useEvents();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'events' | 'analytics' | 'settings'>('overview');

  const eventRatings = [...staticRatings.filter(r => typeof r.eventId !== 'undefined'), ...ctxUserRatings.map(r => ({ id: `ctx-${r.eventId}-${r.rating}`, fromUserId: 'current', toUserId: undefined, eventId: r.eventId, rating: r.rating, comment: undefined, createdAt: new Date().toISOString() }))];

  const allRatings = [...staticRatings.filter(r => typeof r.eventId === 'undefined'), ...eventRatings];

  const [showEmail, setShowEmail] = useState(true);
  const [showSocial, setShowSocial] = useState(true);
  const [showTime, setShowTime] = useState(true);
  const [showClicks, setShowClicks] = useState(true);
  const [minRatingFilter, setMinRatingFilter] = useState(0);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"name" | "avgReceived" | "eventsJoined">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const now = Date.now();
  const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;
  const newUsers = users.filter(u => u.signupDate && now - new Date(u.signupDate).getTime() <= THIRTY_DAYS);
  const returningUsers = users.filter(u => !u.signupDate || now - new Date(u.signupDate).getTime() > THIRTY_DAYS);

  const totalTrybes = events.length;
  const activeTrybes = events.filter(e => !isEventFinished(e.id)).length;
  const finishedTrybes = events.filter(e => isEventFinished(e.id)).length;

  const transactions = useMemo(() => {
    return users.map((u, i) => ({
      id: `tx-${i}`,
      userId: u.id,
      name: u.name,
      package: i % 2 === 0 ? "Trybe Premium" : "Trybe Starter",
      price: i % 2 === 0 ? 19.99 : 11.99,
      status: i % 2 === 0 ? "Active" : "Expired",
      date: u.signupDate || new Date().toISOString(),
    }));
  }, [users]);

  const clicksByPage = analytics.clicks.reduce<Record<string, number>>((acc, c) => {
    acc[c.page] = (acc[c.page] || 0) + 1;
    return acc;
  }, {});
  const pages = Object.keys(clicksByPage);
  const clicksValues = pages.map(p => clicksByPage[p]);

  const ratingCounts = [0, 0, 0, 0, 0];
  eventRatings.forEach((r) => {
    const idx = Math.max(1, Math.min(5, Math.round(r.rating))) - 1;
    ratingCounts[idx]++;
  });

  const userAggregates = users.map((u) => {
    const userClicks = analytics.clicks.filter((c) => c.page.includes(u.id)).length;
    const visits = analytics.pageVisits.filter((p) => p.path.includes(u.id));
    const timeSpent = visits.reduce((a, b) => a + (b.duration || 0), 0);
    const given = allRatings.filter((r: any) => r.fromUserId === u.id);
    const received = allRatings.filter((r: any) => r.toUserId === u.id);
    const avgGiven = given.length ? given.reduce((a, b) => a + b.rating, 0) / given.length : null;
    const avgReceived = received.length ? received.reduce((a, b) => a + b.rating, 0) / received.length : null;
    return { user: u, userClicks, timeSpent, given, received, avgGiven, avgReceived };
  });

  const filtered = userAggregates.filter((ua) => {
    const receivedAvg = ua.avgReceived || 0;
    return receivedAvg >= minRatingFilter;
  }).filter(ua => ua.user.name.toLowerCase().includes(search.toLowerCase()));

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

  const [vqMetric, setVqMetric] = useState<string>("users");
  const [vqRange, setVqRange] = useState<string>("30d");
  const [vqResult, setVqResult] = useState<string | null>(null);

  function runVisualQuery() {
    if (vqMetric === "users") {
      setVqResult(`Users: total ${users.length}, new ${newUsers.length}, returning ${returningUsers.length}`);
    } else if (vqMetric === "clicks") {
      setVqResult(`Total clicks: ${analytics.clicks.length}`);
    } else if (vqMetric === "ratings") {
      setVqResult(`Total ratings: ${eventRatings.length + ctxHostRatings.length}`);
    } else {
      setVqResult("No data");
    }
  }

  const [cmdLog, setCmdLog] = useState<string[]>([]);
  function runCommand(cmd: string) {
    setCmdLog(prev => [`${new Date().toISOString()} - ${cmd}`, ...prev].slice(0, 50));
    if (cmd === "clear-analytics") {
      clearAnalytics();
      window.location.reload();
    }
    if (cmd === "export-csv") {
      const rows = [
        ["id", "name", "email", "location", "signupDate"],
        ...users.map(u => [u.id, u.name, u.email || "", u.location || "", u.signupDate || ""]),
      ];
      const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users_export_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  function ThemeToggle() {
    const { setTheme, isDark } = useTheme();
    const toggle = () => setTheme(isDark ? "light" : "dark");
    return (
      <button onClick={toggle} className="p-2 rounded-md bg-transparent hover:bg-accent/10">
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    );
  }

  function exportCSVType(type: "users" | "events" | "transactions" | "ratings") {
    if (type === "users") {
      const rows = [
        ["id", "name", "email", "location", "signupDate", "lastActive"],
        ...users.map(u => [u.id, u.name, u.email || "", u.location || "", u.signupDate || "", u.lastActive || ""]),
      ];
      const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users_export_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (type === "events") {
      const rows = [
        ["id", "name", "location", "date", "isPopular", "isFinished"],
        ...events.map(e => [e.id, e.eventName || e.name || "", e.location || "", e.date || "", String(!!e.isPopular), String(isEventFinished(e.id))]),
      ];
      const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `events_export_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (type === "transactions") {
      const rows = [
        ["id", "userId", "name", "package", "price", "status", "date"],
        ...transactions.map(t => [t.id, t.userId, t.name, t.package, String(t.price), t.status, t.date]),
      ];
      const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions_export_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (type === "ratings") {
      const rows = [
        ["id", "fromUserId", "toUserId", "eventId", "rating", "comment", "createdAt"],
        ...allRatings.map((r: any) => [r.id || "", r.fromUserId || "", r.toUserId || "", r.eventId || "", String(r.rating || ""), r.comment || "", r.createdAt || ""]),
      ];
      const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ratings_export_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
  }

  // Analytics helpers
  function hourlyHeatmap() {
    const hours = new Array(24).fill(0);
    analytics.pageVisits.forEach(v => {
      const t = v.enter || 0;
      const d = new Date(t);
      const h = d.getHours();
      hours[h] = (hours[h] || 0) + 1;
    });
    return hours;
  }

  function activeCountsByPeriod(days = 1) {
    const cut = Date.now() - days * 24 * 60 * 60 * 1000;
    const visits = analytics.pageVisits.filter(v => (v.enter || 0) >= cut);
    const uniqueSet = new Set<string>();
    visits.forEach(v => uniqueSet.add(extractUserIdFromPath(v.path)));
    return uniqueSet.size;
  }

  function dau() {
    return activeCountsByPeriod(1);
  }
  function wau() {
    return activeCountsByPeriod(7);
  }
  function mau() {
    return activeCountsByPeriod(30);
  }

  function retention30() {
    // simple retention: percent of users who signed up >30 days ago that have recent activity in last 30 days
    const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const activeIds = new Set(analytics.pageVisits.filter(v => (v.enter || 0) >= since).map(v => extractUserIdFromPath(v.path)));
    const cohort = users.filter(u => u.signupDate && new Date(u.signupDate).getTime() >= since).map(u => u.id);
    if (cohort.length === 0) return null;
    const retained = cohort.filter(id => activeIds.has(id)).length;
    return Math.round((retained / cohort.length) * 100);
  }

  function revenueSummary() {
    const total = transactions.reduce((a, b) => a + (b.price || 0), 0);
    const byPackage: Record<string, number> = {};
    transactions.forEach(t => { byPackage[t.package] = (byPackage[t.package] || 0) + (t.price || 0); });
    return { total, byPackage };
  }

  const heat = hourlyHeatmap();
  const dauCount = dau();
  const wauCount = wau();
  const mauCount = mau();
  const retention = retention30();
  const revenue = revenueSummary();

  const topRated = userAggregates.slice().filter(u => u.avgReceived).sort((a, b) => (b.avgReceived || 0) - (a.avgReceived || 0)).slice(0, 5);
  const mostActivePages = pages.slice().sort((a, b) => (clicksByPage[b] || 0) - (clicksByPage[a] || 0)).slice(0, 5);
  const usersWithSocial = users.filter(u => u.social && Object.values(u.social).some(Boolean));

  return (
    <div style={{ backgroundColor: "rgb(24, 24, 27)", fontWeight: 400, minHeight: "805px", padding: "24px" }}>
      <div style={{ display: "flex", backgroundColor: "rgb(29, 29, 32)", borderRadius: "32px", boxShadow: "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 20px 25px -5px, rgba(0, 0, 0, 0.1) 0px 8px 10px -6px", fontWeight: 400, maxWidth: "1400px", overflowX: "hidden", overflowY: "hidden", margin: "0 auto" }}>
        <aside style={{ borderColor: "rgb(39, 39, 42)", borderRightWidth: "1px", fontWeight: 400, width: "256px", padding: "24px" }}>
          <div className="flex items-center mb-6">
            <img src="https://cdn.builder.io/api/v1/image/assets%2F5c6becf7cef04a3db5d3620ce9b103bd%2F7160f5ce4d0f451fbbc6983b119c4dd6?format=webp&width=800" alt="brand" style={{ display: "block", fontWeight: 400, height: "40px", marginRight: "12px", width: "40px" }} />
            <div>
              <div className="text-lg font-bold text-primary">Trybe</div>
              <div className="text-xs text-muted-foreground">Admin Studio</div>
            </div>
          </div>

          <nav className="space-y-2">
            <button onClick={() => setActiveTab('overview')} className={`w-full text-left px-3 py-2 rounded-md ${activeTab === 'overview' ? 'bg-primary text-white font-semibold' : 'hover:bg-accent/10'}`}>Overview</button>
            <button onClick={() => setActiveTab('users')} className={`w-full text-left px-3 py-2 rounded-md ${activeTab === 'users' ? 'bg-primary text-white font-semibold' : 'hover:bg-accent/10'}`}>Users</button>
            <button onClick={() => setActiveTab('events')} className={`w-full text-left px-3 py-2 rounded-md ${activeTab === 'events' ? 'bg-primary text-white font-semibold' : 'hover:bg-accent/10'}`}>Events</button>
            <button onClick={() => setActiveTab('analytics')} className={`w-full text-left px-3 py-2 rounded-md ${activeTab === 'analytics' ? 'bg-primary text-white font-semibold' : 'hover:bg-accent/10'}`}>Analytics</button>
            <button onClick={() => setActiveTab('settings')} className={`w-full text-left px-3 py-2 rounded-md ${activeTab === 'settings' ? 'bg-primary text-white font-semibold' : 'hover:bg-accent/10'}`}>Settings</button>
          </nav>

          <div className="mt-8 text-xs text-muted-foreground">
            <div className="font-semibold">Today</div>
            <div className="mt-2">Active users: <strong>{dauCount}</strong></div>
            <div>Clicks: <strong>{analytics.clicks.length}</strong></div>
          </div>
        </aside>

        <main className="flex-1 p-6">
          <header className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">{activeTab === 'overview' ? 'Overview' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
              <div className="text-sm text-muted-foreground">{activeTab === 'overview' ? 'Insights & metrics' : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} management`}</div>
            </div>

            <div className="flex items-center space-x-2">
              <Input placeholder="Search users, events..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <Button variant="ghost" onClick={() => { runCommand('clear-analytics'); }}>Clear</Button>
              <Button onClick={() => window.location.reload()}>Refresh</Button>
              <Button variant="outline" onClick={() => exportCSVType('users')}>Export Users</Button>

              <ThemeToggle />
            </div>
          </header>

          <section style={{ display: activeTab === 'overview' ? undefined : 'none' }} className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <div className="p-4 bg-card  border rounded-xl shadow-sm  col-span-1">
              <div className="text-sm text-muted-foreground">Total Users</div>
              <div className="text-2xl font-bold">{users.length}</div>
              <div className="text-xs text-muted-foreground">New: {newUsers.length} • Returning: {returningUsers.length}</div>
            </div>

            <div className="p-4 bg-card  border rounded-xl shadow-sm  col-span-1">
              <div className="text-sm text-muted-foreground">Trybe Created</div>
              <div className="text-2xl font-bold">{totalTrybes}</div>
              <div className="text-xs text-green-500">Active: {activeTrybes} • Finished: {finishedTrybes}</div>
            </div>

            <div className="p-4 bg-card  border rounded-xl shadow-sm  col-span-1">
              <div className="text-sm text-muted-foreground">Avg Event Rating</div>
              <div className="text-2xl font-bold">{eventRatings.length ? (eventRatings.reduce((a,b)=>a+b.rating,0)/eventRatings.length).toFixed(2) : '-'}</div>
              <div className="text-xs text-muted-foreground">Host Avg: {ctxHostRatings.length ? (ctxHostRatings.reduce((a,b)=>a+b.rating,0)/ctxHostRatings.length).toFixed(2) : '-'}</div>
            </div>

            <div className="p-4 bg-card  border rounded-xl shadow-sm  col-span-1">
              <div className="text-sm text-muted-foreground">Total Ratings</div>
              <div className="text-2xl font-bold">{eventRatings.length + ctxHostRatings.length}</div>
              <div className="text-xs text-muted-foreground">Last 30 days</div>
            </div>

            <div className="p-4 bg-card  border rounded-xl shadow-sm  col-span-1">
              <div className="text-sm text-muted-foreground">Latest Transactions</div>
              <div className="text-2xl font-bold">{transactions.filter(t => t.package.includes('Premium')).length}</div>
              <div className="text-xs text-muted-foreground">Trybe Premium</div>
            </div>

            <div className="p-4 bg-card  border rounded-xl shadow-sm  col-span-1">
              <div className="text-sm text-muted-foreground">Click Events</div>
              <div className="text-2xl font-bold">{analytics.clicks.length}</div>
              <div className="text-xs text-muted-foreground">Tracking history length: {analytics.pageVisits.length}</div>
            </div>
          </section>

          <section style={{ display: activeTab === 'overview' ? undefined : 'none' }} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="lg:col-span-2 p-4 bg-card  border rounded-xl shadow-sm ">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Total New Users</h3>
                <div className="text-sm text-muted-foreground">6 months</div>
              </div>
              <div className="h-56 flex items-center justify-center">
                <div className="w-full h-full flex items-center justify-center">[Line chart placeholder]</div>
              </div>
            </div>

            <div className="p-4 bg-card  border rounded-xl shadow-sm ">
              <h3 className="font-semibold mb-2">Visual Query</h3>
              <div className="space-y-2">
                <select className="w-full rounded border px-2 py-1" value={vqMetric} onChange={(e) => setVqMetric(e.target.value)}>
                  <option value="users">Users</option>
                  <option value="clicks">Clicks</option>
                  <option value="ratings">Ratings</option>
                </select>
                <select className="w-full rounded border px-2 py-1" value={vqRange} onChange={(e) => setVqRange(e.target.value)}>
                  <option value="7d">7 days</option>
                  <option value="30d">30 days</option>
                  <option value="90d">90 days</option>
                </select>
                <Button onClick={runVisualQuery}>Run</Button>
                {vqResult && <div className="mt-2 p-2 bg-muted bg-muted rounded">{vqResult}</div>}
              </div>
            </div>
          </section>

          <section style={{ display: activeTab === 'overview' ? undefined : 'none' }} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-card  border rounded-xl shadow-sm  lg:col-span-1">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Latest Registrations</h4>
                <div className="text-sm text-muted-foreground">Last 7 days</div>
              </div>
              <div className="space-y-2">
                {users.slice().sort((a, b) => (b.signupDate ? new Date(b.signupDate).getTime() : 0) - (a.signupDate ? new Date(a.signupDate).getTime() : 0)).slice(0, 5).map(u => (
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

            <div className="p-4 bg-card  border rounded-xl shadow-sm  lg:col-span-1">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Latest Transactions</h4>
                <div className="text-sm text-muted-foreground">Last Month</div>
              </div>
              <div className="space-y-2">
                {transactions.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.package} • ${t.price}</div>
                    </div>
                    <div className={`text-sm ${t.status === 'Active' ? 'text-green-500' : 'text-destructive'}`}>{t.status}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-card  border rounded-xl shadow-sm  lg:col-span-1">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Trybe Events</h4>
                <div className="text-sm text-muted-foreground">Active / Finished</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">Total: {totalTrybes}</div>
                <div className="text-xs text-muted-foreground">Active: {activeTrybes}</div>
                <div className="text-xs text-muted-foreground">Finished: {finishedTrybes}</div>
              </div>
            </div>
          </section>

          <section style={{ display: activeTab === 'overview' ? undefined : 'none' }} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-card  border rounded-xl shadow-sm  lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Data Tracking History</h4>
                <div className="text-sm text-muted-foreground">Recent activity</div>
              </div>
              <div className="max-h-56 overflow-auto">
                {analytics.pageVisits.slice().reverse().map((v, i) => (
                  <div key={i} className="p-2 border-b">
                    <div className="font-medium">{v.path}</div>
                    <div className="text-xs text-muted-foreground">Entered: {new Date(v.enter).toLocaleString()} • Duration: {v.duration ? Math.round(v.duration / 1000) + 's' : '—'}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-card  border rounded-xl shadow-sm ">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Command Center</h4>
                <div className="text-sm text-muted-foreground">Run admin commands</div>
              </div>

              <div className="space-y-2">
                <Button onClick={() => runCommand('clear-analytics')}>Clear Analytics</Button>
                <Button onClick={() => runCommand('export-csv')}>Export Users CSV</Button>
                <Button variant="ghost" onClick={() => runCommand('reindex-search')}>Reindex Search</Button>

                <div className="mt-3 text-xs text-muted-foreground">Command Log</div>
                <div className="max-h-40 overflow-auto bg-muted bg-muted p-2 rounded">
                  {cmdLog.length === 0 && <div className="text-xs text-muted-foreground">No commands run yet</div>}
                  {cmdLog.map((l, idx) => <div key={idx} className="text-xs">{l}</div>)}
                </div>
              </div>
            </div>
          </section>

          <section style={{ display: (activeTab === 'overview' || activeTab === 'users') ? undefined : 'none' }} className="mt-6 bg-card  border rounded-xl p-4 shadow-sm ">
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

            <div className="mt-4 flex items-center space-x-2">
              <Button onClick={() => exportCSVType('users')}>Export users CSV</Button>
              <Button variant="outline" onClick={() => exportCSVType('ratings')}>Export ratings</Button>
              <div className="ml-auto text-xs text-muted-foreground">Columns: <label className="ml-2"><input type="checkbox" checked={showEmail} onChange={(e) => setShowEmail(e.target.checked)} /> Email</label> <label className="ml-2"><input type="checkbox" checked={showSocial} onChange={(e) => setShowSocial(e.target.checked)} /> Social</label></div>
            </div>
          </section>

          <section style={{ display: activeTab === 'events' ? undefined : 'none' }} className="mt-6 bg-card border rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Events</h4>
              <div className="text-sm text-muted-foreground">{events.length} events</div>
            </div>

            <div className="space-y-3">
              {events.map(ev => (
                <div key={ev.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{ev.eventName || ev.name}</div>
                    <div className="text-xs text-muted-foreground">{ev.location} • {ev.date}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-muted-foreground">{isEventFinished(ev.id) ? 'Finished' : 'Active'}</div>
                    <Button variant="ghost" onClick={() => updateEvent(ev.id, { time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() }, true)}>Mark Finished</Button>
                    <Button onClick={() => updateEvent(ev.id, { isPopular: !ev.isPopular }, true)} variant="outline">Toggle Popular</Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm">Average attendance: <strong>{events.length ? Math.round(events.reduce((a, b) => a + (b.attendees || 0), 0) / events.length) : 0}</strong></div>
              <div>
                <Button onClick={() => exportCSVType('events')}>Export events</Button>
              </div>
            </div>
          </section>

          <section style={{ display: activeTab === 'analytics' ? undefined : 'none' }} className="mt-6 bg-card border rounded-xl p-4 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-card border rounded">
                <div className="text-sm text-muted-foreground">DAU / WAU / MAU</div>
                <div className="text-2xl font-bold">{dauCount} / {wauCount} / {mauCount}</div>
                {retention !== null && <div className="text-xs text-muted-foreground">30d retention: {retention}%</div>}
              </div>

              <div className="p-4 bg-card border rounded flex flex-col items-center">
                <div className="text-sm text-muted-foreground">Hourly Activity Heatmap</div>
                <div className="mt-2 w-full">
                  <div className="grid grid-cols-24 gap-1">
                    {/* simple horizontal bar display */}
                    <BarChart labels={Array.from({ length: 24 }, (_, i) => String(i))} values={heat} />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-card border rounded">
                <div className="text-sm text-muted-foreground">Revenue</div>
                <div className="text-2xl font-bold">${revenue.total.toFixed(2)}</div>
                <div className="mt-2 text-xs text-muted-foreground">By package:</div>
                <div className="mt-1">
                  {Object.entries(revenue.byPackage).map(([k, v]) => <div key={k} className="text-xs">{k}: ${v.toFixed(2)}</div>)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-4 border rounded">
                <h5 className="font-semibold mb-2">Most active pages</h5>
                <ul className="text-sm space-y-1">
                  {mostActivePages.map(p => <li key={p}>{p} ({clicksByPage[p]})</li>)}
                </ul>
              </div>

              <div className="p-4 border rounded">
                <h5 className="font-semibold mb-2">Top rated users</h5>
                <ul className="text-sm space-y-1">
                  {topRated.map(t => <li key={t.user.id}>{t.user.name} — {t.avgReceived?.toFixed(2)}</li>)}
                </ul>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <h5 className="font-semibold">Export & Reports</h5>
                <div className="text-xs text-muted-foreground">Generate CSV reports for analytic datasets</div>
              </div>
              <div className="flex items-center space-x-2">
                <Button onClick={() => exportCSVType('users')}>Export Users</Button>
                <Button onClick={() => exportCSVType('events')}>Export Events</Button>
                <Button onClick={() => exportCSVType('transactions')}>Export Transactions</Button>
                <Button onClick={() => exportCSVType('ratings')}>Export Ratings</Button>
              </div>
            </div>

          </section>

          <section style={{ display: activeTab === 'settings' ? undefined : 'none' }} className="mt-6 bg-card border rounded-xl p-4 shadow-sm">
            <h4 className="font-semibold mb-2">Settings & Integrations</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded">
                <div className="text-sm font-medium">MCP Integrations</div>
                <div className="text-xs text-muted-foreground mt-2">Suggested integrations for richer admin features:</div>
                <ul className="text-xs mt-2 space-y-1">
                  <li>Neon — Postgres database for storing analytics, users, ratings. [Connect to Neon](#open-mcp-popover)</li>
                  <li>Netlify — Deploy and host your app. [Connect to Netlify](#open-mcp-popover)</li>
                  <li>Zapier — Automate workflows and exports. [Connect to Zapier](#open-mcp-popover)</li>
                  <li>Figma — Convert designs to code using Builder.io plugin. Get the plugin at: https://www.figma.com/community/plugin/747985167520967365/builder-io-ai-powered-figma-to-code-react-vue-tailwind-more</li>
                  <li>Supabase — Realtime DB & Auth. [Connect to Supabase](#open-mcp-popover)</li>
                  <li>Builder.io — CMS & content management. [Connect to Builder.io](#open-mcp-popover)</li>
                  <li>Linear — Issue tracking. [Connect to Linear](#open-mcp-popover)</li>
                  <li>Notion — Documentation sync. [Connect to Notion](#open-mcp-popover)</li>
                  <li>Sentry — Error monitoring. [Connect to Sentry](#open-mcp-popover)</li>
                  <li>Context7 — Up to date docs. [Connect to Context7](#open-mcp-popover)</li>
                  <li>Semgrep — Security scanning. [Connect to Semgrep](#open-mcp-popover)</li>
                  <li>Prisma Postgres — ORM and schema management. [Connect to Prisma](#open-mcp-popover)</li>
                </ul>
              </div>

              <div className="p-4 border rounded">
                <div className="text-sm font-medium">Privacy & ACL</div>
                <div className="text-xs text-muted-foreground mt-2">This admin dashboard is client-side only and should be protected by server-side ACLs in production. Connect a database MCP (Neon/Supabase/Prisma) to persist and secure analytics and admin access.</div>
                <div className="mt-3">
                  <Button onClick={() => runCommand('export-csv')}>Quick export users</Button>
                </div>
              </div>
            </div>

          </section>

        </main>
      </div>
    </div>
  );
}
