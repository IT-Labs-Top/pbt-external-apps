/** Optional external request. Fixed city coordinates come from public config, never from visitor geolocation. */
export async function loadWeather(config, { signal, fetcher = fetch } = {}) {
  if (config?.enabled !== true) return null;
  const latitude = Number(config.latitude),
    longitude = Number(config.longitude);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  )
    throw new Error('Некорректные координаты погоды');
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,weather_code',
  });
  const response = await fetcher(url, {
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(3000)])
      : AbortSignal.timeout(3000),
    credentials: 'omit',
  });
  if (!response.ok) throw new Error('Сервис погоды недоступен');
  const data = await response.json();
  const temperature = data.current?.temperature_2m;
  if (
    typeof temperature !== 'number' ||
    !Number.isFinite(temperature) ||
    temperature < -100 ||
    temperature > 70
  )
    throw new Error('Сервис погоды вернул некорректный ответ');
  return {
    temperature: Math.round(temperature),
    text: (temperature > 0 ? '+' : '') + Math.round(temperature) + ' °C',
  };
}
