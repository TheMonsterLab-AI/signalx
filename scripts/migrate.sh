#!/bin/bash
# Railway 배포 시 자동 실행되는 마이그레이션 스크립트
# railway.toml 의 buildCommand 에서 호출

set -e

echo "▶ Prisma 마이그레이션 시작..."
npx prisma migrate deploy

echo "▶ Prisma 클라이언트 생성..."
npx prisma generate

echo "✅ DB 마이그레이션 완료"
