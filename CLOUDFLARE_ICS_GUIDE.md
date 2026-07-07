# Cloudflare 실시간 ICS 사용 안내

## 목적
복지몰 예약을 Google Calendar / Airbnb에서 읽을 수 있는 고정 ICS 주소로 제공합니다.

## 자동 생성되는 주소
Cloudflare Pages 배포 주소가 `https://withmedical.pages.dev`라면:

- 스텔라동: `https://withmedical.pages.dev/calendar/stella.ics`
- 솔레동: `https://withmedical.pages.dev/calendar/solar.ics`
- 전체 숙소: `https://withmedical.pages.dev/calendar/all.ics`

## 네가 해야 할 일
1. 이 파일 전체를 GitHub에 업로드합니다.
2. Cloudflare Pages가 자동 배포되는지 확인합니다.
3. Cloudflare Pages > Settings > Environment variables에 아래 2개를 등록합니다.
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. 복지몰 관리자 > 숙소관리 > 복지몰 예약 캘린더 내보내기에서 주소 복사 버튼을 눌러 Google/Airbnb에 등록합니다.

## 유지 원칙
기존 localStorage 데이터와 기존 기능은 삭제하지 않았습니다. Supabase가 연결되지 않으면 기존처럼 로컬 테스트 모드로 동작합니다.
