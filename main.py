
# WEATHER ATLAS — Shanghai

상하이의 현재 날씨, 바람, 습도, 달의 위상, 5일 예보를 보여 주는 한국어 대시보드입니다.

## 주요 기능

- 현재 기온과 체감 온도
- 오늘의 최고·최저 기온
- 풍속, 풍향, 돌풍
- 상대 습도와 강수 확률
- 앞으로 5일간의 날씨 예보
- 시간대별 바람 그래프
- 달의 위상과 밝기
- 일출·일몰과 낮의 길이
# 상하이 위치를 표시하는 인터랙티브 3D 지구본
- 위성 지도와 Google Earth 링크
- 모바일 반응형 디자인

## 사용 기술

- HTML
- CSS
- JavaScript
- Open-Meteo API
- Globe.gl
- Google Maps 임베드
- GitHub Pages

## 데이터 출처

날씨 데이터는 Open-Meteo 공개 API에서 가져옵니다.

https://open-meteo.com/

Google Earth 링크는 Google Earth 웹에서 상하이 위치를 엽니다.

https://earth.google.com/web/search/Shanghai,+China/

## GitHub Pages 배포 방법

1. GitHub에서 새 repository를 만듭니다.
2. index.html, style.css, app.js, README.md를 업로드합니다.
# 3. Settings → Pages로 이동합니다.
4. Build and deployment에서 Deploy from a branch를 선택합니다.
5. Branch는 main, folder는 /(root)를 선택합니다.
6. Save를 누릅니다.
7. 배포가 완료되면 표시되는 사이트 주소를 엽니다.

## 참고 사항

날씨 데이터는 인터넷 연결이 필요합니다.

Google Earth는 별도 탭에서 열립니다. 사이트 안에는 별도의 3D 지구본과 위성 지도가 표시됩니다.

달의 위상은 날짜를 이용한 근사 계산값이며, 정밀한 천문 관측 자료를 대체하지 않습니다.
