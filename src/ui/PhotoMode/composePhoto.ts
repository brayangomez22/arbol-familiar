import { PHOTO } from '@/config/constants';
import { dayPalette, fonts } from '@/config/theme';
import { spanishDate } from '../family/personText';

/** "familia-gomez-2026-11-13.png": what the download is called. */
export function photoFileName(title: string, today: Date): string {
  const slug = title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const date = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
  return `${slug || 'arbol'}-${date}.png`;
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

/**
 * The picture as the canvas gave it, with the family's name and the date on a paper label in the
 * corner, like the title card of the site.
 */
export async function composePhoto(shot: Blob, title: string, today: Date): Promise<Blob> {
  const image = await createImageBitmap(shot);
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d');
  if (!context) return shot;
  context.drawImage(image, 0, 0);
  image.close();

  const { caption } = PHOTO;
  const titleSize = Math.max(caption.minTitleSize, canvas.width * caption.titleSize);
  const dateSize = titleSize * (caption.dateSize / caption.titleSize);
  const padding = Math.max(titleSize * 0.5, canvas.width * caption.padding);
  const margin = Math.max(titleSize * 0.6, canvas.width * caption.margin);
  const date = spanishDate({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
  });
  // The page already loaded these fonts; wait anyway in case the canvas asks first.
  await Promise.all([
    document.fonts.load(`600 ${titleSize}px ${fonts.display}`),
    document.fonts.load(`400 ${dateSize}px ${fonts.body}`),
  ]);

  const titleFont = `600 ${titleSize}px ${fonts.display}`;
  const dateFont = `400 ${dateSize}px ${fonts.body}`;
  context.font = titleFont;
  const titleWidth = context.measureText(title).width;
  context.font = dateFont;
  const dateWidth = context.measureText(date).width;
  const width = Math.max(titleWidth, dateWidth) + padding * 2;
  const height = titleSize * 1.15 + dateSize * 1.6 + padding * 1.6;
  const x = margin;
  const y = canvas.height - margin - height;

  context.save();
  context.shadowColor = `${dayPalette.ink}40`;
  context.shadowBlur = titleSize * 0.8;
  context.shadowOffsetY = titleSize * 0.15;
  context.fillStyle = `${dayPalette.paper}eb`;
  roundedRect(context, x, y, width, height, canvas.width * caption.radius);
  context.fill();
  context.restore();

  context.fillStyle = dayPalette.ink;
  context.textBaseline = 'top';
  context.font = titleFont;
  context.fillText(title, x + padding, y + padding * 0.8);
  context.globalAlpha = 0.7;
  context.font = dateFont;
  context.fillText(date, x + padding, y + padding * 0.8 + titleSize * 1.25);
  context.globalAlpha = 1;

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob ?? shot);
    }, 'image/png');
  });
}
