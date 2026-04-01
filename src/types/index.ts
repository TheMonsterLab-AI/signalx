// SignalX Platform — Core Type Definitions
// These mirror the Prisma schema but are used throughout the app

export type Category = 'POLITICS' | 'CORPORATE' | 'FINANCE' | 'TECHNOLOGY' | 'SOCIAL' | 'CRIME'

export type SignalStage =
  | 'SUBMITTED'
  | 'LEADER_REVIEW'
  | 'ANN_PROCESSING'
  | 'VERIFICATION_COMPLETE'
  | 'DISTRIBUTION_IN_PROGRESS'
  | 'DISTRIBUTION_COMPLETE'

export type SignalStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'VERIFIED'
  | 'LIKELY_TRUE'
  | 'UNDER_REVIEW'
  | 'UNVERIFIED'
  | 'LIKELY_FALSE'
  | 'REJECTED'

export type AnnGrade = 'VERIFIED' | 'LIKELY_TRUE' | 'UNDER_REVIEW' | 'UNVERIFIED' | 'LIKELY_FALSE'

export type AdminRole =
  | 'GLOBAL_DIRECTOR'
  | 'REGIONAL_LEAD'
  | 'SIGNAL_LEADER'
  | 'ANALYST'
  | 'MEDIA_PARTNER'

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'MONITOR' | 'STABLE'

// ─── API Request/Response Types ────────────────────────────────────────────

export interface SubmitSignalRequest {
  category: Category
  country: string
  title: string
  content: string
  // files handled separately via multipart
}

export interface SubmitSignalResponse {
  success: boolean
  trackingToken: string  // e.g. "SX-AB3XY7K"
  submittedAt: string
  message: string
}

export interface TrackSignalRequest {
  token: string
}

export interface TrackSignalResponse {
  found: boolean
  signal?: {
    id: string
    trackingToken: string
    title: string
    category: Category
    country: string
    stage: SignalStage
    status: SignalStatus
    submittedAt: string
    updatedAt: string
    stageHistory: StageHistoryItem[]
    annScore?: number
    annGrade?: AnnGrade
    hasReport: boolean
    distributed: boolean
    distributedAt?: string
  }
}

export interface StageHistoryItem {
  stage: SignalStage
  note?: string
  timestamp: string
}

// ─── ANN Types ──────────────────────────────────────────────────────────────

export interface AnnStep1Result {
  score: number
  submitterHistory: 'NEW' | 'TRUSTED' | 'FLAGGED'
  documentAuthenticity: boolean
  notes: string
}

export interface AnnStep2Result {
  gpt: AiModelResult
  claude: AiModelResult
  gemini: AiModelResult
  llama: AiModelResult
  average: number
  consensus: AnnGrade
}

export interface AiModelResult {
  model: string
  score: number
  grade: AnnGrade
  reasoning: string
  flags: string[]
}

export interface AnnStep3Result {
  sourcesChecked: number
  matches: number
  mismatches: number
  databases: string[]
  verdict: string
}

export interface AnnStep4Result {
  filesAnalyzed: number
  deepfakeDetected: boolean
  exifCleaned: boolean
  manipulationScore: number
  verdict: string
}

export interface AnnStep5Result {
  filesAnalyzed: number
  deepfakeDetected: boolean
  inconsistenciesFound: boolean
  verdict: string
}

export interface AnnStep6Result {
  anomalyScore: number
  relatedSignals: number
  organizationalFlag: boolean
  patterns: string[]
}

export interface AnnStep7Result {
  score: number
  grade: AnnGrade
  recommendation: string
  distributionTargets: number
}

export interface AnnVerificationResult {
  step1: AnnStep1Result
  step2: AnnStep2Result
  step3: AnnStep3Result
  step4: AnnStep4Result
  step5: AnnStep5Result
  step6: AnnStep6Result
  step7: AnnStep7Result
  finalScore: number
  finalGrade: AnnGrade
  processingMs: number
}

// ─── Admin Types ─────────────────────────────────────────────────────────────

export interface AdminLoginRequest {
  identifier: string  // admin ID format: SNX-XXXX
  password: string
  totpCode?: string
}

export interface AdminLoginResponse {
  success: boolean
  requiresTOTP?: boolean
  sessionToken?: string
  user?: AdminUserPublic
  error?: string
}

export interface AdminUserPublic {
  id: string
  name: string
  email: string
  role: AdminRole
  region?: string
}

// ─── Dashboard Types ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalSignals: number
  todaySignals: number
  verifiedRate: number
  pendingCount: number
  inProcessCount: number
  distributedCount: number
  riskHotspots: number
  annEngineStatus: 'ACTIVE' | 'DEGRADED' | 'OFFLINE'
  annLatencyMs: number
}

export interface SignalFeedItem {
  id: string
  trackingToken: string
  title: string
  category: Category
  country: string
  stage: SignalStage
  status: SignalStatus
  annScore?: number
  submittedAt: string
  updatedAt: string
}

// ─── Display Helpers ─────────────────────────────────────────────────────────

export const STAGE_LABELS: Record<SignalStage, string> = {
  SUBMITTED: '접수 완료',
  LEADER_REVIEW: '리더 검토 중',
  ANN_PROCESSING: 'ANN 검증 중',
  VERIFICATION_COMPLETE: '검증 완료',
  DISTRIBUTION_IN_PROGRESS: '배포 진행 중',
  DISTRIBUTION_COMPLETE: '배포 완료',
}

export const STAGE_ORDER: SignalStage[] = [
  'SUBMITTED',
  'LEADER_REVIEW',
  'ANN_PROCESSING',
  'VERIFICATION_COMPLETE',
  'DISTRIBUTION_IN_PROGRESS',
  'DISTRIBUTION_COMPLETE',
]

export const STATUS_LABELS: Record<SignalStatus, string> = {
  PENDING: '대기 중',
  IN_PROGRESS: '처리 중',
  VERIFIED: '검증 완료',
  LIKELY_TRUE: '사실 가능성 높음',
  UNDER_REVIEW: '검토 중',
  UNVERIFIED: '미검증',
  LIKELY_FALSE: '거짓 가능성 높음',
  REJECTED: '거부됨',
}

export const CATEGORY_LABELS: Record<Category, string> = {
  POLITICS: '정치',
  CORPORATE: '기업',
  FINANCE: '금융',
  TECHNOLOGY: '기술',
  SOCIAL: '사회',
  CRIME: '범죄',
}

export const ANN_GRADE_LABELS: Record<AnnGrade, string> = {
  VERIFIED: '검증 완료',
  LIKELY_TRUE: '사실 가능성 높음',
  UNDER_REVIEW: '검토 중',
  UNVERIFIED: '미검증',
  LIKELY_FALSE: '거짓 가능성 높음',
}

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  CRITICAL: '위급',
  HIGH: '고위험',
  ELEVATED: '주의',
  MONITOR: '모니터링',
  STABLE: '안정',
}
