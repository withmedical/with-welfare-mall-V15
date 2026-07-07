# 외부 캘린더 관리 방식

## Google Calendar → 복지몰

Google은 통합 캘린더 1개를 사용합니다.
Google 일정 제목은 아래 규칙으로 입력합니다.

```text
[숙소명] 예약자명
```

예시:

```text
[솔레동] 강익주
[스텔라동] 안혁
```

복지몰 관리자 > 숙소 관리 > 외부 예약 캘린더 관리에서 Google 통합 캘린더 URL을 입력하고 동기화하면, 제목의 대괄호 안 숙소명으로 자동 분류됩니다.

## Airbnb → 복지몰

Airbnb는 숙소별 iCal URL을 각각 입력합니다.

예시:

```text
솔레동 Airbnb 캘린더 URL
스텔라동 Airbnb 캘린더 URL
```

Airbnb 일정 제목은 플랫폼에서 정해지는 경우가 많기 때문에, URL이 입력된 숙소 기준으로 자동 분류합니다.

## 복지몰 → Google / Airbnb

복지몰에서 제공하는 ICS 주소는 기존처럼 사용합니다.
Google Calendar나 Airbnb에 복지몰 ICS 주소를 등록하면 복지몰 예약이 외부 캘린더에 표시됩니다.
