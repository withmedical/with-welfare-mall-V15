# WITH Welfare Mall V15.3 Stable 배포 방법

이번 V15.3은 V12/V13에서 잘 되던 기능을 다시 살린 안정판입니다.

핵심:
- 숙소는 스텔라동/솔라동 2개만 기본 표시
- 로고 변경 가능
- 회원 관리 가능
- 관리자 메뉴 유지
- Supabase 연결은 app_state 방식으로 안정화
- SUPABASE_URL에 /rest/v1/을 잘못 넣어도 자동으로 제거

## 1. Supabase SQL 실행

Supabase SQL Editor에서 아래 파일을 실행하세요.

supabase-v15-3-stable-schema.sql

## 2. Cloudflare 환경변수

Cloudflare Pages > Settings > Variables and secrets

SUPABASE_URL
값 예시:
https://sayflhlkrhbkhlgzsynz.supabase.co

SUPABASE_ANON_KEY
값:
sb_publishable_... 로 시작하는 Publishable key

SEND_EMAIL_FUNCTION
값:
send-email

## 3. Build configuration

Build command:
npm run build

Build output directory:
/

## 4. 배포

GitHub에 파일을 업로드하거나 수정 후 Commit하면 Cloudflare가 자동 배포합니다.

## 5. 관리자 로그인

ID:
with1905

PW:
withm*1905
