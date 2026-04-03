/**
 * Import SignalX_Korea_Reporters_DB.xlsx → Reporter table
 * Run: DATABASE_URL=<railway_url> npx tsx prisma/import-reporters.ts
 */
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'
import path from 'path'

const prisma = new PrismaClient()

// 한국어 분야 → Prisma Category enum 매핑
const CATEGORY_MAP: Record<string, string> = {
  '정치':   'POLITICS',
  '기업':   'CORPORATE',
  '금융':   'FINANCE',
  '재정':   'FINANCE',
  '기술':   'TECHNOLOGY',
  'IT':     'TECHNOLOGY',
  '사회':   'SOCIAL',
  '범죄':   'CRIME',
}

function mapCategories(raw: string | null | undefined): string[] {
  if (!raw) return []
  return raw.split(/[,，、]/).map(s => s.trim())
    .map(s => CATEGORY_MAP[s])
    .filter(Boolean)
}

async function main() {
  const filePath = path.resolve(__dirname, '../../디비/SignalX_Korea_Reporters_DB.xlsx')
  console.log('📂 파일 읽는 중:', filePath)

  const wb = XLSX.readFile(filePath)
  const ws = wb.Sheets['기자 DB (전체)']
  if (!ws) throw new Error('시트 "기자 DB (전체)" 를 찾을 수 없습니다')

  // 2번째 행이 헤더, 3번째 행부터 데이터
  const rows = XLSX.utils.sheet_to_json<{
    '#': number
    '언론사': string
    '유형': string
    '기자명': string
    '부서': string
    '직책': string
    '이메일': string
    '선호 분야 (배포 매칭용)': string
    '이메일 확인여부': string
    '등록일': string
    '메모': string
  }>(ws, { range: 1 }) // range:1 → 2번째 행을 헤더로 사용

  console.log(`📋 총 ${rows.length}명 처리 시작...`)

  let created = 0
  let skipped = 0

  for (const row of rows) {
    const email = row['이메일']?.trim()
    if (!email) { skipped++; continue }

    const categories = mapCategories(row['선호 분야 (배포 매칭용)'])
    const isVerified = row['이메일 확인여부'] === '확인'

    try {
      await prisma.reporter.upsert({
        where: { email },
        update: {
          name:                row['기자명'],
          organization:        row['언론사'],
          department:          row['부서'] || null,
          title:               row['직책'] || null,
          country:             '한국',
          preferredCategories: categories,
          preferredLanguages:  ['ko'],
          verified:            isVerified,
          active:              true,
          notes:               row['메모'] || null,
          tags:                [row['유형']].filter(Boolean),
        },
        create: {
          email,
          name:                row['기자명'],
          organization:        row['언론사'],
          department:          row['부서'] || null,
          title:               row['직책'] || null,
          country:             '한국',
          preferredCategories: categories,
          preferredLanguages:  ['ko'],
          verified:            isVerified,
          active:              true,
          notes:               row['메모'] || null,
          tags:                [row['유형']].filter(Boolean),
        },
      })
      created++
      if (created % 50 === 0) console.log(`  → ${created}명 완료...`)
    } catch (e: any) {
      console.warn(`  ⚠️  스킵 (${email}):`, e.message)
      skipped++
    }
  }

  console.log(`\n✅ 완료: ${created}명 등록, ${skipped}명 스킵`)
}

main()
  .catch(e => { console.error('❌ 오류:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
