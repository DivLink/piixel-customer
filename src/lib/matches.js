import { toPng } from 'html-to-image';

export const MATCH_TTL_DAYS = 7;
export const daysLeft = (expireAt) => Math.max(0, Math.ceil(((expireAt?.toMillis?.() ?? 0) - Date.now()) / 86400000));

export async function downloadImage(node, name) {
  const url = await toPng(node, { pixelRatio: 2, cacheBust: true });
  const a = document.createElement('a');
  a.href = url; a.download = `${name}.png`; a.click();
}

// Prints only the given card (see .print-area in CSS).
export function printNode(node) {
  node.classList.add('print-area');
  window.print();
  setTimeout(() => node.classList.remove('print-area'), 500);
}
