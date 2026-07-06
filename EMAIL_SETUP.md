# V15 이메일 발송 설정

기본 이메일 주소:
- 보내는 주소: withm1905@withmedical.com
- 받는 주소: withm1905@withmedical.com

V15는 경조사 신청과 휴가지원사업 신청 시 이 주소로 메일이 발송되도록 기본값을 넣었습니다.

## 이메일 발송 구조

직원 신청
→ Supabase 저장
→ Supabase Edge Function `send-email`
→ Resend API
→ withm1905@withmedical.com 으로 발송

## 준비물

1. Resend 계정
2. Resend API Key
3. Supabase Edge Function
4. Supabase Secret 설정

## Supabase Edge Function 설정

Supabase Dashboard에서 Edge Functions로 이동합니다.

Function 이름:
send-email

`supabase/functions/send-email/index.ts` 내용을 붙여넣고 배포합니다.

Secrets 또는 Environment Variables에 아래 값을 넣습니다.

RESEND_API_KEY=Resend에서 만든 API Key
FROM_EMAIL=WITH Welfare <withm1905@withmedical.com>

## 중요

처음 테스트할 때 Resend에서 도메인 인증이 안 되어 있으면 회사 메일 발신이 제한될 수 있습니다.
그 경우 먼저 Resend의 테스트 발신 주소로 테스트한 뒤, `withmedical.com` 도메인 인증을 진행하면 됩니다.

운영 권장:
- 보내는 주소: withm1905@withmedical.com
- 받는 주소: withm1905@withmedical.com

관리자가 1명인 운영 구조에서는 보내는 주소와 받는 주소를 같게 사용해도 됩니다.
