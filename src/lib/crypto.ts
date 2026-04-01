/**
 * SignalX — Core Cryptographic Utilities
 * 
 * All anonymity and encryption guarantees live here.
 * Never log or store raw tokens, IPs, or personal data.
 */

import crypto from 'crypto'

// ─── Environment ────────────────────────────────────────────────────────────
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY! // 32 bytes hex
const HMAC_SECRET    = process.env.HMAC_SECRET!     // 64 bytes hex
const TOKEN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I confusion

// ─── Tracking Token ─────────────────────────────────────────────────────────

/**
 * Generate a 7-character anonymous tracking token.
 * Format: SX-XXXXXXX (e.g. SX-AB3XY7K)
 * Cryptographically random, not sequential.
 */
export function generateTrackingToken(): string {
  const bytes = crypto.randomBytes(7)
  let token = ''
  for (let i = 0; i < 7; i++) {
    token += TOKEN_ALPHABET[bytes[i] % TOKEN_ALPHABET.length]
  }
  return `SX-${token}`
}

/**
 * Validate token format without revealing existence.
 */
export function isValidTokenFormat(token: string): boolean {
  return /^SX-[A-Z2-9]{7}$/.test(token.toUpperCase())
}

// ─── AES-256-GCM Encryption ─────────────────────────────────────────────────

interface EncryptedData {
  iv: string        // base64
  authTag: string   // base64
  ciphertext: string // base64
}

/**
 * Encrypt sensitive data with AES-256-GCM.
 * Used for: signal content, file paths, admin credentials.
 */
export function encrypt(plaintext: string): EncryptedData {
  const key = Buffer.from(ENCRYPTION_KEY, 'hex')
  const iv = crypto.randomBytes(12)  // 96-bit IV for GCM
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  
  let ciphertext = cipher.update(plaintext, 'utf8', 'base64')
  ciphertext += cipher.final('base64')
  
  const authTag = cipher.getAuthTag()
  
  return {
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    ciphertext,
  }
}

export function decrypt(data: EncryptedData): string {
  const key = Buffer.from(ENCRYPTION_KEY, 'hex')
  const iv = Buffer.from(data.iv, 'base64')
  const authTag = Buffer.from(data.authTag, 'base64')
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  
  let plaintext = decipher.update(data.ciphertext, 'base64', 'utf8')
  plaintext += decipher.final('utf8')
  
  return plaintext
}

/**
 * Serialize encrypted data to a single string for storage.
 */
export function encryptToString(plaintext: string): string {
  const data = encrypt(plaintext)
  return `${data.iv}:${data.authTag}:${data.ciphertext}`
}

export function decryptFromString(stored: string): string {
  const [iv, authTag, ciphertext] = stored.split(':')
  return decrypt({ iv, authTag, ciphertext })
}

// ─── IP Anonymization ─────────────────────────────────────────────────────────

/**
 * One-way hash of IP address for audit logs.
 * We NEVER store raw IPs — only HMAC-SHA256 hashes.
 */
export function hashIP(ip: string): string {
  return crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(ip + ':ip')
    .digest('hex')
    .slice(0, 16) // truncate for storage
}

/**
 * Extract and anonymize IP from request headers.
 * Handles Cloudflare, nginx, and direct connections.
 */
export function getAnonymizedIP(headers: Headers): string {
  const raw = 
    headers.get('cf-connecting-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  
  return hashIP(raw)
}

// ─── Password Hashing ─────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  // Use scrypt (more memory-hard than bcrypt)
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(32).toString('hex')
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) reject(err)
      else resolve(`${salt}:${key.toString('hex')}`)
    })
  })
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, hash] = stored.split(':')
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) reject(err)
      else resolve(key.toString('hex') === hash)
    })
  })
}

// ─── Session Tokens ──────────────────────────────────────────────────────────

export function generateSessionToken(): string {
  return crypto.randomBytes(48).toString('base64url')
}

export function hashSessionToken(token: string): string {
  return crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(token)
    .digest('hex')
}

// ─── TOTP (2FA) ──────────────────────────────────────────────────────────────

export function generateTOTPSecret(): string {
  return crypto.randomBytes(20).toString('base64')
}

/**
 * Verify a 6-digit TOTP code (±1 window for clock drift).
 * In production, use the 'otpauth' or 'speakeasy' library.
 */
export function verifyTOTP(secret: string, code: string): boolean {
  // TODO: integrate otpauth library for production
  // Stub for now — always passes in dev
  if (process.env.NODE_ENV === 'development') return true
  throw new Error('TOTP library not configured for production')
}

// ─── EXIF Stripping ──────────────────────────────────────────────────────────

/**
 * Strip EXIF and metadata from uploaded files.
 * In production: use 'exifr' + 'sharp' for images, 'pdf-lib' for PDFs.
 * This is the interface — implementations in /lib/files.ts
 */
export interface ExifStrippingResult {
  success: boolean
  originalBytes: number
  strippedBytes: number
  fieldsRemoved: string[]
}

// ─── File Name Hashing ────────────────────────────────────────────────────────

/**
 * Generate an anonymous storage path for uploaded files.
 * Never store original filenames.
 */
export function generateStoragePath(signalId: string, index: number, ext: string): string {
  const hash = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(`${signalId}:${index}:${Date.now()}`)
    .digest('hex')
    .slice(0, 24)
  
  return `signals/${hash.slice(0, 2)}/${hash.slice(2, 4)}/${hash}.${ext}`
}
