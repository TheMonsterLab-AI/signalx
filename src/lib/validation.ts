import type { SubmitSignalRequest } from '@/types'

const VALID_CATEGORIES = ['POLITICS', 'CORPORATE', 'FINANCE', 'TECHNOLOGY', 'SOCIAL', 'CRIME']

interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateSubmission(body: SubmitSignalRequest): ValidationResult {
  if (!body.category || !VALID_CATEGORIES.includes(body.category)) {
    return { valid: false, error: '올바른 카테고리를 선택하세요.' }
  }
  
  if (!body.country?.trim() || body.country.trim().length < 2) {
    return { valid: false, error: '국가/지역을 입력하세요.' }
  }
  if (body.country.trim().length > 100) {
    return { valid: false, error: '국가/지역 입력이 너무 깁니다.' }
  }
  
  if (!body.title?.trim() || body.title.trim().length < 5) {
    return { valid: false, error: '제목을 5자 이상 입력하세요.' }
  }
  if (body.title.trim().length > 300) {
    return { valid: false, error: '제목은 300자 이하로 입력하세요.' }
  }
  
  if (!body.content?.trim() || body.content.trim().length < 20) {
    return { valid: false, error: '내용을 20자 이상 입력하세요.' }
  }
  if (body.content.trim().length > 50000) {
    return { valid: false, error: '내용은 50,000자 이하로 입력하세요.' }
  }
  
  return { valid: true }
}

export function validateToken(token: string): ValidationResult {
  if (!token) return { valid: false, error: '토큰을 입력하세요.' }
  if (!/^SX-[A-Z2-9]{7}$/.test(token.toUpperCase())) {
    return { valid: false, error: '올바른 토큰 형식이 아닙니다. (예: SX-AB3XY7K)' }
  }
  return { valid: true }
}

export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}
