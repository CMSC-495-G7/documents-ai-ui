const DAY_MS = 24 * 60 * 60 * 1000;

// Midnight at the start of that day, in the user's time zone
function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Calendar days between the two: 0 today, 1 yesterday
function daysAgo(date: Date, now: Date) {
  return Math.round(
    (startOfDay(now).getTime() - startOfDay(date).getTime()) / DAY_MS,
  );
}

// "Today", "Yesterday", "Nov 3", or "Nov 3, 2025" for another year
export function whenLabel(createdAt: string, now = new Date()) {
  if (!createdAt || isNaN(Date.parse(createdAt))) {
    return '';
  }

  const date = new Date(createdAt);
  const days = daysAgo(date, now);

  if (days === 0) {
    return 'Today';
  }
  if (days === 1) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    // Only for another year
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
}
