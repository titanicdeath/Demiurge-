const MASK_64 = (1n << 64n) - 1n;

export type Seed256 = [bigint, bigint, bigint, bigint];

const rotl = (x: bigint, k: bigint): bigint => ((x << k) | (x >> (64n - k))) & MASK_64;

const toBytesUtf8 = (value: string): Uint8Array => new TextEncoder().encode(value);

const sha256 = async (input: Uint8Array): Promise<Uint8Array> => {
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', input);
    return new Uint8Array(digest);
  }

  const { createHash } = await import('node:crypto');
  return new Uint8Array(createHash('sha256').update(input).digest());
};

const bytesToSeed = (bytes: Uint8Array): Seed256 => {
  const read64 = (offset: number): bigint => {
    let value = 0n;
    for (let i = 0; i < 8; i += 1) {
      value = (value << 8n) | BigInt(bytes[offset + i]);
    }
    return value;
  };
  return [read64(0), read64(8), read64(16), read64(24)];
};

export const seedToHex = (seed: Seed256): string =>
  seed.map((part) => part.toString(16).padStart(16, '0')).join('');

export const seedFromHex = (hex: string): Seed256 => {
  if (!/^[0-9a-f]{64}$/i.test(hex)) {
    throw new Error('seed hex must be 64 hex chars');
  }
  const normalized = hex.toLowerCase();
  return [0, 1, 2, 3].map((idx) => BigInt(`0x${normalized.slice(idx * 16, (idx + 1) * 16)}`)) as Seed256;
};

export const seedFromString = async (value: string): Promise<Seed256> => bytesToSeed(await sha256(toBytesUtf8(value)));

export class Xoshiro256PlusPlus {
  private state: Seed256;

  public constructor(seed: Seed256) {
    this.state = seed.slice() as Seed256;
  }

  public static async fromString(seed: string): Promise<Xoshiro256PlusPlus> {
    return new Xoshiro256PlusPlus(await seedFromString(seed));
  }

  public nextU64(): bigint {
    const s = this.state;
    const result = (rotl((s[0] + s[3]) & MASK_64, 23n) + s[0]) & MASK_64;
    const t = (s[1] << 17n) & MASK_64;

    s[2] ^= s[0];
    s[3] ^= s[1];
    s[1] ^= s[2];
    s[0] ^= s[3];
    s[2] ^= t;
    s[3] = rotl(s[3], 45n);

    this.state = s;
    return result;
  }

  public nextF64(): number {
    const value = this.nextU64() >> 11n;
    return Number(value) / 9007199254740992;
  }

  public nextRangeInt(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max <= min) {
      throw new Error('invalid integer range');
    }
    // Keep derivation as (next_u64 % span) + min in both TS and Rust.
    const span = BigInt(max - min);
    return min + Number(this.nextU64() % span);
  }

  public nextRangeFloat(min: number, max: number): number {
    if (Number.isNaN(min) || Number.isNaN(max) || max < min) {
      throw new Error('invalid float range');
    }
    if (max === min) {
      return min;
    }
    // Canonical cross-language formula: ((max - min) * raw) + min.
    // Do not reorder to `min + raw * (max - min)` or use FMA; operand order is locked for bit determinism.
    const raw = this.nextF64();
    return (max - min) * raw + min;
  }

  public async fork(label: string): Promise<Xoshiro256PlusPlus> {
    // Fork material must remain exactly `<64-char lowercase hex state>::<label>` in UTF-8 bytes,
    // then SHA-256 parsed as 4 big-endian u64s in both TS and Rust.
    const forkMaterial = `${seedToHex(this.state)}::${label}`;
    return Xoshiro256PlusPlus.fromString(forkMaterial);
  }

  public snapshot(): Seed256 {
    return this.state.slice() as Seed256;
  }
}
