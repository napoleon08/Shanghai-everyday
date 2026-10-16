
"use strict";

const CITY = {
  lat: 31.2304,
  lon: 121.4737,
  tz: "Asia/Shanghai"
};

const $ = id => document.getElementById(id);

const codes = {
  0: ["맑음", "☼"],
  1: ["대체로 맑음", "☀"],
  2: ["구름 조금", "◒"],
  3: ["흐림", "☁"],
  45: ["안개", "≋"],
  48: ["서리 안개", "≋"],
  51: ["약한 이슬비", "☂"],
  53: ["이슬비", "☂"],
  55: ["강한 이슬비", "☂"],
  56: ["어는 이슬비", "❄"],
  57: ["강한 어는 이슬비", "❄"],
  61: ["약한 비", "☂"],
  63: ["비", "☂"],
  65: ["강한 비", "☔"],
  66: ["어는 비", "❄"],
  67: ["강한 어는 비", "❄"],
  71: ["약한 눈", "❄"],
  73: ["눈", "❄"],
  75: ["강한 눈", "❄"],
  77: ["싸락눈", "❄"],
  80: ["소나기", "☂"],
  81: ["강한 소나기", "☔"],
  82: ["매우 강한 소나기", "☔"],
  85: ["눈 소나기", "❄"],
  86: ["강한 눈 소나기", "❄"],
  95: ["뇌우", "ϟ"],
  96: ["우박 동반 뇌우", "ϟ"],
  99: ["강한 뇌우", "ϟ"]
};

const label = code => codes[code] || ["날씨 정보", "◌"];

const num = (value, decimals = 0) =>
  Number.isFinite(Number(value))
    ? Number(value).toFixed(decimals)
    : "--";

function direction(degrees) {
  const directions = [
    "북", "북동", "동", "남동",
    "남", "남서", "서", "북서"
  ];

  const angle = ((Number(degrees) % 360) + 360) % 360;
  return directions[Math.round(angle / 45) % 8] + "풍";
}

function time(value) {
  if (!value) return "--:--";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: CITY.tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(value));
}

function dateFmt(value) {
  const date = new Date(value + "T12:00:00+08:00");

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: CITY.tz,
    month: "2-digit",
    day: "2-digit"
  }).format(date).replace(".", " /").replace(".", "");
}

let toastTimer;

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    $("toast").classList.remove("show");
  }, 2600);
}

function clock() {
  const now = new Date();

  $("clock").textContent = "SHANGHAI " +
    new Intl.DateTimeFormat("en-GB", {
      timeZone: CITY.tz,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(now);

  $("year").textContent = new Intl.DateTimeFormat("en", {
    timeZone: CITY.tz,
    year: "numeric"
  }).format(now);
}

/* 달의 위상은 날짜를 이용한 근사 계산입니다. */
function moonData(date = new Date()) {
  const cycle = 29.530588853;
  const reference = Date.UTC(2000, 0, 6, 18, 14);
  const days = (date.getTime() - reference) / 86400000;
  const age = ((days % cycle) + cycle) % cycle;
  const phase = age / cycle;
  const illumination = (1 - Math.cos(2 * Math.PI * phase)) / 2;

  let name;

  if (phase < 0.035 || phase > 0.965) {
    name = "삭 (신월)";
  } else if (phase < 0.22) {
    name = "초승달";
  } else if (phase < 0.28) {
    name = "상현달 무렵";
  } else if (phase < 0.47) {
    name = "차오르는 달";
  } else if (phase < 0.535) {
    name = "보름달 무렵";
  } else if (phase < 0.72) {
    name = "기우는 달";
  } else if (phase < 0.78) {
    name = "하현달 무렵";
  } else {
    name = "그믐달";
  }

  return { age, phase, illumination, name };
}

function renderMoon() {
  const moon = moonData();

  $("phase").textContent = moon.name;
  $("illumination").textContent =
    Math.round(moon.illumination * 100) + "%";

  $("moonAge").textContent =
    moon.age.toFixed(1) + " / 29.53일";

  if (moon.illumination > 0.8) {
    $("moonNote").textContent =
      "달빛이 비교적 밝은 시기입니다.";
  } else if (moon.illumination < 0.15) {
    $("moonNote").textContent =
      "달빛이 어두워 별 관측에 유리할 수 있습니다.";
  } else {
    $("moonNote").textContent =
      "달의 모양은 매일 조금씩 달라집니다.";
  }

  const shape = Math.abs(Math.cos(2 * Math.PI * moon.phase));
  const shift = (moon.phase < 0.5 ? -1 : 1) * (1 - shape) * 95;

  $("moon").style.setProperty("--moon-shift", shift + "%");
}

/* Open-Meteo API: 일반적인 날씨 요청에는 API 키가 필요하지 않습니다. */
async function fetchWeather() {
  const params = new URLSearchParams({
    latitude: CITY.lat,
    longitude: CITY.lon,

    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m"
    ].join(","),

    hourly: [
      "temperature_2m",
      "relative_humidity_2m",
      "precipitation_probability",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m"
    ].join(","),

    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "sunrise",
      "sunset",
      "uv_index_max",
      "precipitation_probability_max",
      "wind_speed_10m_max"
    ].join(","),

    timezone: CITY.tz,
    forecast_days: 6,
    wind_speed_unit: "kmh"
  });

  const response = await fetch(
    "https://api.open-meteo.com/v1/forecast?" + params,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("날씨 API 응답 오류: " + response.status);
  }

  return response.json();
}

