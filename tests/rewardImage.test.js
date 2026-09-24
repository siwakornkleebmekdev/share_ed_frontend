import { strict as assert } from 'node:assert';
import { File } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { prepareRewardImageFile } from '../src/utils/rewardImage.js';

test('APNG upload keeps animation bytes in a PNG container', async () => {
  globalThis.File = File;
  const bytes = await readFile(new URL('../test-assets/reward-frame-sapphire-animated.png', import.meta.url));
  const input = new File([bytes], 'frame.apng', { type: 'image/apng' });
  const output = await prepareRewardImageFile(input);

  assert.equal(output.name, 'frame.png');
  assert.equal(output.type, 'image/png');
  assert.deepEqual(Buffer.from(await output.arrayBuffer()), bytes);
  assert.ok(bytes.includes(Buffer.from('acTL')), 'source should contain the APNG animation chunk');

  const pngNamedInput = new File([bytes], 'frame.png', { type: 'image/png' });
  const pngNamedOutput = await prepareRewardImageFile(pngNamedInput);
  assert.equal(pngNamedOutput.name, 'frame.png');
  assert.equal(pngNamedOutput.type, 'image/png');
  assert.deepEqual(Buffer.from(await pngNamedOutput.arrayBuffer()), bytes);
});
