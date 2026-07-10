# WITH Welfare Mall V27.8
## 서버 중심 저장구조 안정화

- 예약, 복지신청, 이벤트 신청을 전용 Supabase 테이블로 분리
- 브라우저 localStorage를 운영 원본에서 제외
- Cloudflare Pages Functions를 통한 동일 출처 서버 저장
- 모든 신청에 확인 → 신청 중 → 완료/실패 절차 적용
- 중복 클릭 방지
- 복지 증빙자료를 Supabase Storage에 저장
- 관리자가 출력 완료 처리하면 24시간 후 첨부파일 자동 삭제
- 관리자 새로고침 시 서버 원본을 다시 조회
- 삭제 데이터가 이전 app_state에서 복원되는 문제 차단
- 기존 app_state 데이터는 최초 실행 시 신규 테이블로 자동 이전 시도

## 배포 전 필수
1. Supabase SQL Editor에서 V27_8_SETUP.sql 실행
2. Cloudflare Production Variables에 아래 값 확인
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY 또는 SUPABASE_SECRET_KEY (첨부파일용, Secret으로 등록)
3. GitHub 업로드 후 Cloudflare 재배포
