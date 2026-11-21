import type { SceneConfig } from '../scenes/types';

export const CARD_W = 1200;
export const CARD_H = 630;

export interface CardText {
  title: string;
  sub: string;
  items: string[];
  footer: string;
  url: string;
}

export function siteUrl(): string {
  const env = import.meta.env.VITE_SITE_URL as string | undefined;
  return env && env.length > 0 ? env : window.location.origin;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Draw an image to cover a box (like object-fit: cover). */
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const iw = img.naturalWidth || 800;
  const ih = img.naturalHeight || 600;
  const s = Math.max(w / iw, h / ih);
  const dw = iw * s;
  const dh = ih * s;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

/** Render the 1200×630 share card. Reuses the scene's calm art. */
export async function drawShareCard(scene: SceneConfig, text: CardText): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d')!;

  // Right: the calm scene (calm variants, no glare).
  const artX = 640;
  ctx.fillStyle = scene.bg;
  ctx.fillRect(artX, 0, CARD_W - artX, CARD_H);
  for (const layer of scene.layers) {
    if ((layer.base?.opacity ?? 1) === 0) continue;
    const img = await loadImage(layer.calmSrc ?? layer.src);
    if (!img) continue;
    ctx.globalAlpha = layer.base?.opacity ?? 1;
    drawCover(ctx, img, artX, 0, CARD_W - artX, CARD_H);
  }
  ctx.globalAlpha = 1;

  // Left: text panel.
  ctx.fillStyle = '#14213d';
  ctx.fillRect(0, 0, artX, CARD_H);
  ctx.fillStyle = '#2a6f63';
  ctx.fillRect(artX - 10, 0, 10, CARD_H);

  const pad = 56;
  const maxW = artX - pad * 2;
  let y = 64;
  ctx.textBaseline = 'top';

  ctx.fillStyle = '#ffffff';
  ctx.font = `800 54px ${FONT}`;
  for (const l of wrap(ctx, text.title, maxW)) {
    ctx.fillText(l, pad, y);
    y += 62;
  }
  y += 6;
  ctx.fillStyle = '#ffd166';
  ctx.font = `600 32px ${FONT}`;
  ctx.fillText(text.sub, pad, y);
  y += 52;

  // Shrink the list font if there are many items.
  const size = text.items.length > 4 ? 24 : 28;
  ctx.font = `500 ${size}px ${FONT}`;
  ctx.fillStyle = '#ffffff';
  const footerTop = CARD_H - 100;
  for (const item of text.items) {
    const lines = wrap(ctx, item, maxW - 36);
    if (y + lines.length * (size + 6) > footerTop) break;
    ctx.fillStyle = '#7fd1c1';
    ctx.fillText('✓', pad, y);
    ctx.fillStyle = '#ffffff';
    for (const l of lines) {
      ctx.fillText(l, pad + 36, y);
      y += size + 6;
    }
    y += 8;
  }

  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = `500 24px ${FONT}`;
  ctx.fillText(text.footer, pad, CARD_H - 84);
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 28px ${FONT}`;
  ctx.fillText(text.url.replace(/^https?:\/\//, ''), pad, CARD_H - 52);

  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'));
}

/** Web Share API with files when supported; otherwise returns false so the caller can fall back. */
export async function shareFile(blob: Blob, title: string, text: string, url: string): Promise<'shared' | 'cancelled' | 'unsupported'> {
  const file = new File([blob], 'sensory-overload-simulator.png', { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (!nav.share || !nav.canShare?.({ files: [file] })) return 'unsupported';
  try {
    await nav.share({ files: [file], title, text: `${text} ${url}` });
    return 'shared';
  } catch (e) {
    return (e as Error).name === 'AbortError' ? 'cancelled' : 'unsupported';
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
