const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// t = { title, code, line, name }
export function printTicket(t) {
  const w = window.open('', '_blank', 'width=420,height=560');
  if (!w) return alert('Allow pop-ups to print.');
  w.document.write(`<html><head><title>Ticket</title></head>
    <body style="font-family:sans-serif;text-align:center;padding:30px">
      <h2>${esc(t.title)}</h2>
      <div style="font-size:52px;font-weight:800;border:3px dashed #7a4a24;padding:18px;margin:18px 0">${esc(t.code)}</div>
      <p style="font-size:18px">${esc(t.line)}</p>
      <p style="font-size:20px"><b>Player:</b> ${esc(t.name)}</p>
      <script>window.onload = () => window.print()<\/script>
    </body></html>`);
  w.document.close();
}

export function downloadTicket(t) {
  const c = document.createElement('canvas');
  c.width = 800; c.height = 440;
  const x = c.getContext('2d');
  const rr = (px, py, w, h, r) => { x.beginPath(); x.roundRect(px, py, w, h, r); };

  x.fillStyle = '#faf3e6'; rr(0, 0, 800, 440, 36); x.fill();
  x.save(); rr(0, 0, 800, 440, 36); x.clip();
  const g = x.createLinearGradient(0, 0, 800, 270);
  g.addColorStop(0, '#f3e4c8'); g.addColorStop(1, '#ead3a9');
  x.fillStyle = g; x.fillRect(0, 0, 800, 270);
  x.restore();

  x.textAlign = 'center';
  x.fillStyle = '#a8845f'; x.font = '700 22px sans-serif';
  x.fillText(String(t.title).slice(0, 40).toUpperCase(), 400, 60);

  x.fillStyle = '#d9b987'; rr(210, 100, 380, 125, 28); x.fill();
  x.fillStyle = '#f0e0c2'; rr(210, 100, 380, 118, 28); x.fill();
  x.fillStyle = '#7a4a24'; x.font = '800 84px sans-serif';
  x.fillText(String(t.code), 400, 185);

  x.strokeStyle = '#d9b987'; x.lineWidth = 3; x.setLineDash([12, 10]);
  x.beginPath(); x.moveTo(40, 290); x.lineTo(760, 290); x.stroke(); x.setLineDash([]);
  x.globalCompositeOperation = 'destination-out';
  x.beginPath(); x.arc(0, 290, 22, 0, 7); x.fill();
  x.beginPath(); x.arc(800, 290, 22, 0, 7); x.fill();
  x.globalCompositeOperation = 'source-over';

  // shrink text until it fits a given width
  const fit = (text, maxW, start, min, weight = 700) => {
    let size = start;
    x.font = `${weight} ${size}px sans-serif`;
    while (x.measureText(text).width > maxW && size > min) {
      size -= 1;
      x.font = `${weight} ${size}px sans-serif`;
    }
    return size;
  };

  const lineText = String(t.line || '');
  const nameText = String(t.name || '');

  // give each side a share of the 700px row (50 → 750), with a 30px gap
  x.font = '700 26px sans-serif';
  const lineNatural = x.measureText(lineText).width;
  x.font = '700 28px sans-serif';
  const nameNatural = x.measureText(nameText).width;
  const total = 700 - 30;
  let lineW = Math.min(lineNatural, total * 0.45);
  let nameW = Math.min(nameNatural, total - lineW);
  lineW = Math.min(lineNatural, total - nameW);

  // details (left)
  x.textAlign = 'left'; x.fillStyle = '#a8845f'; x.font = '700 20px sans-serif';
  x.fillText('DETAILS', 50, 340);
  fit(lineText, lineW, 26, 14);
  x.fillStyle = '#2b1a0e';
  x.fillText(lineText, 50, 392);

  // player (right)
  x.textAlign = 'right'; x.fillStyle = '#a8845f'; x.font = '700 20px sans-serif';
  x.fillText('PLAYER', 750, 340);
  fit(nameText, nameW, 28, 14);
  x.fillStyle = '#2b1a0e';
  x.fillText(nameText, 750, 392);

  c.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const l = document.createElement('a');
    l.href = url; l.download = `ticket-${t.code}.png`;
    l.click(); URL.revokeObjectURL(url);
  });
}