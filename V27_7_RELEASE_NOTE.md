# V27.7 Safari / Kakao In-App 긴급 안정화

- iPhone Safari / Kakao 인앱 브라우저 백지화면 대응
- jsDelivr Supabase CDN 의존 제거
- config.js 로딩 순서 의존 제거
- app.js 내부 기본 Supabase URL/Publishable Key 고정
- Supabase SDK가 없어도 REST API로 app_state 읽기/저장 가능
- 기존 기능/자료 유지

## 테스트 우선순위
1. PC Chrome/Edge 관리자 로그인
2. iPhone Safari 직원 로그인
3. 카카오 인앱 링크 접속
4. 복지신청 후 관리자 반영
5. 이벤트/복지 신청 취소
