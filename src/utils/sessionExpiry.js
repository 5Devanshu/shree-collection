// Tiny pub/sub so any axios instance (customer/reseller in StoreContext,
// admin in api/client.js) can announce an expired/invalid token and have
// ONE shared banner react to it — without importing each other or drilling
// props through the whole app.
const EVENT_NAME = 'shree:session-expired';

// `who` tells the banner which login page to send the user back to, since
// customers, resellers, and admins all have different login routes.
export const notifySessionExpired = (who = 'customer') => {
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { who } }));
};

export const onSessionExpired = (handler) => {
  const listener = (e) => handler(e.detail?.who || 'customer');
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
};

export const SESSION_EXPIRED_EVENT = EVENT_NAME;