export function buildDashboardEventsUrl(apiUrl, user) {
  const params = new URLSearchParams({ limit: '1000', all: 'true' });

  if (user?.role === 'organizer') {
    const organizationId = user.organization?._id || user.organization;
    const userId = user._id || user.id;
    const organizerIds = [organizationId, userId].filter(Boolean).map(String);

    if (organizerIds.length > 0) {
      params.set('organizerId', organizerIds.join(','));
      params.set('limit', '100');
    }
  }

  return `${apiUrl}/events?${params.toString()}`;
}
