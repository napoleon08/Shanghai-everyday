
"use strict";

const SHANGHAI = {
  latitude: 31.2304,
  longitude: 121.4737
};

const $ = (id) => document.getElementById(id);

const weatherDescriptions = {
  0: ["맑음", "☀️"],
  1: ["대체로 맑음", "🌤️"],
  2: ["구름 조금", "⛅"],
  3: ["흐림", "☁️"],
  45: ["안개", "🌫️"],
  48: ["착빙성 안개", "🌫️"],
  51: ["약한 이슬비", "🌦️"],
  53: ["이슬비", "🌦️"],
  55: ["강한 이슬비", "🌧️"],
  56: ["약한 어는 이슬비", "🌧️"],
  57: ["강한 어는 이슬비", "🌧️"],
  61: ["약한 비", "🌧️"],
  63: ["비", "🌧️"],
  65: ["강한 비", "🌧️"],
  66: ["약한 어는 비", "🌧️"],
  67: ["강한 어는 비", "🌧️"],
  71: ["약한 눈", "🌨️"],
  73: ["눈", "🌨️"],
  75: ["강한 눈", "❄️"],
  77: ["싸락눈", "🌨️"],
  80: ["소나기", "🌦️"],
  81: ["강한 소나기", "🌧️"],
  82: ["매우 강한 소나기", "⛈️"],
  85: ["눈 소나기", "🌨️"],
  86: ["강한 눈 소나기", "❄️"],
  95: ["뇌우", "⛈️"],
  96: ["우박을 동반한 뇌우", "⛈️"],
  99: ["강한 우박 뇌우", "⛈️"]
};

let temperatureChart = null;

function describeWeather(code) {
  return weatherDescriptions[code] || ["날씨 정보 없음", "🌡️"];
}

function formatTime(value) {
  if (!value || typeof value !== "string") return "--:--";
  return value.slice(11, 16);
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Shanghai"
  }).format(date);
}

function formatToday() {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: "Asia/Shanghai"
  }).format(new Date());
}

function windDirection(degrees) {
  if (!Number.isFinite(degrees)) return "방향 정보 없음";
  const directions = ["북풍", "북동풍", "동풍", "남동풍", "남풍", "남서풍", "서풍", "북서풍"];
  return directions[Math.round(degrees / 45) % 8];
}

function setText(id, value) {
  const element = $(id);
  if (element) element.textContent = value;
}

function showError(message) {
  const box = $("errorBox");
  if (box) {
    box.hidden = false;
    box.textContent = message;
  }
}

async function loadWeather() {
  const params = new URLSearchParams({
    latitude: String(SHANGHAI.latitude),
    longitude: String(SHANGHAI.longitude),
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "precipitation",
      "wind_speed_10m",
      "wind_direction_10m",
      "weather_code"
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "sunrise",
      "sunset"
    ].join(","),
    forecast_days: "6",
    timezone: "Asia/Shanghai"
  });

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`날씨 API 요청 실패 (${response.status})`);
  }

  const data = await response.json();

  if (!data.current || !data.daily || !Array.isArray(data.daily.time)) {
    throw new Error("날씨 데이터 형식이 올바르지 않습니다.");
  }

  renderCurrent(data);
  renderForecast(data);
  renderChart(data);
  renderMoon(new Date());

  setText("currentDate", formatToday());

  const update = new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Shanghai"
  }).format(new Date());

  setText("updatedAt", `데이터 확인 시각 ${update} · 상하이 현지 시간`);

  const box = $("errorBox");
  if (box) box.hidden = true;
}

function renderCurrent(data) {
  const current = data.current;
  const [description, icon] = describeWeather(current.weather_code);

  setText("currentDescription", description);
  setText("currentIcon", icon);
  setText("temperature", Math.round(current.temperature_2m));
  setText("feelsLike", `${Math.round(current.apparent_temperature)}°C`);
  setText("humidity", Math.round(current.relative_humidity_2m));
  setText("wind", Math.round(current.wind_speed_10m));
  setText("windDirection", windDirection(current.wind_direction_10m));
  setText("rain", Number(current.precipitation).toFixed(1));
  setText("dayNight", current.is_day === 1 ? "낮 ☀" : "밤 ☾");

  const daily = data.daily;
  setText("sunrise", formatTime(daily.sunrise?.[0]));
  setText("sunset", formatTime(daily.sunset?.[0]));
}

