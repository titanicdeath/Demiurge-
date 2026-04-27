import { writeFileSync } from 'node:fs';
import { Xoshiro256PlusPlus, seedFromHex } from '../packages/shared/src/prng.ts';

const seedHex = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';
const rng = new Xoshiro256PlusPlus(seedFromHex(seedHex));
const forkLabel = 'tectonics';
const fork = await rng.fork(forkLabel);
const golden = {
  seedHex,
  u64: Array.from({ length: 8 }, () => `0x${rng.nextU64().toString(16).padStart(16, '0')}`),
  f64: Array.from({ length: 4 }, () => Number(rng.nextF64().toFixed(16))),
  ranges: {
    int_10_99: Array.from({ length: 6 }, () => rng.nextRangeInt(10, 99)),
    float_neg1_1: Array.from({ length: 3 }, () => Number(fork.nextRangeFloat(-1, 1).toFixed(16)))
  },
  fork: {
    label: forkLabel,
    u64: Array.from({ length: 4 }, () => `0x${fork.nextU64().toString(16).padStart(16, '0')}`)
  }
};
writeFileSync('packages/shared/testdata/prng.golden.json', `${JSON.stringify(golden, null, 2)}\n`);
