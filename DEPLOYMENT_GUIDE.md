# WITH Welfare Mall V16 Final 설치 방법

이 버전은 V12/V13의 기능을 유지하면서 Cloudflare + Supabase 운영을 안정화한 최종 운영형입니다.

## 1. Supabase SQL
Supabase SQL Editor에서 실행:
supabase-v16-final-schema.sql

## 2. GitHub 덮어쓰기
GitHub 저장소 `withmedical/with-welfare-mall-V15`에 이 폴더의 파일을 모두 업로드합니다.
기존 파일과 이름이 같으면 자동으로 덮어쓰기됩니다.

## 3. Cloudflare 설정
Build command:
npm run build

Build output directory:
/

환경변수:
SUPABASE_URL = https://프로젝트ID.supabase.co
SUPABASE_ANON_KEY = sb_publishable_... 값
SEND_EMAIL_FUNCTION = send-email

주의:
SUPABASE_URL에는 /rest/v1/을 넣지 않습니다.
그래도 V16은 자동으로 제거합니다.

## 4. 배포
GitHub Commit 후 Cloudflare가 자동 배포합니다.

## 5. 로그인
관리자 ID:
with1905

관리자 PW:
withm*1905

## 6. 확인
관리자 페이지 상단의 '운영 연결 상태'에서 Supabase 연결 여부를 확인하세요.


## V16.1 모바일 확인 방법
배포 후 휴대폰에서 `https://with-welfare.pages.dev` 접속하세요.
하단에 홈/숙소/경조사/휴가/관리 메뉴가 보이면 정상입니다.

관리자는 모바일에서 관리자 페이지를 열면 메뉴가 가로 스크롤 형태로 표시됩니다.