function renderCurrent(data) {
  const current = data.current;
  const daily = data.daily;
  const [description, icon] = label(current.weather_code);

  $("temp").textContent = num(current.temperature_2m);
  $("condition").textContent = description;
  $("icon").textContent = icon;

  $("feels").textContent =
    num(current.apparent_temperature) + "°C";

  $("hiLo").textContent =
    num(daily.temperature_2m_max[0]) + "° / " +
    num(daily.temperature_2m_min[0]) + "°";

  $("rain").textContent =
    num(daily.precipitation_probability_max[0]) + "%";

  $("uv").textContent = num(daily.uv_index_max[0], 1);

  $("wind").textContent = num(current.wind_speed_10m);
  $("direction").textContent = direction(current.wind_direction_10m);

  $("degrees").textContent =
    num(current.wind_direction_10m) + "°";

  $("needle").style.transform =
    "rotate(" + (Number(current.wind_direction_10m) || 0) + "deg)";

  $("gust").textContent =
    num(current.wind_gusts_10m) + " km/h";

  const humidity = Math.max(
    0,
    Math.min(100, Number(current.relative_humidity_2m) || 0)
  );

  $("humidity").textContent = humidity;
  $("humidityBar").style.width = humidity + "%";

  $("updated").textContent =
    "관측 " + time(current.time) + " 기준";

  if (daily.sunrise?.[0] && daily.sunset?.[0]) {
    const minutes = Math.max(
      0,
      Math.round(
        (new Date(daily.sunset[0]) -
         new Date(daily.sunrise[0])) / 60000
      )
    );

    $("sunrise").textContent = time(daily.sunrise[0]);
    $("sunset").textContent = time(daily.sunset[0]);

    $("daylength").textContent =
      Math.floor(minutes / 60) + "시간 " +
      (minutes % 60) + "분";
  }
}

function renderForecast(data) {
  const daily = data.daily;
  const dates = daily.time.slice(0, 5);

  $("forecast").innerHTML = dates.map((date, index) => {
    const [condition, icon] = label(daily.weather_code[index]);

    const dayName = index === 0
      ? "오늘"
      : new Intl.DateTimeFormat("ko-KR", {
          timeZone: CITY.tz,
          weekday: "short"
        }).format(new Date(date + "T12:00:00+08:00"));

    return `
      <article class="forecast-card ${index === 0 ? "today" : ""}">
        <div class="f-day">${dayName}</div>
        <div class="f-date">${dateFmt(date)}</div>
        <div class="f-icon">${icon}</div>
        <div class="f-condition">${condition}</div>

        <div class="f-temps">
          <b>${num(daily.temperature_2m_max[index])}°</b>
          <span>${num(daily.temperature_2m_min[index])}°</span>
        </div>

        <div class="f-rain">
          <span>강수 확률</span>
          <b>${num(daily.precipitation_probability_max[index])}%</b>
        </div>
      </article>
    `;
  }).join("");
}

