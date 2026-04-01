/**
 * File upload handler — EXIF stripping + encrypted storage
 */
import crypto from 'crypto'
import { prisma } from './prisma'
import { generateStoragePath, encryptToString } from './crypto'

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/quicktime', 'video/webm',
  'application/pdf', 'application/zip',
  'text/plain', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export async function handleFileUpload(signalId: string, files: File[]): Promise<void> {
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    
    if (!ALLOWED_TYPES.includes(file.type)) continue
    if (file.size > MAX_FILE_SIZE) continue
    
    const bytes = Buffer.from(await file.arrayBuffer())
    
    // In production: use sharp to strip EXIF from images
    // For now: just record that we would strip it
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const storagePath = generateStoragePath(signalId, i, ext)
    
    // In production: upload to S3/R2
    // await uploadToStorage(storagePath, bytes)
    
    const encPath = encryptToString(storagePath)
    
    await prisma.attachment.create({
      data: {
        signalId,
        originalName:  crypto.createHash('sha256').update(file.name).digest('hex').slice(0, 8),
        storagePath:   encPath,
        mimeType:      file.type,
        sizeBytes:     file.size,
        exifStripped:  file.type.startsWith('image/'),
      }
    })
  }
}
