/**
 * Database seed — creates initial admin user and test data
 */
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(32).toString('hex')
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) reject(err)
      else resolve(`${salt}:${key.toString('hex')}`)
    })
  })
}

async function main() {
  console.log('Seeding database...')

  // Create global director
  const directorPwd = await hashPassword('signalx-admin-2025!')
  await prisma.adminUser.upsert({
    where:  { email: 'danny@signalx.io' },
    update: {},
    create: {
      email:          'danny@signalx.io',
      name:           '박 대니',
      role:           'GLOBAL_DIRECTOR',
      region:         '글로벌',
      hashedPassword: directorPwd,
      totpEnabled:    false,
      active:         true,
    }
  })

  // Create Korea signal leader
  const leaderPwd = await hashPassword('leader-korea-2025!')
  await prisma.adminUser.upsert({
    where:  { email: 'ji@signalx.io' },
    update: {},
    create: {
      email:          'ji@signalx.io',
      name:           '김지영',
      role:           'SIGNAL_LEADER',
      region:         '아시아',
      country:        '한국',
      hashedPassword: leaderPwd,
      totpEnabled:    false,
      active:         true,
    }
  })

  // Create demo media partners
  await prisma.mediaPartner.upsert({
    where:  { id: 'partner-yonhap' },
    update: {},
    create: {
      id:      'partner-yonhap',
      name:    '연합뉴스',
      type:    'MEDIA',
      country: '한국',
      region:  '아시아',
      active:  true,
      categories: ['POLITICS', 'CORPORATE', 'CRIME'],
    }
  })

  await prisma.mediaPartner.upsert({
    where:  { id: 'partner-reuters' },
    update: {},
    create: {
      id:      'partner-reuters',
      name:    'Reuters',
      type:    'MEDIA',
      country: '글로벌',
      region:  '글로벌',
      active:  true,
      categories: ['POLITICS', 'CORPORATE', 'FINANCE', 'TECHNOLOGY'],
    }
  })

  // Create risk nodes
  const nodes = [
    { name: 'Seoul',     country: '한국',    lat: 37.5,  lon: 127,   riskLevel: 'HIGH' as const,     type: '기업' },
    { name: 'Moscow',    country: '러시아',  lat: 55.7,  lon: 37.6,  riskLevel: 'CRITICAL' as const, type: '지정학' },
    { name: 'Beijing',   country: '중국',    lat: 39.9,  lon: 116.4, riskLevel: 'HIGH' as const,     type: '기업' },
    { name: 'Tokyo',     country: '일본',    lat: 35.7,  lon: 139.7, riskLevel: 'HIGH' as const,     type: '금융' },
    { name: 'Singapore', country: '싱가포르',lat: 1.3,   lon: 103.8, riskLevel: 'HIGH' as const,     type: '기술' },
    { name: 'London',    country: '영국',    lat: 51.5,  lon: -0.1,  riskLevel: 'ELEVATED' as const, type: '금융' },
    { name: 'NewYork',   country: '미국',    lat: 40.7,  lon: -74,   riskLevel: 'STABLE' as const,   type: '기업' },
    { name: 'Dubai',     country: 'UAE',     lat: 25.2,  lon: 55.3,  riskLevel: 'HIGH' as const,     type: '범죄' },
  ]

  for (const node of nodes) {
    await prisma.riskNode.upsert({
      where:  { name: node.name },
      update: { riskLevel: node.riskLevel },
      create: node,
    })
  }

  console.log('✅ Seed complete')
  console.log('Admin: danny@signalx.io / signalx-admin-2025!')
  console.log('Leader: ji@signalx.io / leader-korea-2025!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
