# V28.0.9.3 Production Hotfix

## PC PDF 첨부 오류 수정
- 브라우저가 PDF MIME 타입을 비워 보내거나 `application/x-pdf`로 전달하는 경우에도 `.pdf` 확장자를 확인하여 정상 허용합니다.
- 클라이언트와 Cloudflare Functions 서버 검증 기준을 동일하게 맞췄습니다.
- 업로드 시 PDF Content-Type을 `application/pdf`로 정규화합니다.
- 이미지 파일도 MIME 타입과 확장자를 함께 검사합니다.
- 최대 5개, 파일당 5MB 제한은 유지합니다.

## 데이터 보호
- 기존 회원·예약·복지·행사·카카오 설정 데이터 구조는 변경하지 않습니다.
