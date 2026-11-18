// Chhota CSV parser: quotes ("Dewas, MP"), "" escape, CRLF aur Excel ka BOM sambhalta hai.
// Har row ke saath file ki line number bhi (khaali lines gino me aati hain).
export function parseCsv(text) {
  const src = String(text).replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  let line = 1;
  let startLine = 1;

  const endCell = () => {
    row.push(cell.trim());
    cell = '';
  };
  const endRow = () => {
    endCell();
    if (row.some((c) => c !== '')) rows.push({ cells: row, line: startLine });
    row = [];
  };

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else {
        if (c === '\n') line++;
        cell += c;
      }
    } else if (c === '"') quoted = true;
    else if (c === ',') endCell();
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      line++;
      endRow();
      startLine = line;
    } else cell += c;
  }
  endRow();
  return rows;
}

// [{ _line:2, office:'mla', areaName:'Khategaon', ... }, ...]
export function csvToObjects(text) {
  const [head, ...rows] = parseCsv(text);
  const header = head?.cells ?? [];
  return rows.map((r) => ({
    _line: r.line,
    ...Object.fromEntries(header.map((h, j) => [h, r.cells[j] ?? ''])),
  }));
}