function renderForecast(data) {
  const daily = data.daily;
  const container = $("forecastGrid");
  if (!container) return;

  const today = daily.time[0];
  const dates = daily.time.filter(date => date >= today).slice(0, 5);

  if (dates.length === 0) {
    container.innerHTML = '<div class="loading-card">예보 데이터가 없습니다.</div>';
    return;
  }

  container.innerHTML = dates.map((date) => {
    const i = daily.time.indexOf(date);
    const [description, icon] = describeWeather(daily.weather_code[i]);
    const high = Math.round(daily.temperature_2m_max[i]);
    const low = Math.round(daily.temperature_2m_min[i]);
    const rainValue = daily.precipitation_probability_max?.[i];
    const rain = Number.isFinite(rainValue) ? `${rainValue}%` : "정보 없음";

    return `
      <article class="forecast-card">
        <div class="forecast-day">${escapeHTML(formatDate(date))}</div>
        <div class="forecast-icon" aria-hidden="true">${icon}</div>
        <div class="forecast-condition">${escapeHTML(description)}</div>
        <div class="forecast-high">${high}°</div>
        <div class="forecast-low">최저 ${low}°</div>
        <div class="forecast-rain">☂ 강수 확률 ${rain}</div>
      </article>
    `;
  }).join("");
}

function renderChart(data) {
  const canvas = $("temperatureChart");
  if (!canvas || typeof Chart === "undefined") {
    const fallback = $("chartFallback");
    if (fallback) fallback.hidden = false;
    return;
  }

  const daily = data.daily;
  const dates = daily.time.slice(0, 5);
  const highs = daily.temperature_2m_max.slice(0, 5).map(Math.round);
  const lows = daily.temperature_2m_min.slice(0, 5).map(Math.round);
  const labels = dates.map(date => formatDate(date));

  if (temperatureChart) temperatureChart.destroy();

  temperatureChart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "최고 기온",
          data: highs,
          borderColor: "#85d7ff",
          backgroundColor: "rgba(133, 215, 255, .13)",
          fill: true,
          tension: 0.35,
          pointRadius: 4
        },
        {
          label: "최저 기온",
          data: lows,
          borderColor: "#b3a6ff",
          backgroundColor: "rgba(179, 166, 255, .08)",
          fill: false,
          tension: 0.35,
          pointRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: "index" },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => `${context.dataset.label}: ${context.parsed.y}°C`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#a5b3c5", maxRotation: 0, autoSkip: true },
          grid: { color: "rgba(255,255,255,.06)" }
        },
        y: {
          ticks: { color: "#a5b3c5", callback: value => `${value}°` },
          grid: { color: "rgba(255,255,255,.08)" }
        }
      }
    }
  });
}

function getMoonData(date) {
  const synodicMonth = 29.530588853;
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14);
  const elapsedDays = (date.getTime() - knownNewMoon) / 86400000;
  const age = ((elapsedDays % synodicMonth) + synodicMonth) % synodicMonth;
  const phase = age / synodicMonth;
  const illumination = (1 - Math.cos(2 * Math.PI * phase)) / 2;

  let name;
  let emoji;

  if (phase < 0.04 || phase >= 0.96) {
    name = "삭 (신월)";
    emoji = "🌑";
  } else if (phase < 0.21) {
    name = "초승달";
    emoji = "🌒";
  } else if (phase < 0.29) {
    name = "상현달";
    emoji = "🌓";
  } else if (phase < 0.46) {
    name = "상현망간의 달";
    emoji = "🌔";
  } else if (phase < 0.54) {
    name = "보름달";
    emoji = "🌕";
  } else if (phase < 0.71) {
    name = "하현망간의 달";
    emoji = "🌖";
  } else if (phase < 0.79) {
    name = "하현달";
    emoji = "🌗";
  } else {
    name = "그믐달";
    emoji = "🌘";
  }

  const daysToFull = (synodicMonth * 0.5 - age + synodicMonth) % synodicMonth;
  const nextFull = new Date(date.getTime() + daysToFull * 86400000);

  return {
    name,
    emoji,
    illumination: Math.round(illumination * 100),
    agePercent: Math.round(phase * 100),
    nextFull
  };
}

function renderMoon(date) {
  const moon = getMoonData(date);

  setText("moonPhase", moon.name);
  setText("moonIllumination", `${moon.illumination}%`);
  setText("moonAge", `${moon.agePercent}%`);

  const visual = $("moonVisual");
  if (visual) visual.textContent = moon.emoji;

  const caption = $("moonCaption");
  if (caption) {
    caption.textContent =
      `달의 주기 중 약 ${moon.agePercent}%가 지났으며, 계산된 조명 비율은 약 ${moon.illumination}%입니다.`;
  }

  const fullDate = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    timeZone: "Asia/Shanghai"
  }).format(moon.nextFull);

  setText("nextFullMoon", fullDate);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

document.addEventListener("DOMContentLoaded", () => {
  loadWeather().catch(error => {
    console.error("Weather loading error:", error);
    showError(
      "날씨 정보를 불러오지 못했습니다. 인터넷 연결을 확인하고 페이지를 새로고침해 주세요."
    );
    setText("updatedAt", "데이터 연결을 확인해 주세요.");
    setText("currentDescription", "날씨 데이터 연결 실패");
  });
});

