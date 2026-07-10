# V27.8 배포 순서

1. Supabase → SQL Editor에서 `V27_8_SETUP.sql` 전체 실행
2. Supabase → Project Settings → API Keys에서 `Secret key` 복사
3. Cloudflare Pages → Settings → Variables and secrets → Production에 아래 3개 확인
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SECRET_KEY` : 위 Secret key를 Secret 형식으로 등록
4. 이 압축파일을 GitHub 저장소 루트에 덮어쓰기 업로드
5. Cloudflare 배포 완료 후 브라우저 강력 새로고침
6. 최초 접속 시 기존 `app_state`의 예약·복지·이벤트 내역이 새 테이블로 자동 이전됩니다.

## 필수 시험
- 휴대폰 숙소예약 → PC 관리자에서 운영데이터 새로고침
- 복지신청 사진 1장 → PC 관리자에서 확인 및 출력
- 출력창에서 `출력 완료` → 24시간 후 파일 자동 삭제
- 행사신청 → PC 관리자 확인
- 관리자 삭제 → 새로고침 후 복원되지 않는지 확인
