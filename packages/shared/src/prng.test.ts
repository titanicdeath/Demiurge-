import { describe, expect, it } from 'vitest';
import golden from '../testdata/prng.golden.json';
import rangeGolden from '../testdata/prng-range-float.golden.json';
import { Xoshiro256PlusPlus, seedFromHex, seedFromString, seedToHex } from './prng';

const collect = async () => {
  const rng = new Xoshiro256PlusPlus(seedFromHex(golden.seedHex));
  const fork = await rng.fork(golden.fork.label);
  return {
    u64: Array.from({ length: 8 }, () => `0x${rng.nextU64().toString(16).padStart(16, '0')}`),
    f64: Array.from({ length: 4 }, () => Number(rng.nextF64().toFixed(16))),
    ranges: {
      int_10_99: Array.from({ length: 6 }, () => rng.nextRangeInt(10, 99)),
      float_neg1_1: Array.from({ length: 3 }, () => Number(fork.nextRangeFloat(-1, 1).toFixed(16)))
    },
    fork: {
      label: golden.fork.label,
      u64: Array.from({ length: 4 }, () => `0x${fork.nextU64().toString(16).padStart(16, '0')}`)
    }
  };
};

const f64ToBitsHex = (value: number): string => {
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, value, false);
  const bits = view.getBigUint64(0, false);
  return `0x${bits.toString(16).padStart(16, '0')}`;
};

describe('prng determinism', () => {
  it('matches the committed golden file', async () => {
    expect(await collect()).toEqual({
      u64: golden.u64,
      f64: golden.f64,
      ranges: { int_10_99: golden.ranges.int_10_99, float_neg1_1: golden.ranges.float_neg1_1 },
      fork: golden.fork
    });
  });

  it('matches the cross-language next_range_float regression fixture bit-for-bit', () => {
    const rng = new Xoshiro256PlusPlus(seedFromHex(rangeGolden.seedHex));
    const outputBits = rangeGolden.cases.map(({ min, max }) => f64ToBitsHex(rng.nextRangeFloat(min, max)));
    expect(outputBits).toEqual(rangeGolden.cases.map(({ bitsHex }) => bitsHex));
  });

  it('supports stable seed round-trips via hex representation', async () => {
    const seed = await seedFromString('demiurge-seed');
    const hex = seedToHex(seed);
    expect(seedToHex(seedFromHex(hex))).toBe(hex);
  });

  it('fork divergence and repeatability hold', async () => {
    const parent = await Xoshiro256PlusPlus.fromString('fork-root');
    const a1 = await parent.fork('climate');
    const a2 = await parent.fork('climate');
    const b = await parent.fork('tectonics');
    const streamA1 = Array.from({ length: 4 }, () => a1.nextU64());
    const streamA2 = Array.from({ length: 4 }, () => a2.nextU64());
    const streamB = Array.from({ length: 4 }, () => b.nextU64());
    expect(streamA1).toEqual(streamA2);
    expect(streamA1).not.toEqual(streamB);
  });
});
