'use client';

import { CheckCircle2, FileSpreadsheet, Loader2, UploadCloud } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState, type DragEvent } from 'react';

interface Result {
  added: number;
  skipped: number;
  invalid: number;
  total: number;
}

/** Drag-and-drop CSV upload. Accepts a Mailchimp audience export as-is. */
export default function ImportPanel() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');

  async function upload(f: File | undefined) {
    if (!f) return;
    setError('');
    setResult(null);
    if (!/\.csv$/i.test(f.name) && f.type !== 'text/csv') {
      setError('Please choose a .csv file. In Excel or Google Sheets: File → Download → CSV.');
      return;
    }
    if (f.size > 3_000_000) {
      setError('That file is over 3 MB. Split it into smaller files and import each one.');
      return;
    }
    setFile(f.name);
    setBusy(true);
    try {
      const res = await fetch('/api/admin/import', { method: 'POST', headers: { 'Content-Type': 'text/csv' }, body: await f.text() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Import failed');
      setResult(data as Result);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setBusy(false);
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setOver(false);
    void upload(e.dataTransfer.files[0]);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={`flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition ${
          over ? 'border-pine-500 bg-pine-50' : 'border-zinc-200 bg-zinc-50/60 hover:border-zinc-300 hover:bg-zinc-50'
        }`}
      >
        <span className="grid size-14 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
          {busy ? <Loader2 className="size-6 animate-spin text-pine-600" /> : <UploadCloud className="size-6 text-pine-600" />}
        </span>
        <p className="mt-4 text-[15px] font-semibold text-zinc-900">{busy ? `Importing ${file}…` : 'Drop your client list here'}</p>
        <p className="mt-1 text-sm text-zinc-500">or click to choose a CSV file · up to 20,000 clients</p>
      </button>
      <input ref={input} type="file" accept=".csv,text/csv" hidden onChange={(e) => void upload(e.target.files?.[0])} />

      {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {result && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
          <p className="flex items-center gap-2 font-semibold text-emerald-800">
            <CheckCircle2 className="size-5" /> {file} imported
          </p>
          <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
            {[
              ['New clients with codes', result.added],
              ['Already on the list', result.skipped],
              ['Rows with problems', result.invalid],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-white px-2 py-3 ring-1 ring-emerald-100">
                <dd className="text-2xl font-semibold tabular-nums text-zinc-900">{Number(value).toLocaleString('en-US')}</dd>
                <dt className="mt-0.5 text-[12px] text-zinc-500">{label}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-4 flex items-center gap-2 text-[13px] text-emerald-800/80">
            <FileSpreadsheet className="size-4" /> Next: push the new codes to Mailchimp and download the postcard print file.
          </p>
        </div>
      )}
    </div>
  );
}
