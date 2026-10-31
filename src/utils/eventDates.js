export function isEventExpired(event, now = Date.now()) {
  const endDate = event?.endDate || event?.startDate;
  if (!endDate) return false;

  const dateOnlyMatch =
    typeof endDate === 'string'
      ? endDate.match(/^(\d{4}-\d{2}-\d{2})(?:T00:00:00(?:\.000)?Z)?$/)
      : null;
  const parsedEndDate = dateOnlyMatch
    ? new Date(`${dateOnlyMatch[1]}T00:00:00`)
    : new Date(endDate);
  if (Number.isNaN(parsedEndDate.getTime())) return false;

  if (parsedEndDate.getHours() === 0 && parsedEndDate.getMinutes() === 0) {
    parsedEndDate.setHours(23, 59, 59, 999);
  }

  return parsedEndDate.getTime() < now;
}
