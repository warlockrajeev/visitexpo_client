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

export function sortEventsByStartDate(events, now = Date.now()) {
  return [...(Array.isArray(events) ? events : [])]
    .map((event, index) => {
      const startDate =
        event?.startDate ||
        event?.start_date ||
        event?.eventStartDate ||
        event?.dates ||
        event?.eventDates;
      let startTime = startDate ? new Date(startDate).getTime() : Number.POSITIVE_INFINITY;
      if (!Number.isFinite(startTime) && typeof startDate === 'string') {
        const rangeMatch = startDate.match(
          /(?:[A-Za-z]{3,9},?\s*)?(\d{1,2})\s*[-–—]\s*(?:[A-Za-z]{3,9},?\s*)?(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/
        );
        const monthFirstRangeMatch = startDate.match(
          /([A-Za-z]+)\s+(\d{1,2})\s*[-–—]\s*(\d{1,2}),?\s+(\d{4})/
        );
        const dateParts = rangeMatch
          ? [rangeMatch[1], rangeMatch[3], rangeMatch[4]]
          : monthFirstRangeMatch
            ? [monthFirstRangeMatch[2], monthFirstRangeMatch[1], monthFirstRangeMatch[4]]
            : null;
        if (dateParts) {
          startTime = new Date(`${dateParts[1]} ${dateParts[0]}, ${dateParts[2]}`).getTime();
        }
      }
      if (!Number.isFinite(startTime)) startTime = Number.POSITIVE_INFINITY;
      const hasEndDate = Boolean(event?.endDate || event?.end_date || event?.eventEndDate);
      return {
        event,
        index,
        startTime,
        expired: isEventExpired(event, now) || (!hasEndDate && startTime < now)
      };
    })
    .sort((a, b) => {
      if (a.expired !== b.expired) return a.expired ? 1 : -1;
      if (a.startTime !== b.startTime) return a.startTime - b.startTime;
      return a.index - b.index;
    })
    .map(({ event }) => event);
}
