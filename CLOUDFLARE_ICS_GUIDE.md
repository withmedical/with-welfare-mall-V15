# Cloudflare 실시간 ICS 연동 안내

## 1. 이번 버전의 핵심

기존 복지몰 기능과 기존 데이터는 그대로 유지하고, Cloudflare Pages Functions용 ICS 주소만 안정형으로 보완했습니다.

이번 버전은 아래 주소를 우선 사용합니다.

- 전체 숙소: `https://with-welfare.pages.dev/ics?room=all`
- 스텔라동: `https://with-welfare.pages.dev/ics?room=stella`
- 솔레동: `https://with-welfare.pages.dev/ics?room=solar`

기존 호환 주소도 남겨두었습니다.

- `https://with-welfare.pages.dev/calendar/all.ics`
- `https://with-welfare.pages.dev/calendar/stella.ics`
- `https://with-welfare.pages.dev/calendar/solar.ics`

## 2. GitHub에 꼭 있어야 하는 파일

아래 파일 3개가 있으면 됩니다.

```text
functions/calendar.js
functions/ics.js
functions/calendar/[roomId].ics.js
```

Cloudflare Pages에서 가장 안정적으로 테스트할 주소는 아래입니다.

```text
https://with-welfare.pages.dev/ics?room=all
```

## 3. Cloudflare 환경변수

Cloudflare Pages 프로젝트의 Settings > Variables and secrets에 아래 2개가 있어야 합니다.

```text
SUPABASE_URL
SUPABASE_ANON_KEY
```

이미 등록되어 있으면 다시 등록하지 않아도 됩니다.

## 4. 테스트 방법

브라우저에서 아래 주소를 엽니다.

```text
https://with-welfare.pages.dev/ics?room=all
```

성공하면 화면에 아래처럼 보이거나 `.ics` 파일이 열립니다.

```text
BEGIN:VCALENDAR
VERSION:2.0
...
END:VCALENDAR
```

## 5. Google Calendar 또는 Airbnb 등록

Google Calendar 또는 Airbnb의 외부 캘린더 가져오기/구독 메뉴에 아래 주소를 붙여넣습니다.

```text
https://with-welfare.pages.dev/ics?room=solar
```

숙소별 room 값은 복지몰 관리자 화면의 ICS 주소 복사 영역에서 확인할 수 있습니다.

## 6. 주의사항

Airbnb와 Google Calendar는 ICS 주소를 초 단위로 실시간 갱신하지 않습니다.
서비스 자체 주기에 따라 몇 분에서 몇 시간 간격으로 다시 읽어갑니다.
중복예약 방지를 위한 예약불가 날짜 동기화 용도로 사용하는 것이 가장 안정적입니다.
