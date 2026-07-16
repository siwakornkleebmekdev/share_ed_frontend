// Samples the top slice of an image or video (the region that actually sits
// behind the fixed navbar) so the UI can pick a readable light/dark style
// AND a matching color tint for arbitrary user-uploaded backgrounds, instead
// of guessing from the route.
const SAMPLE_SIZE = 16;
// Hero images/videos put their darkest gradient overlay near the bottom;
// only the top band is ever behind the navbar.
const TOP_SLICE_RATIO = 0.25;

function sampleCanvas(ctx) {
  const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let sumLuminance = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha === 0) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    sumR += r;
    sumG += g;
    sumB += b;
    // Perceived luminance (ITU-R BT.601)
    sumLuminance += r * 0.299 + g * 0.587 + b * 0.114;
    count += 1;
  }
  if (!count) {
    return { brightness: 0.5, r: 15, g: 23, b: 42 };
  }
  return {
    brightness: sumLuminance / count / 255,
    r: Math.round(sumR / count),
    g: Math.round(sumG / count),
    b: Math.round(sumB / count),
  };
}

function drawTopSlice(ctx, source, naturalWidth, naturalHeight) {
  const sliceHeight = Math.max(1, naturalHeight * TOP_SLICE_RATIO);
  ctx.drawImage(source, 0, 0, naturalWidth, sliceHeight, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
}

// Returns { brightness: 0-1, r, g, b } sampled from the top slice of the
// given image/video URL.
export function getImageColorProfile(url) {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('No image URL provided'));
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const isVideo = /\.mp4($|\?)/i.test(url);

    if (isVideo) {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.src = url;

      const cleanup = () => {
        video.removeEventListener('loadeddata', onLoaded);
        video.removeEventListener('error', onError);
      };
      const onLoaded = () => {
        try {
          drawTopSlice(ctx, video, video.videoWidth, video.videoHeight);
          resolve(sampleCanvas(ctx));
        } catch (err) {
          reject(err);
        } finally {
          cleanup();
        }
      };
      const onError = (err) => {
        cleanup();
        reject(err);
      };
      video.addEventListener('loadeddata', onLoaded, { once: true });
      video.addEventListener('error', onError, { once: true });
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        drawTopSlice(ctx, img, img.naturalWidth, img.naturalHeight);
        resolve(sampleCanvas(ctx));
      } catch (err) {
        // Likely a tainted canvas from a non-CORS-enabled image host.
        reject(err);
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}
