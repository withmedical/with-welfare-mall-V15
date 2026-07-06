# WITH Welfare Mall V15 실제 운영 세팅

V15 핵심 변경:
- GitHub에 Supabase URL/Key를 직접 넣지 않습니다.
- Cloudflare Pages 환경변수에서 config.js를 자동 생성합니다.
- 기본 이메일 주소는 withm1905@withmedical.com 입니다.
- 관리자 권한 분리는 제외했습니다. 관리자 1명 운영 기준입니다.

## 1. Supabase 세팅

Supabase SQL Editor에서 아래 파일을 실행합니다.

supabase-v15-schema.sql

실행 후 기본 관리자 계정이 생성됩니다.

관리자 ID:
with1905

관리자 PW:
withm*1905

## 2. Supabase API 정보 확인

Supabase → Settings → Data API

복사할 것:
- API URL
- Publishable key

주의:
- Secret key는 절대 사용하지 않습니다.
- Publishable key만 사용합니다.

## 3. GitHub 업로드

이 V15 폴더의 모든 파일을 GitHub repository에 업로드합니다.

필수 파일:
- index.html
- app.js
- style.css
- build-config.js
- package.json
- supabase-v15-schema.sql
- supabase/functions/send-email/index.ts

## 4. Cloudflare Pages 설정

Cloudflare → Workers & Pages → Pages → Connect Git

설정:
Framework preset: None
Build command: npm run build
Build output directory: /

## 5. Cloudflare 환경변수 입력

Cloudflare Pages 프로젝트 → Settings → Environment variables

아래 3개를 추가합니다.

SUPABASE_URL
= Supabase Data API의 API URL

SUPABASE_ANON_KEY
= Supabase API Keys의 Publishable key

SEND_EMAIL_FUNCTION
= send-email

저장 후 Redeploy 합니다.

## 6. 접속 테스트

Cloudflare Pages 주소로 접속합니다.

관리자 로그인:
ID: with1905
PW: withm*1905

## 7. 이메일 발송 설정

EMAIL_SETUP.md 파일을 참고하세요.

핵심:
- Resend API Key 생성
- Supabase Edge Function send-email 배포
- Supabase Secret에 RESEND_API_KEY, FROM_EMAIL 입력

기본 이메일:
withm1905@withmedical.com
