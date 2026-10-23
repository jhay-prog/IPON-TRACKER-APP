import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

// Passwords are never stored. We keep a random salt plus an iterated, salted SHA-256 digest in the
// device keychain/keystore (expo-secure-store).
const K = 'ipon.auth.v1';
const ROUNDS = 2000;
const hex = (b) => Array.from(b).map((x) => x.toString(16).padStart(2, '0')).join('');
const salt = () => hex(Crypto.getRandomBytes(16));
async function derive(secret, s) {
  let h = secret + s;
  for (let i = 0; i < ROUNDS; i++) h = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, h + s + i);
  return h;
}
const norm = (c) => c.toUpperCase().replace(/[^A-Z0-9]/g, '');
const load = async () => { const r = await SecureStore.getItemAsync(K); return r ? JSON.parse(r) : null; };
const save = (r) => SecureStore.setItemAsync(K, JSON.stringify(r));
function newCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const b = Crypto.getRandomBytes(12);
  const c = Array.from(b).map((x) => A[x % A.length]).join('');
  return c.slice(0, 4) + '-' + c.slice(4, 8) + '-' + c.slice(8, 12);
}

export const hasPassword = async () => !!(await load());
export async function createPassword(pw) {
  const code = newCode(); const s = salt(); const rs = salt();
  await save({ s, h: await derive(pw, s), rs, rh: await derive(norm(code), rs) });
  return code; // shown once so the user can write it down
}
export async function verifyPassword(pw) { const r = await load(); return !!r && (await derive(pw, r.s)) === r.h; }
export async function changePassword(oldPw, newPw) {
  if (!(await verifyPassword(oldPw))) return false;
  const r = await load(); const s = salt(); await save({ ...r, s, h: await derive(newPw, s) }); return true;
}
// Recovery resets the password only. Savings data is untouched and never shown during recovery.
export async function resetWithRecovery(code, newPw) {
  const r = await load();
  if (!r || (await derive(norm(code), r.rs)) !== r.rh) return false;
  const s = salt(); await save({ ...r, s, h: await derive(newPw, s) }); return true;
}
export const wipeAuth = () => SecureStore.deleteItemAsync(K);
