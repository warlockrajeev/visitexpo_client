import { showSweetAlert } from './sweetalert.js';
import { isEventExpired } from './eventDates.js';

export async function allowEventPassClaim(event) {
  if (!isEventExpired(event)) return true;

  await showSweetAlert({
    title: 'Show Concluded',
    text: 'Free visitor passes are no longer available for past shows.',
    icon: 'info'
  });
  return false;
}
