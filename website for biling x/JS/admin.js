// Admin dashboard logic for Billing X (ZBighype)
// Realtime analytics using Supabase tables: visitors, downloads

(function () {
  const supa = window.supabase;
  const Analytics = window.BillingXAnalytics;

  const qs = (id) => document.getElementById(id);

  const realtimeStatusEl = qs('realtimeStatus');
  const chartVisitorsCanvas = qs('chartVisitors');
  const chartDownloadsCanvas = qs('chartDownloads');

  const el = {
    totalVisitors: qs('statTotalVisitors'),
    totalDownloads: qs('statTotalDownloads'),
    visitorsToday: qs('statVisitorsToday'),
    downloadsToday: qs('statDownloadsToday'),
    activeUsers: qs('statActiveUsers'),
    visitorsHint: qs('visitorsLogHint'),
    downloadsHint: qs('downloadsLogHint'),
    visitorsBody: qs('latestVisitorsBody'),
    downloadsBody: qs('latestDownloadsBody'),
  };

  const logoutBtn = qs('logoutBtn');
  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('adminLoggedIn');
    window.location.href = 'login.html';
  });

  // Date/time
  const dateEl = qs('currentDate');
  const timeEl = qs('currentTime');
  function tickClock() {
    const now = new Date();
    if (dateEl) dateEl.textContent = Analytics?.formatLocalDate(now) || now.toLocaleDateString();
    if (timeEl) timeEl.textContent = Analytics?.formatLocalTime(now) || now.toLocaleTimeString();
  }
  tickClock();
  setInterval(tickClock, 1000);

  // Charts
  const baseGridColor = 'rgba(255,255,255,.10)';
  const baseTickColor = 'rgba(255,255,255,.65)';
  const baseTextColor = 'rgba(255,255,255,.88)';

  let chartVisitors = null;
  let chartDownloads = null;

  function initCharts() {
    if (!chartVisitorsCanvas || !chartDownloadsCanvas || !window.Chart) return;

    chartVisitors = new Chart(chartVisitorsCanvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Visitors',
            data: [],
            borderColor: 'rgba(255,255,255,.90)',
            backgroundColor: 'rgba(255,255,255,.08)',
            tension: 0.35,
            fill: true,
            pointRadius: 2,
            pointHoverRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,.85)',
            titleColor: baseTextColor,
            bodyColor: baseTextColor,
            borderColor: 'rgba(255,255,255,.12)',
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            grid: { color: baseGridColor },
            ticks: { color: baseTickColor, maxRotation: 0, autoSkip: true },
          },
          y: {
            grid: { color: baseGridColor },
            ticks: { color: baseTickColor },
            beginAtZero: true,
          },
        },
      },
    });

    chartDownloads = new Chart(chartDownloadsCanvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Downloads',
            data: [],
            borderColor: 'rgba(255,255,255,.55)',
            backgroundColor: 'rgba(255,255,255,.06)',
            tension: 0.35,
            fill: true,
            pointRadius: 2,
            pointHoverRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,.85)',
            titleColor: baseTextColor,
            bodyColor: baseTextColor,
            borderColor: 'rgba(255,255,255,.12)',
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            grid: { color: baseGridColor },
            ticks: { color: baseTickColor, maxRotation: 0, autoSkip: true },
          },
          y: {
            grid: { color: baseGridColor },
            ticks: { color: baseTickColor },
            beginAtZero: true,
          },
        },
      },
    });
  }

  initCharts();

  function safeNum(n) {
    const x = Number(n);
    return Number.isFinite(x) ? x : 0;
  }

  function formatRowTime(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return String(ts);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  }

  // Fetch totals using count=exact and limit=0
  async function getTotalCount(tableName) {
    const { count, error } = await supa
      .from(tableName)
      .select('id', { count: 'exact', head: true });

    if (error) throw error;
    return safeNum(count);
  }

  async function getTodayCount(tableName, tsKey) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Supabase expects ISO strings
    const { count, error } = await supa
      .from(tableName)
      .select(tsKey, { count: 'exact', head: true })
      .gte(tsKey, start.toISOString())
      .lte(tsKey, end.toISOString());

    if (error) throw error;
    return safeNum(count);
  }

  async function fetchLatest(tableName, tsKey, limit, columns) {
    const selectCols = columns.join(',');
    const { data, error } = await supa
      .from(tableName)
      .select(selectCols)
      .order(tsKey, { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async function fetchHourlySeries(tableName, tsKey, limitRowsForGrouping) {
    // Group-by in JS for simplicity: fetch latest N rows, then bucket by hour.
    const { data, error } = await supa
      .from(tableName)
      .select(tsKey)
      .order(tsKey, { ascending: false })
      .limit(limitRowsForGrouping);

    if (error) throw error;

    // bucket
    const grouped = Analytics.groupByHour(data, tsKey);
    return grouped;
  }

  async function refreshOnce() {
    if (!supa) {
      realtimeStatusEl && (realtimeStatusEl.textContent = 'Supabase not ready');
      return;
    }

    el.visitorsHint && (el.visitorsHint.textContent = 'Updating…');
    el.downloadsHint && (el.downloadsHint.textContent = 'Updating…');

    const [
      totalVisitors,
      totalDownloads,
      visitorsToday,
      downloadsToday,
      latestVisitors,
      latestDownloads,
      seriesVisitors,
      seriesDownloads,
    ] = await Promise.all([
      getTotalCount('visitors'),
      getTotalCount('downloads'),
      getTodayCount('visitors', 'visit_time'),
      getTodayCount('downloads', 'download_time'),
      fetchLatest(
        'visitors',
        'visit_time',
        50,
        ['visit_time', 'country', 'browser', 'device', 'page']
      ),
      fetchLatest(
        'downloads',
        'download_time',
        50,
        ['download_time', 'country', 'browser', 'device']
      ),
      fetchHourlySeries('visitors', 'visit_time', 400),
      fetchHourlySeries('downloads', 'download_time', 400),
    ]);

    el.totalVisitors && (el.totalVisitors.textContent = totalVisitors);
    el.totalDownloads && (el.totalDownloads.textContent = totalDownloads);
    el.visitorsToday && (el.visitorsToday.textContent = visitorsToday);
    el.downloadsToday && (el.downloadsToday.textContent = downloadsToday);

    // Latest logs
    if (el.visitorsBody) {
      el.visitorsBody.innerHTML = (latestVisitors || [])
        .map((r) =>
          `<tr>
            <td style="padding:10px 12px; border-bottom:1px solid rgba(255,255,255,.06); color: rgba(255,255,255,.82); font-size: 13px;">${formatRowTime(r.visit_time)}</td>
            <td style="padding:10px 12px; border-bottom:1px solid rgba(255,255,255,.06); color: rgba(255,255,255,.72); font-size: 13px;">${r.country || '—'}</td>
            <td style="padding:10px 12px; border-bottom:1px solid rgba(255,255,255,.06); color: rgba(255,255,255,.72); font-size: 13px;">${r.browser || '—'}</td>
            <td style="padding:10px 12px; border-bottom:1px solid rgba(255,255,255,.06); color: rgba(255,255,255,.72); font-size: 13px;">${r.device || '—'}</td>
            <td style="padding:10px 12px; border-bottom:1px solid rgba(255,255,255,.06); color: rgba(255,255,255,.72); font-size: 13px;">${r.page || '—'}</td>
          </tr>`
        )
        .join('');
    }

    if (el.downloadsBody) {
      el.downloadsBody.innerHTML = (latestDownloads || [])
        .map((r) =>
          `<tr>
            <td style="padding:10px 12px; border-bottom:1px solid rgba(255,255,255,.06); color: rgba(255,255,255,.82); font-size: 13px;">${formatRowTime(r.download_time)}</td>
            <td style="padding:10px 12px; border-bottom:1px solid rgba(255,255,255,.06); color: rgba(255,255,255,.72); font-size: 13px;">${r.country || '—'}</td>
            <td style="padding:10px 12px; border-bottom:1px solid rgba(255,255,255,.06); color: rgba(255,255,255,.72); font-size: 13px;">${r.browser || '—'}</td>
            <td style="padding:10px 12px; border-bottom:1px solid rgba(255,255,255,.06); color: rgba(255,255,255,.72); font-size: 13px;">${r.device || '—'}</td>
          </tr>`
        )
        .join('');
    }

    // Active users: approximate using last 5 mins activity from both tables.
    const now = Date.now();
    const fiveMinsAgo = new Date(now - 5 * 60 * 1000).toISOString();

    const [activeVisitors, activeDownloads] = await Promise.all([
      supa
        .from('visitors')
        .select('id', { count: 'exact', head: true })
        .gte('visit_time', fiveMinsAgo),
      supa
        .from('downloads')
        .select('id', { count: 'exact', head: true })
        .gte('download_time', fiveMinsAgo),
    ]);

    const vCount = safeNum(activeVisitors?.count);
    const dCount = safeNum(activeDownloads?.count);
    const active = vCount + dCount;
    el.activeUsers && (el.activeUsers.textContent = active);

    // Charts
    if (chartVisitors) {
      const labels = (seriesVisitors || []).map((p) => p.label);
      const dataPoints = (seriesVisitors || []).map((p) => p.value);
      chartVisitors.data.labels = labels;
      chartVisitors.data.datasets[0].data = dataPoints;
      chartVisitors.update();
    }

    if (chartDownloads) {
      const labels = (seriesDownloads || []).map((p) => p.label);
      const dataPoints = (seriesDownloads || []).map((p) => p.value);
      chartDownloads.data.labels = labels;
      chartDownloads.data.datasets[0].data = dataPoints;
      chartDownloads.update();
    }

    el.visitorsHint && (el.visitorsHint.textContent = 'Up to date');
    el.downloadsHint && (el.downloadsHint.textContent = 'Up to date');
  }

  // Realtime subscriptions + periodic refresh
  async function startRealtime() {
    try {
      if (!supa) throw new Error('Supabase not initialized');

      realtimeStatusEl && (realtimeStatusEl.textContent = 'Realtime connecting…');

      // Periodic refresh every 5 seconds (as required)
      await refreshOnce();

      setInterval(() => {
        refreshOnce().catch(() => {
          // keep UI responsive; don't spam errors
        });
      }, 5000);

      // Supabase Realtime subscriptions
      // Note: Supabase-js v2 supports realtime via `channel`.
      // We'll subscribe to both tables and trigger a refresh.
      const channel = supa
        .channel('billingx-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'visitors' },
          () => refreshOnce().catch(() => {})
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'downloads' },
          () => refreshOnce().catch(() => {})
        )
        .subscribe((status) => {
          // status can be: SUBSCRIBED, TIMED_OUT, CHANNEL_ERROR, etc
          if (!realtimeStatusEl) return;
          if (status === 'SUBSCRIBED') realtimeStatusEl.textContent = 'Realtime: Connected';
          else realtimeStatusEl.textContent = `Realtime: ${status}`;
        });

      // Prevent unused var warning
      void channel;
    } catch (e) {
      if (realtimeStatusEl) realtimeStatusEl.textContent = 'Realtime unavailable';
      // still try periodic refresh with empty charts
      refreshOnce().catch(() => {});
    }
  }

  // Start
  document.addEventListener('DOMContentLoaded', () => {
    startRealtime().catch(() => {
      if (realtimeStatusEl) realtimeStatusEl.textContent = 'Realtime failed';
    });
  });
})();

