# WITH Welfare Mall V28.0 Production

## Base
- V27.8.1 Operational Stable 원본은 수정하지 않고 별도 복사본에서 개발.
- 기존 localStorage 키, Supabase 구조, 예약/복지/행사/관리자 데이터를 유지.

## 반영 내용
- 브랜드명 `사계펜션` → `스페이스 농농` 전역 변경.
- 기존 체크인/체크아웃 날짜 입력 유지 + 객실별 Range Calendar 추가.
- 달력 상태: 예약 가능, 예약 완료, 승인 대기, 운영 중지.
- 직원/일반회원 로그인 화면 비밀번호 초기화 추가.
- 임시 비밀번호 발급, 알림톡 발송, 최초 로그인 후 비밀번호 변경 강제.
- 일반회원 숙박 종료 7일 후 개인정보 익명화. 예약 기록/금액/상태/기간/운영 이력은 보존.
- PFID 및 WM 10개, SN 9개 템플릿 ID 등록.
- 관리자 카카오 설정, 테스트 발송, 상태 진단, 성공/실패 로그, 재발송, 통계.
- Cloudflare Pages Function 기반 SOLAPI HMAC-SHA256 발송 엔드포인트 추가.

## 배포 환경변수
- `SOLAPI_API_KEY`
- `SOLAPI_API_SECRET`

API Secret은 브라우저 설정 또는 소스코드에 저장하지 않습니다.
