import axios from 'axios';

const RETRY_DELAY_MS = 750;
const REQUEST_TIMEOUT_MS = 15000;
const MAX_ATTEMPTS = 2;

export async function fetchWordpressEvents() {
  let lastError;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await axios.get('/api/wordpress-events', {
        timeout: REQUEST_TIMEOUT_MS,
        ...(attempt > 0 ? { params: { refresh: 'true' } } : {})
      });

      if (response.data?.success && Array.isArray(response.data.events)) {
        if (response.data.events.length > 0 || attempt === MAX_ATTEMPTS - 1) {
          return {
            events: response.data.events,
            source: response.data.source
          };
        }
      } else {
        lastError = new Error(response.data?.error || 'The events service returned an invalid response.');
      }
    } catch (error) {
      lastError = error;
    }

    if (attempt < MAX_ATTEMPTS - 1) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  if (lastError) throw lastError;

  return { events: [], source: 'empty' };
}
