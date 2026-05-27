const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { getOne, run } = require('../utils/queryHelpers');
const { secret } = require('../config/jwt');
const { sendResetCode } = require('./emailService');

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buf) {
  let bits = 0, value = 0, out = '';
  for (const b of buf) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(str) {
  const cleaned = str.replace(/=+$/, '').toUpperCase();
  const bytes = [];
  let bits = 0, value = 0;
  for (const ch of cleaned) {
    const idx = BASE32.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function generateTOTP(secret, timestamp) {
  const key = base32Decode(secret);
  const time = Math.floor((timestamp || Date.now()) / 30000);
  const timeBuf = Buffer.alloc(8);
  timeBuf.writeBigInt64BE(BigInt(time));
  const hmac = crypto.createHmac('sha1', key).update(timeBuf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff);
  return String(code % 1000000).padStart(6, '0');
}

function verifyTOTP(token, secret, window = 1) {
  const now = Date.now();
  for (let i = -window; i <= window; i++) {
    if (generateTOTP(secret, now + i * 30000) === token) return true;
  }
  return false;
}

function generateURI(secret, account, issuer) {
  const enc = (s) => encodeURIComponent(s);
  return `otpauth://totp/${enc(issuer)}:${enc(account)}?secret=${secret}&issuer=${enc(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

function generateSecret() {
  return base32Encode(crypto.randomBytes(20));
}

async function getOrCreate2FA(userId) {
  let record = await getOne('SELECT * FROM user_2fa WHERE user_id = $1', [userId]);
  if (!record) {
    await run(
      `INSERT INTO user_2fa (user_id, methods, backup_codes) VALUES ($1, $2, $3)`,
      [userId, [], '[]']
    );
    record = await getOne('SELECT * FROM user_2fa WHERE user_id = $1', [userId]);
  }
  return record;
}

async function get2FAStatus(userId) {
  const record = await getOrCreate2FA(userId);
  return {
    enabled: record.methods && record.methods.length > 0,
    methods: record.methods || [],
    totpVerified: record.totp_verified,
    emailVerified: record.email_verified
  };
}

async function setupTOTP(userId, email) {
  const totpSecret = generateSecret();
  const otpauth = generateURI(totpSecret, email, 'Gestor Financeiro');
  await run('UPDATE user_2fa SET totp_secret = $1, totp_verified = FALSE WHERE user_id = $2', [totpSecret, userId]);
  return { secret: totpSecret, otpauth };
}

async function verifyAndEnableTOTP(userId, code) {
  const record = await getOne('SELECT * FROM user_2fa WHERE user_id = $1', [userId]);
  if (!record || !record.totp_secret) throw new Error('Configure TOTP primeiro.');
  if (!verifyTOTP(code, record.totp_secret)) throw new Error('Código inválido.');
  let methods = record.methods || [];
  if (!methods.includes('totp')) methods.push('totp');
  const backupCodes = generateBackupCodes();
  await run(
    `UPDATE user_2fa SET methods = $1, totp_verified = TRUE, backup_codes = $2 WHERE user_id = $3`,
    [methods, JSON.stringify(backupCodes), userId]
  );
  return { methods, backupCodes };
}

async function setupEmail(userId) {
  const user = await getOne('SELECT email FROM usuarios WHERE id = $1', [userId]);
  if (!user) throw new Error('Usuário não encontrado.');
  const code = crypto.randomInt(100000, 999999).toString();
  const expires = new Date(Date.now() + 15 * 60 * 1000);
  await run(
    `UPDATE user_2fa SET email_code = $1, email_code_expires = $2, email_verified = FALSE WHERE user_id = $3`,
    [code, expires, userId]
  );
  return sendResetCode(user.email, code);
}

async function verifyAndEnableEmail(userId, code) {
  const record = await getOne('SELECT * FROM user_2fa WHERE user_id = $1', [userId]);
  if (!record || !record.email_code) throw new Error('Solicite um código primeiro.');
  if (record.email_code !== code) throw new Error('Código inválido.');
  if (new Date(record.email_code_expires) < new Date()) throw new Error('Código expirado. Solicite um novo.');
  let methods = record.methods || [];
  if (!methods.includes('email')) methods.push('email');
  const backupCodes = generateBackupCodes();
  await run(
    `UPDATE user_2fa SET methods = $1, email_verified = TRUE, email_code = NULL, email_code_expires = NULL, backup_codes = $2 WHERE user_id = $3`,
    [methods, JSON.stringify(backupCodes), userId]
  );
  return { methods, backupCodes };
}

function generateBackupCodes() {
  const codes = [];
  for (let i = 0; i < 8; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
}

function generateTempToken(userId) {
  return jwt.sign({ id: userId, purpose: '2fa' }, secret, { expiresIn: '5m' });
}

async function has2FA(userId) {
  const record = await getOne('SELECT methods FROM user_2fa WHERE user_id = $1', [userId]);
  return record && record.methods && record.methods.length > 0;
}

async function sendLoginEmailCode(userId) {
  const user = await getOne('SELECT email FROM usuarios WHERE id = $1', [userId]);
  if (!user) throw new Error('Usuário não encontrado.');
  const code = crypto.randomInt(100000, 999999).toString();
  const expires = new Date(Date.now() + 5 * 60 * 1000);
  await run(
    `UPDATE user_2fa SET email_login_code = $1, email_login_expires = $2 WHERE user_id = $3`,
    [code, expires, userId]
  );
  return sendResetCode(user.email, code);
}

async function verifyLogin2FA(tempToken, code, method) {
  let decoded;
  try { decoded = jwt.verify(tempToken, secret); }
  catch { throw new Error('Sessão expirada. Faça login novamente.'); }
  if (decoded.purpose !== '2fa') throw new Error('Token inválido.');
  const userId = decoded.id;
  const record = await getOne('SELECT * FROM user_2fa WHERE user_id = $1', [userId]);
  if (!record || !record.methods || !record.methods.includes(method)) {
    throw new Error('Método de verificação não configurado.');
  }
  let valid = false;
  if (method === 'totp') {
    valid = verifyTOTP(code, record.totp_secret);
  } else if (method === 'email') {
    valid = record.email_login_code === code && new Date(record.email_login_expires) > new Date();
    if (valid) await run('UPDATE user_2fa SET email_login_code = NULL, email_login_expires = NULL WHERE user_id = $1', [userId]);
  } else if (method === 'backup') {
    const backupCodes = JSON.parse(record.backup_codes || '[]');
    const idx = backupCodes.indexOf(code);
    if (idx !== -1) {
      valid = true;
      backupCodes.splice(idx, 1);
      await run('UPDATE user_2fa SET backup_codes = $1 WHERE user_id = $2', [JSON.stringify(backupCodes), userId]);
    }
  }
  if (!valid) throw new Error('Código inválido.');
  return getOne('SELECT id, nome, sobrenome, email FROM usuarios WHERE id = $1', [userId]);
}

async function generateTrustToken(userId, days = 30) {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  await run(
    'UPDATE user_2fa SET trust_token = $1, trust_expires = $2 WHERE user_id = $3',
    [hash, expires, userId]
  );
  return token;
}

async function verifyTrustToken(userId, token) {
  if (!token) return false;
  const record = await getOne('SELECT trust_token, trust_expires FROM user_2fa WHERE user_id = $1', [userId]);
  if (!record || !record.trust_token) return false;
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  if (record.trust_token !== hash) return false;
  if (new Date(record.trust_expires) < new Date()) return false;
  return true;
}

async function disable2FA(userId) {
  await run(
    `UPDATE user_2fa SET methods = '{}', totp_secret = NULL, totp_verified = FALSE, email_verified = FALSE, email_code = NULL, email_code_expires = NULL, email_login_code = NULL, email_login_expires = NULL, backup_codes = '[]', trust_token = NULL, trust_expires = NULL WHERE user_id = $1`,
    [userId]
  );
  return { message: '2FA desativado com sucesso.' };
}

module.exports = {
  get2FAStatus, setupTOTP, verifyAndEnableTOTP,
  setupEmail, verifyAndEnableEmail,
  has2FA, generateTempToken,
  sendLoginEmailCode, verifyLogin2FA, disable2FA,
  generateTrustToken, verifyTrustToken
};
