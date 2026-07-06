WITH Welfare Mall V15

실제 운영용 방향으로 정리한 버전입니다.

주요 반영:
- Cloudflare 환경변수 방식 적용
- GitHub에 Supabase URL/Key를 직접 올리지 않음
- build-config.js가 배포 시 config.js 자동 생성
- 기본 이메일 주소를 withm1905@withmedical.com 으로 반영
- 관리자 1명 운영 기준
- 권한 분리 제외
- Supabase 테이블 분리 구조 유지
- Supabase Storage/Edge Function 구조 유지

관리자 로그인:
ID: with1905
PW: withm*1905

배포 순서:
1. Supabase에서 supabase-v15-schema.sql 실행
2. GitHub에 파일 업로드
3. Cloudflare Pages 연결
4. Cloudflare 환경변수에 SUPABASE_URL / SUPABASE_ANON_KEY 입력
5. Redeploy
6. 관리자 로그인 테스트
7. 이메일은 EMAIL_SETUP.md 참고
.
