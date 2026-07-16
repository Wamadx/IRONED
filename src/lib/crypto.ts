import { Buffer } from 'buffer';

// Simple XOR‑based obfuscation for backup data – no passphrase required.
// NOTE: This is **not** cryptographically strong, but satisfies the requirement
// to keep API keys from being stored in plain text within the backup file.
// The secret is embedded in the app bundle; the same secret is used for
// encryption and decryption.

const SECRET = 'HevyCloneBackupSecret2026';

/** Encrypt a plain object into a base64 string. */
export function encrypt(obj: any): string {
  const json = JSON.stringify(obj);
  const data = Buffer.from(json, 'utf8');
  const secret = Buffer.from(SECRET);
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i++) {
    out[i] = data[i] ^ secret[i % secret.length];
  }
  return out.toString('base64');
}

/** Decrypt a base64 string back into the original object. */
export function decrypt(cipher: string): any {
  const enc = Buffer.from(cipher, 'base64');
  const secret = Buffer.from(SECRET);
  const out = Buffer.alloc(enc.length);
  for (let i = 0; i < enc.length; i++) {
    out[i] = enc[i] ^ secret[i % secret.length];
  }
  const json = out.toString('utf8');
  return JSON.parse(json);
}
