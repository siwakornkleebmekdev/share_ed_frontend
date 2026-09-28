import test from "node:test";
import assert from "node:assert/strict";
import { createBookmarkStatusStore } from "../src/store/bookmarkStatusCore.js";

const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};

test("many cards share one bookmark request and do not block post rendering", async () => {
  let calls = 0;
  const pending = deferred();
  const store = createBookmarkStatusStore(() => { calls += 1; return pending.promise; }, () => "user-a");
  const first = store.getState().ensureLoaded();
  const second = store.getState().ensureLoaded();
  assert.equal(first, second);
  assert.equal(store.getState().loaded, false);
  pending.resolve([{ post_id: "post-1" }]);
  await first;
  assert.equal(calls, 1);
  assert.equal(store.getState().ids.has("post-1"), true);
});

test("a click made while bookmarks load wins over the older response", async () => {
  const pending = deferred();
  const store = createBookmarkStatusStore(() => pending.promise, () => "user-a");
  const load = store.getState().ensureLoaded();
  store.getState().setBookmarked("post-1", false);
  store.getState().setBookmarked("post-2", true);
  pending.resolve([{ post_id: "post-1" }]);
  await load;
  assert.deepEqual([...store.getState().ids], ["post-2"]);
});

test("switching accounts or signing out discards old bookmark responses", async () => {
  let userId = "user-a";
  const firstResponse = deferred();
  const store = createBookmarkStatusStore(
    () => userId === "user-a" ? firstResponse.promise : Promise.resolve([{ post_id: "post-b" }]),
    () => userId,
  );
  const firstLoad = store.getState().ensureLoaded();
  userId = "user-b";
  await store.getState().ensureLoaded();
  firstResponse.resolve([{ post_id: "post-a" }]);
  await firstLoad;
  assert.equal(store.getState().ownerId, "user-b");
  assert.deepEqual([...store.getState().ids], ["post-b"]);

  userId = null;
  store.getState().clear();
  assert.equal(store.getState().ownerId, null);
  assert.equal(store.getState().loaded, false);
  assert.equal(store.getState().ids.size, 0);
});
