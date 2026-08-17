'use client';

import { useState } from 'react';
import { objectsToCSV } from '@/lib/csv';
import type { Product } from '@/types';

type CsvResult = { row: number; name: string; status: 'created' | 'updated' | 'error'; message?: string };
type PhotoResult = { file: string; status: 'matched' | 'unmatched' | 'error'; productName?: string; message?: string };

const TEMPLATE_HEADERS = ['name', 'category', 'price', 'unit', 'tag', 'icon', 'color', 'stock', 'active', 'imageUrl'];

export default function AdminBulkTools({
  products,
  onChanged,
}: {
  products: Product[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);

  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvResults, setCsvResults] = useState<CsvResult[] | null>(null);
  const [csvSummary, setCsvSummary] = useState<{ created: number; updated: number; errors: number } | null>(null);
  const [importing, setImporting] = useState(false);

  const [photoResults, setPhotoResults] = useState<PhotoResult[] | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  function downloadTemplate() {
    const csv = objectsToCSV(
      [
        {
          name: 'Vine tomatoes',
          category: 'produce',
          price: 1500,
          unit: '1kg basket',
          tag: 'Farm fresh',
          icon: 'tomato',
          color: 'yellow',
          stock: 30,
          active: 'true',
          imageUrl: '',
        },
      ],
      TEMPLATE_HEADERS
    );
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lrk-basket-products-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCsvFile(file: File) {
    setImporting(true);
    setCsvError(null);
    setCsvResults(null);
    setCsvSummary(null);
    try {
      const text = await file.text();
      const res = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setCsvResults(data.results);
      setCsvSummary(data.summary);
      onChanged();
    } catch (err) {
      setCsvError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setImporting(false);
    }
  }

  async function handlePhotoFiles(files: FileList) {
    setUploadingPhotos(true);
    setPhotoResults(null);
    const results: PhotoResult[] = [];

    for (const file of Array.from(files)) {
      const baseName = file.name.replace(/\.[^.]+$/, '').trim().toLowerCase();
      const match = products.find((p) => p.name.trim().toLowerCase() === baseName);

      if (!match) {
        results.push({
          file: file.name,
          status: 'unmatched',
          message: `No product named "${file.name.replace(/\.[^.]+$/, '')}"`,
        });
        continue;
      }

      try {
        const body = new FormData();
        body.append('file', file);
        const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');

        const patchRes = await fetch(`/api/admin/products/${match.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: match.name,
            category: match.category,
            price: match.price,
            unit: match.unit,
            tag: match.tag,
            icon: match.icon,
            color: match.color,
            stock: match.stock,
            active: match.active,
            imageUrl: uploadData.url,
          }),
        });
        const patchData = await patchRes.json();
        if (!patchRes.ok) throw new Error(patchData.error || 'Failed to attach photo');

        results.push({ file: file.name, status: 'matched', productName: match.name });
      } catch (err) {
        results.push({
          file: file.name,
          status: 'error',
          productName: match.name,
          message: err instanceof Error ? err.message : 'Something went wrong',
        });
      }
    }

    setPhotoResults(results);
    setUploadingPhotos(false);
    onChanged();
  }

  return (
    <div className="mb-10">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-medium text-purple flex items-center gap-1.5"
      >
        {open ? '▾' : '▸'} Bulk tools (CSV import, batch photos)
      </button>

      {open && (
        <div className="bg-cream rounded-card p-6 mt-3 space-y-8">
          <div>
            <h3 className="font-display text-base font-semibold mb-1">Import products from CSV</h3>
            <p className="text-xs text-ink/55 mb-3">
              Columns: {TEMPLATE_HEADERS.join(', ')}. A row is matched to an existing product by exact name — if
              it matches, that product is updated; otherwise a new one is created.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={downloadTemplate}
                className="text-xs border border-ink/20 rounded-lg px-3 py-2"
              >
                Download CSV template
              </button>
              <input
                type="file"
                accept=".csv,text/csv"
                disabled={importing}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCsvFile(file);
                  e.target.value = '';
                }}
                className="text-xs"
              />
              {importing && <span className="text-xs text-ink/50">Importing…</span>}
            </div>

            {csvError && <p className="text-tomato text-sm mt-3">{csvError}</p>}

            {csvSummary && (
              <p className="text-xs text-ink/60 mt-3">
                {csvSummary.created} created, {csvSummary.updated} updated, {csvSummary.errors} failed.
              </p>
            )}

            {csvResults && csvResults.some((r) => r.status === 'error') && (
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                {csvResults
                  .filter((r) => r.status === 'error')
                  .map((r) => (
                    <div key={r.row} className="text-xs text-tomato">
                      Row {r.row} ({r.name}): {r.message}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-ink/20 pt-6">
            <h3 className="font-display text-base font-semibold mb-1">Batch upload photos</h3>
            <p className="text-xs text-ink/55 mb-3">
              Select multiple images at once. Each file is matched to a product by filename — name a file
              "Vine tomatoes.jpg" to attach it to the product named "Vine tomatoes" (case-insensitive, extension
              ignored).
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              disabled={uploadingPhotos}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) handlePhotoFiles(e.target.files);
                e.target.value = '';
              }}
              className="text-xs"
            />
            {uploadingPhotos && <p className="text-xs text-ink/50 mt-2">Uploading and matching…</p>}

            {photoResults && (
              <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
                {photoResults.map((r, i) => (
                  <div
                    key={i}
                    className={`text-xs ${
                      r.status === 'matched' ? 'text-ink/60' : r.status === 'unmatched' ? 'text-yellowDark' : 'text-tomato'
                    }`}
                  >
                    {r.status === 'matched' && `✓ ${r.file} → ${r.productName}`}
                    {r.status === 'unmatched' && `✕ ${r.file}: ${r.message}`}
                    {r.status === 'error' && `✕ ${r.file} (${r.productName}): ${r.message}`}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