function renderWind(data) {
  const hourly = data.hourly;
  const times = hourly.time;
  const now = Date.now();

  let start = times.findIndex(
    value => new Date(value).getTime() >= now - 3600000
  );

  if (start < 0) start = 0;

  const indexes = [];

  for (
    let i = start;
    i < Math.min(times.length, start + 24);
    i += 3
  ) {
    indexes.push(i);
  }

  if (!indexes.length) {
    $("windChart").innerHTML =
      '<div class="placeholder">시간별 바람 데이터가 없습니다.</div>';
    return;
  }

  const maximum = Math.max(
    10,
    ...indexes.flatMap(index => [
      Number(hourly.wind_speed_10m[index]) || 0,
      Number(hourly.wind_gusts_10m[index]) || 0
    ])
  );

  $("windChart").innerHTML = indexes.map(index => {
    const wind = Number(hourly.wind_speed_10m[index]) || 0;
    const gust = Number(hourly.wind_gusts_10m[index]) || 0;

    return `
      <div class="column"
        title="${time(times[index])} · 바람 ${wind} km/h · 돌풍 ${gust} km/h">

        <div class="bars">
          <i class="bar wind"
            style="height:${Math.max(2, wind / maximum * 100)}%"></i>
          <i class="bar gust"
            style="height:${Math.max(2, gust / maximum * 100)}%"></i>
        </div>

        <span class="chart-label">${time(times[index])}</span>
      </div>
    `;
  }).join("");
}

function initGlobe() {
  const element = $("globe");

  if (typeof Globe !== "function") {
    element.innerHTML =
      '<div class="placeholder">지구본을 불러오지 못했습니다.</div>';
    return;
  }

  try {
    const globe = Globe()(element)
      .globeImageUrl(
        "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
      )
      .bumpImageUrl(
        "https://unpkg.com/three-globe/example/img/earth-topology.png"
      )
      .backgroundColor("rgba(0,0,0,0)")
      .showAtmosphere(true)
      .atmosphereColor("#77d5ff")
      .atmosphereAltitude(0.18)
      .pointsData([
        {
          lat: CITY.lat,
          lng: CITY.lon,
          size: 0.75,
          color: "#ffc987"
        }
      ])
      .pointAltitude("size")
      .pointRadius(0.45)
      .pointColor("color")
      .pointLabel(
        () => "<b>Shanghai / 上海</b><br>31.2304° N, 121.4737° E"
      )
      .width(element.clientWidth || 500)
      .height(element.clientHeight || 350);

    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.35;
    globe.controls().enableZoom = false;

    globe.pointOfView(
      { lat: CITY.lat, lng: CITY.lon, altitude: 1.8 },
      1000
    );

    window.addEventListener("resize", () => {
      globe
        .width(element.clientWidth || 500)
        .height(element.clientHeight || 350);
    }, { passive: true });

  } catch (error) {
    console.error(error);

    element.innerHTML =
      '<div class="placeholder">지구본을 표시할 수 없습니다. 새로고침해 주세요.</div>';
  }
}

async function load() {
  const button = $("refresh");

  button.disabled = true;
  button.textContent = "↻ 불러오는 중…";

  try {
    const data = await fetchWeather();

    renderCurrent(data);
    renderForecast(data);
    renderWind(data);
    renderMoon();

    toast("날씨 데이터가 업데이트되었습니다.");

  } catch (error) {
    console.error(error);

    $("updated").textContent = "데이터 연결 실패";

    $("forecast").innerHTML =
      '<div class="placeholder">날씨 데이터를 불러오지 못했습니다. 네트워크를 확인하고 새로고침해 주세요.</div>';

    toast("날씨 데이터를 불러오지 못했습니다.");

  } finally {
    button.disabled = false;
    button.textContent = "↻ 데이터 새로고침";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  clock();
  setInterval(clock, 1000);

  initGlobe();
  load();

  $("refresh").addEventListener("click", load);
});
