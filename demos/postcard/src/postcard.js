export const WIDTH = 1200,
  HEIGHT = 1800;
export function coverRect(width, height, target) {
  const scale = Math.max(target.width / width, target.height / height);
  return {
    x: target.x + (target.width - width * scale) / 2,
    y: target.y + (target.height - height * scale) / 2,
    width: width * scale,
    height: height * scale,
  };
}
export function supportedFilter(value) {
  return (
    !value ||
    value === 'none' ||
    /^(?:(?:grayscale|sepia|brightness|contrast|saturate|opacity|invert|blur|hue-rotate)\([0-9.%\sdegpx+-]+\)\s*)+$/.test(
      value,
    )
  );
}
export async function loadImage(url) {
  const target = new URL(url, location.href);
  if (target.origin !== location.origin)
    throw new Error('Изображение должно быть доступно через API этого запуска');
  const response = await fetch(target, {
    credentials: 'same-origin',
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('Не удалось загрузить изображение');
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const image = new Image();
  try {
    image.src = objectUrl;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
export function drawPostcard(
  canvas,
  photo,
  { caption, city, date, effect, frameImage, weatherText = '' },
) {
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fffdf5';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const photoBox = { x: 65, y: 65, width: 1070, height: 1330 };
  const rect = coverRect(photo.naturalWidth, photo.naturalHeight, photoBox);
  ctx.save();
  ctx.beginPath();
  ctx.rect(photoBox.x, photoBox.y, photoBox.width, photoBox.height);
  ctx.clip();
  ctx.filter = supportedFilter(effect?.cssFilter)
    ? (effect?.cssFilter ?? 'none')
    : 'none';
  ctx.drawImage(photo, rect.x, rect.y, rect.width, rect.height);
  ctx.restore();
  ctx.fillStyle = '#28484b';
  ctx.textAlign = 'center';
  ctx.font = 'italic 53px Georgia, serif';
  const lines = wrapText(ctx, String(caption).slice(0, 60), 1010);
  lines
    .slice(0, 2)
    .forEach((line, index) => ctx.fillText(line, WIDTH / 2, 1495 + index * 64));
  ctx.strokeStyle = '#d9ceb8';
  ctx.beginPath();
  ctx.moveTo(100, 1660);
  ctx.lineTo(1100, 1660);
  ctx.stroke();
  ctx.fillStyle = '#8c8776';
  ctx.font = '23px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(String(city).slice(0, 40), 100, 1710);
  ctx.textAlign = 'right';
  ctx.fillText([date, weatherText].filter(Boolean).join(' · '), 1100, 1710);
  ctx.textAlign = 'center';
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText(
    'ОДИН ПРЕКРАСНЫЙ ДЕНЬ / PHOTO POSTCARD',
    WIDTH / 2,
    weatherText ? 1748 : 1760,
  );
  if (weatherText) {
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('Weather: open-meteo.com · CC BY 4.0', WIDTH / 2, 1780);
  }
  if (frameImage) ctx.drawImage(frameImage, 0, 0, WIDTH, HEIGHT);
}
function wrapText(ctx, value, maxWidth) {
  const lines = [];
  let line = '';
  for (const char of value) {
    if (ctx.measureText(line + char).width > maxWidth) {
      lines.push(line);
      line = char;
    } else line += char;
  }
  lines.push(line);
  return lines;
}
export function jpegBlob(canvas) {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('Не удалось подготовить JPEG')),
      'image/jpeg',
      0.94,
    ),
  );
}
