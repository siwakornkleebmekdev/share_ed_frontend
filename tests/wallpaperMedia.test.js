import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_WALLPAPER_SIZE_BYTES,
  isMp4Wallpaper,
  isSupportedWallpaperFile,
} from "../src/utils/wallpaperMedia.js";

test("wallpaper accepts the existing image formats and MP4", () => {
  for (const [name, type] of [
    ["wall.jpg", "image/jpeg"],
    ["wall.png", "image/png"],
    ["wall.webp", "image/webp"],
    ["wall.gif", "image/gif"],
    ["wall.mp4", "video/mp4"],
  ]) {
    assert.equal(isSupportedWallpaperFile({ name, type }), true);
  }
  assert.equal(isSupportedWallpaperFile({ name: "wall.mov", type: "video/quicktime" }), false);
});

test("wallpaper size limit is 25 MiB", () => {
  assert.equal(MAX_WALLPAPER_SIZE_BYTES, 25 * 1024 * 1024);
});

test("MP4 detection supports MIME and URLs with query strings", () => {
  assert.equal(isMp4Wallpaper("https://cdn.example/wall.MP4?version=1"), true);
  assert.equal(isMp4Wallpaper("blob:preview", "video/mp4"), true);
  assert.equal(isMp4Wallpaper("https://cdn.example/wall.gif"), false);
});
