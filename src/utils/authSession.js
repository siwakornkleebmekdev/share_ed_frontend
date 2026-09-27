import { supabase } from './supabase.js';

const DEFAULT_REFRESH_LEEWAY_SECONDS = 60;
let refreshPromise = null;

// Supabase rotates refresh tokens. All callers must share one in-flight
// refresh so parallel API/notification/socket requests cannot race each other.
export function refreshSessionOnce() {
  if (!refreshPromise) {
    refreshPromise = supabase.auth
      .refreshSession()
      .then(({ data, error }) => {
        if (error || !data?.session?.access_token) return null;
        return data.session;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function getValidSession({
  forceRefresh = false,
  refreshLeewaySeconds = DEFAULT_REFRESH_LEEWAY_SECONDS,
} = {}) {
  if (forceRefresh) return refreshSessionOnce();

  try {
    const { data, error } = await supabase.auth.getSession();
    const session = error ? null : data?.session || null;
    if (!session?.access_token) return refreshSessionOnce();

    const expiresAt = Number(session.expires_at);
    const shouldRefresh = Number.isFinite(expiresAt)
      && expiresAt * 1000 <= Date.now() + refreshLeewaySeconds * 1000;

    return shouldRefresh ? refreshSessionOnce() : session;
  } catch {
    return refreshSessionOnce();
  }
}
