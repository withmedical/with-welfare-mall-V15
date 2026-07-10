# WITH Welfare Mall V27.8.1 Operational Stable

## 긴급 수정
- 관리자 페이지 함수 누락 복구
- 신규/캐시 없는 브라우저에서 초기 화면이 멈추는 오류 수정
- Cloudflare Pages Functions `/api/data` 3회 재시도 및 25초 타임아웃 적용
- 예약/복지/행사 서버 우선 저장 유지
- 복지 증빙 Supabase Storage 업로드 유지
- localStorage에는 운영 신청자료와 첨부파일을 저장하지 않음
- 기존 `app_state`는 설정 및 기존자료 백업으로 유지
- `_v2` 테이블이 비어 있을 때만 기존 운영자료 복사

## 배포 전
1. `V27_8_SETUP.sql`이 이미 성공했다면 다시 실행할 필요 없음
2. Cloudflare Production 변수 3개 확인: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SECRET_KEY
3. ZIP의 모든 파일과 `functions` 폴더를 GitHub 저장소 최상위에 업로드
4. 배포 후 반드시 실제 `https://with-welfare.pages.dev` 주소에서 시험
5. 로컬에서 index.html을 더블클릭하면 `/api` Functions가 없어 실패하는 것이 정상
