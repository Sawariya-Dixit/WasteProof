// Letter ka kagaz jaisa preview. Dark mode me bhi safed kagaz (print jaisa dikhe).
export default function LetterPreview({ letter }) {
  return (
    <article
      lang={letter.lang}
      className="rounded-xl border border-slate-300 bg-white p-4 text-[15px] leading-relaxed text-slate-900 shadow-sm print:rounded-none print:border-0 print:p-0 print:text-[12pt] print:shadow-none"
    >
      <div className="font-serif break-words whitespace-pre-wrap">{letter.body}</div>
    </article>
  );
}