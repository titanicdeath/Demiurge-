use sha2::{Digest, Sha256};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Seed256(pub [u64; 4]);

#[derive(Debug, Clone)]
pub struct Xoshiro256PlusPlus {
    state: [u64; 4],
}

impl Seed256 {
    pub fn from_hex(hex: &str) -> Result<Self, String> {
        if hex.len() != 64 {
            return Err("seed hex must be 64 chars".to_string());
        }
        let bytes = hex::decode(hex).map_err(|e| e.to_string())?;
        let mut out = [0u64; 4];
        for i in 0..4 {
            let mut chunk = [0u8; 8];
            chunk.copy_from_slice(&bytes[i * 8..(i + 1) * 8]);
            out[i] = u64::from_be_bytes(chunk);
        }
        Ok(Seed256(out))
    }

    pub fn to_hex(&self) -> String {
        self.0
            .iter()
            .map(|v| format!("{v:016x}"))
            .collect::<Vec<String>>()
            .join("")
    }

    pub fn from_string(seed: &str) -> Self {
        let digest = Sha256::digest(seed.as_bytes());
        let mut out = [0u64; 4];
        for i in 0..4 {
            let mut chunk = [0u8; 8];
            chunk.copy_from_slice(&digest[i * 8..(i + 1) * 8]);
            out[i] = u64::from_be_bytes(chunk);
        }
        Seed256(out)
    }
}

impl Xoshiro256PlusPlus {
    pub fn from_seed(seed: Seed256) -> Self {
        Self { state: seed.0 }
    }
    pub fn from_string(seed: &str) -> Self {
        Self::from_seed(Seed256::from_string(seed))
    }

    pub fn next_u64(&mut self) -> u64 {
        let result = self.state[0]
            .wrapping_add(self.state[3])
            .rotate_left(23)
            .wrapping_add(self.state[0]);
        let t = self.state[1] << 17;

        self.state[2] ^= self.state[0];
        self.state[3] ^= self.state[1];
        self.state[1] ^= self.state[2];
        self.state[0] ^= self.state[3];

        self.state[2] ^= t;
        self.state[3] = self.state[3].rotate_left(45);

        result
    }

    pub fn next_f64(&mut self) -> f64 {
        let value = self.next_u64() >> 11;
        (value as f64) / 9007199254740992.0
    }

    pub fn next_range_int(&mut self, min: i64, max: i64) -> i64 {
        assert!(max > min);
        // Keep derivation as (next_u64 % span) + min in both TS and Rust.
        min + (self.next_u64() % ((max - min) as u64)) as i64
    }

    pub fn next_range_float(&mut self, min: f64, max: f64) -> f64 {
        assert!(!min.is_nan() && !max.is_nan());
        assert!(max >= min);
        if max == min {
            return min;
        }
        // Canonical cross-language formula: ((max - min) * raw) + min.
        // Do not reorder to `min + raw * (max - min)` or use f64::mul_add/FMA.
        let raw = self.next_f64();
        (max - min) * raw + min
    }

    pub fn fork(&self, label: &str) -> Self {
        // Fork material must remain exactly `<64-char lowercase hex state>::<label>` in UTF-8 bytes,
        // then SHA-256 parsed as 4 big-endian u64s in both TS and Rust.
        Self::from_string(&format!("{}::{label}", Seed256(self.state).to_hex()))
    }
}
