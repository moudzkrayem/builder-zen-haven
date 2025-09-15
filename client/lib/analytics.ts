type ClickRecord = {
  timestamp: number;
  x: number;
  y: number;
  tag: string;
  page: string;
};

type PageVisit = {
  path: string;
  enter: number;
  leave?: number;
  duration?: number;
};

type Analytics = {
  clicks: ClickRecord[];
  pageVisits: PageVisit[];
  logs: string[];
};

const STORAGE_KEY = "trybe_analytics_v1";

function load(): Analytics {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: Analytics = { clicks: [], pageVisits: [], logs: [] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as Analytics;
  } catch (e) {
    const initial: Analytics = { clicks: [], pageVisits: [], logs: [] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
}

function save(a: Analytics) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
  } catch (e) {
    // ignore
  }
}

export function initAnalytics() {
  // ensure storage exists
  load();

  // click listener
  function onClick(e: MouseEvent) {
    try {
      const target = e.target as HTMLElement | null;
      const tag = target ? `${target.tagName.toLowerCase()}${target.id ? `#${target.id}` : ""}${target.className ? `.${(target.className as string).split(" ").join(".")}` : ""}` : "unknown";
      const rect = target ? (target.getBoundingClientRect ? target.getBoundingClientRect() : null) : null;
      const x = e.clientX;
      const y = e.clientY;
      const page = location.pathname + location.search;
      const a = load();
      a.clicks.push({ timestamp: Date.now(), x, y, tag, page });
      if (a.clicks.length > 1000) a.clicks.shift();
      save(a);
    } catch (err) {
      // ignore
    }
  }

  document.removeEventListener("click", onClick);
  document.addEventListener("click", onClick, { capture: true });
}

let currentVisitStart: number | null = null;
let currentVisitPath: string | null = null;

export function recordPageEnter(path: string) {
  const a = load();
  const now = Date.now();
  // if previous visit exists without leave, close it
  if (currentVisitPath && currentVisitStart) {
    const duration = now - currentVisitStart;
    const prev = a.pageVisits[a.pageVisits.length - 1];
    if (prev && prev.path === currentVisitPath && !prev.leave) {
      prev.leave = now;
      prev.duration = (prev.duration || 0) + duration;
    }
  }

  a.pageVisits.push({ path, enter: now });
  if (a.pageVisits.length > 500) a.pageVisits.shift();
  save(a);
  currentVisitPath = path;
  currentVisitStart = now;
}

export function recordPageLeave(path: string) {
  const a = load();
  const now = Date.now();
  // find last visit for this path
  for (let i = a.pageVisits.length - 1; i >= 0; i--) {
    const v = a.pageVisits[i];
    if (v.path === path && !v.leave) {
      v.leave = now;
      v.duration = (v.duration || 0) + (now - (v.enter || now));
      break;
    }
  }
  save(a);
  currentVisitPath = null;
  currentVisitStart = null;
}

export function log(message: string) {
  const a = load();
  a.logs.push(`${new Date().toISOString()} - ${message}`);
  if (a.logs.length > 1000) a.logs.shift();
  save(a);
}

export function getAnalytics(): Analytics {
  return load();
}

export function clearAnalytics() {
  const initial: Analytics = { clicks: [], pageVisits: [], logs: [] };
  save(initial);
}
