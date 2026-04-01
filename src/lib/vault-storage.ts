/**
 * Dev-mode vault file storage
 * Production: replace with air-gapped DB or HSM
 */

import fs   from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

const VAULT_DIR     = process.env.VAULT_DIR || '/tmp/signalx-vault'
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!

// Encrypt with AES-256-GCM before writing to disk
export async function writeVaultFile(signalId: string, content: string): Promise<void> {
  await fs.mkdir(VAULT_DIR, { recursive: true })

  const key     = Buffer.from(ENCRYPTION_KEY, 'hex')
  const iv      = crypto.randomBytes(12)
  const cipher  = crypto.createCipheriv('aes-256-gcm', key, iv)

  let encrypted = cipher.update(content, 'utf8', 'base64')
  encrypted    += cipher.final('base64')
  const authTag = cipher.getAuthTag()

  const stored = JSON.stringify({
    iv:         iv.toString('base64'),
    authTag:    authTag.toString('base64'),
    ciphertext: encrypted,
  })

  // Use hashed filename — never store signalId directly
  const filename = crypto
    .createHash('sha256')
    .update(signalId + (ENCRYPTION_KEY || 'dev'))
    .digest('hex')
    .slice(0, 32) + '.vault'

  await fs.writeFile(path.join(VAULT_DIR, filename), stored, 'utf8')
}

export async function readVaultFile(signalId: string): Promise<string | null> {
  try {
    const filename = crypto
      .createHash('sha256')
      .update(signalId + (ENCRYPTION_KEY || 'dev'))
      .digest('hex')
      .slice(0, 32) + '.vault'

    const raw     = await fs.readFile(path.join(VAULT_DIR, filename), 'utf8')
    const stored  = JSON.parse(raw)
    const key     = Buffer.from(ENCRYPTION_KEY, 'hex')
    const iv      = Buffer.from(stored.iv, 'base64')
    const authTag = Buffer.from(stored.authTag, 'base64')
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(stored.ciphertext, 'base64', 'utf8')
    decrypted    += decipher.final('utf8')
    return decrypted
  } catch {
    return null
  }
}
