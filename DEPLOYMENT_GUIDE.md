V17 배포 방법

1. Supabase SQL Editor에서 supabase-v17-final-schema.sql 실행
2. GitHub 저장소에 V17 파일 전체 덮어쓰기
3. Cloudflare 환경변수 유지
   SUPABASE_URL = https://프로젝트ID.supabase.co
   SUPABASE_ANON_KEY = sb_publishable...
4. Build command = npm run build
5. Build output directory = /
6. Commit 후 Cloudflare 자동 배포
