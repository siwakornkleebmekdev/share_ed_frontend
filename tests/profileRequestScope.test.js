import test from "node:test";
import assert from "node:assert/strict";
import { createProfileRequestScope } from "../src/utils/profileRequestScope.js";

const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};

test("switching tabs lets the ready section render while another is pending", async () => {
  const scope = createProfileRequestScope();
  const posts = deferred();
  const bookmarks = deferred();
  const shown = [];
  const postsRun = scope.run(() => posts.promise, () => shown.push("posts"));
  const bookmarksRun = scope.run(() => bookmarks.promise, () => shown.push("bookmarks"));

  bookmarks.resolve([]);
  await bookmarksRun;
  assert.deepEqual(shown, ["bookmarks"]);
  posts.resolve([]);
  await postsRun;
  assert.deepEqual(shown, ["bookmarks", "posts"]);
});

test("returning after saving a draft starts a fresh profile request", async () => {
  const firstVisit = createProfileRequestScope();
  const secondVisit = createProfileRequestScope();
  const drafts = [];
  await firstVisit.run(async () => ["old"], (value) => drafts.push(value));
  firstVisit.cancel();
  await secondVisit.run(async () => ["old", "new"], (value) => drafts.push(value));
  assert.deepEqual(drafts.at(-1), ["old", "new"]);
});

test("switching accounts discards a late response from the previous account", async () => {
  const oldAccount = createProfileRequestScope();
  const pending = deferred();
  const shown = [];
  const oldRun = oldAccount.run(() => pending.promise, (value) => shown.push(value));
  oldAccount.cancel();

  const newAccount = createProfileRequestScope();
  await newAccount.run(async () => "account B", (value) => shown.push(value));
  pending.resolve("account A");
  await oldRun;
  assert.deepEqual(shown, ["account B"]);
});
