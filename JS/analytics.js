// Shared analytics helpers for Billing X

(function () {
  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function formatLocalDate(d) {
    const dt = d instanceof Date ? d : new Date(d);
    return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
  }

  function formatLocalTime(d) {
    const dt = d instanceof Date ? d : new Date(d);
    return `${pad2(dt.getHours())}:${pad2(dt.getMinutes())}:${pad2(dt.getSeconds())}`;
  }

  function isToday(isoString) {
    if (!isoString) return false;
    const d = new Date(isoString);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }

  // Attempts to group rows by hour (based on ISO timestamp string)
  function groupByHour(rows, tsKey) {
    const m = new Map();
    for (const row of rows || []) {
      const t = row?.[tsKey];
      if (!t) continue;
      const d = new Date(t);
      const hour = `${pad2(d.getHours())}:00`;
      const prev = m.get(hour) || 0;
      m.set(hour, prev + 1);
    }

    // Return sorted keys
    return Array.from(m.entries())
      .sort((a, b) => {
        const ha = a[0].split(":")[0];
        const hb = b[0].split(":")[0];
        return Number(ha) - Number(hb);
      })
      .map(([label, value]) => ({ label, value }));
  }

  window.BillingXAnalytics = {
    formatLocalDate,
    formatLocalTime,
    isToday,
    groupByHour,
  };
})();

