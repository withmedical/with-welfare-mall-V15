# WITH Welfare Mall V27.6 RC

## 목적
아이폰 Safari/카카오 인앱 브라우저 환경에서 신청 데이터가 로컬에만 남고 관리자 화면에 반영되지 않는 문제를 우선 대응하기 위한 Release Candidate입니다.

## 긴급 수정
- Cloudflare 환경변수 기반 Supabase 설정을 클라이언트가 `/config`에서 읽도록 보강
- 운영 도메인에서 Supabase 연결 실패 시 신청/가입 저장을 중단하여 데이터 유실 방지
- 복지신청/이벤트/예약 등 주요 신청은 Supabase 저장 성공 후 완료 처리
- 직원 회원가입/일반고객 회원가입도 Supabase 저장 성공 후 완료 처리
- 카카오 인앱 브라우저 접속 시 Safari 열기 안내 표시
- PWA 서비스워커 등록 버전 갱신

## 테스트 권장
1. iPhone Safari 로그인
2. iPhone Safari 복지신청 → 관리자 복지신청 관리 표시 확인
3. iPhone 카카오 인앱 브라우저 접속 시 안내 표시 확인
4. 갤럭시/PC 기존 기능 영향 확인
5. Cloudflare `/config` 접속 시 JSON 출력 확인

## 기존 기능/자료
기존 기능과 기존 데이터 구조는 유지합니다.
