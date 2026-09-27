import test from 'node:test';
import assert from 'node:assert/strict';
import { supabase } from '../src/utils/supabase.js';
import { getValidSession } from '../src/utils/authSession.js';

test('valid Supabase sessions are reused without refreshing', async (t) => {
  const session = {
    access_token: 'current-token',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  };
  let refreshCalls = 0;
  t.mock.method(supabase.auth, 'getSession', async () => ({ data: { session }, error: null }));
  t.mock.method(supabase.auth, 'refreshSession', async () => {
    refreshCalls += 1;
    return { data: { session }, error: null };
  });

  assert.equal((await getValidSession()).access_token, 'current-token');
  assert.equal(refreshCalls, 0);
});

test('parallel requests share one refresh operation', async (t) => {
  const expiringSession = {
    access_token: 'old-token',
    expires_at: Math.floor(Date.now() / 1000) + 10,
  };
  const refreshedSession = {
    access_token: 'new-token',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  };
  let refreshCalls = 0;
  t.mock.method(supabase.auth, 'getSession', async () => ({ data: { session: expiringSession }, error: null }));
  t.mock.method(supabase.auth, 'refreshSession', async () => {
    refreshCalls += 1;
    await new Promise(resolve => setTimeout(resolve, 10));
    return { data: { session: refreshedSession }, error: null };
  });

  const sessions = await Promise.all([
    getValidSession(),
    getValidSession(),
    getValidSession(),
  ]);

  assert.equal(refreshCalls, 1);
  assert.deepEqual(sessions.map(session => session?.access_token), [
    'new-token',
    'new-token',
    'new-token',
  ]);
});
