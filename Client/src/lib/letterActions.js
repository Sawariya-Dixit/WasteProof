export const pdfFileName = (letter) => `junksnap-letter-${letter.id}.pdf`;

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// Browser ka print dialog. Wahan "Save as PDF" bhi milta hai. Title se file ka naam bhi achha banta hai.
export function printLetter(letter) {
  const prev = document.title;
  document.title = `JunkSnap - ${letter.subject}`;
  const restore = () => {
    document.title = prev;
    window.removeEventListener('afterprint', restore);
  };
  window.addEventListener('afterprint', restore);
  window.print();
}

// Share: PDF file ho to file, warna sirf text. Return: 'shared' | 'cancelled' | 'unsupported'
export async function shareLetter(letter, pdfBlob) {
  if (typeof navigator.share !== 'function') return 'unsupported';
  try {
    if (pdfBlob) {
      const file = new File([pdfBlob], pdfFileName(letter), { type: 'application/pdf' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: letter.subject });
        return 'shared';
      }
    }
    await navigator.share({ title: letter.subject, text: letter.body });
    return 'shared';
  } catch (err) {
    return err?.name === 'AbortError' ? 'cancelled' : 'unsupported';
  }
}