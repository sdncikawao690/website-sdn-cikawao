import { useEffect, useMemo, useState } from 'react';
import { Download, ExternalLink, FileText, X } from 'lucide-react';
import { isSafeMediaHref } from '../lib/media';
import type { SilokaDocument } from '../types/school';

interface SilokaFilePreviewModalProps {
  docItem: SilokaDocument | null;
  onClose: () => void;
}

function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const commaIdx = dataUrl.indexOf(',');
    if (commaIdx === -1) return null;
    const header = dataUrl.slice(0, commaIdx);
    const base64 = dataUrl.slice(commaIdx + 1);
    const mimeMatch = header.match(/data:([^;]+);base64/i);
    const mime = mimeMatch?.[1] || 'application/octet-stream';
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i += 1) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  } catch {
    return null;
  }
}

export function SilokaFilePreviewModal({
  docItem,
  onClose,
}: SilokaFilePreviewModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textPreview, setTextPreview] = useState<string | null>(null);

  const fileUrl = docItem?.fileUrl || '';
  const lowerUrl = fileUrl.toLowerCase();
  const isSafe = isSafeMediaHref(fileUrl);
  const isDataUrl = fileUrl.startsWith('data:');
  const isImage =
    lowerUrl.startsWith('data:image/') ||
    /\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(lowerUrl);
  const isPdf =
    lowerUrl.startsWith('data:application/pdf;') || /\.pdf(\?.*)?$/i.test(lowerUrl);
  const isPlainText =
    lowerUrl.startsWith('data:text/plain;') || lowerUrl.startsWith('data:text/csv;');

  const driveEmbedUrl = useMemo(() => {
    const driveMatch = fileUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    return driveMatch?.[1]
      ? `https://drive.google.com/file/d/${driveMatch[1]}/preview`
      : null;
  }, [fileUrl]);

  useEffect(() => {
    setTextPreview(null);
    if (!docItem || !isSafe || !isDataUrl) {
      setBlobUrl(null);
      return;
    }
    const blob = dataUrlToBlob(fileUrl);
    if (!blob) {
      setBlobUrl(null);
      return;
    }
    const created = URL.createObjectURL(blob);
    setBlobUrl(created);

    if (isPlainText) {
      void blob
        .text()
        .then((txt) => setTextPreview(txt.slice(0, 12000)))
        .catch(() => setTextPreview(null));
    }

    return () => {
      URL.revokeObjectURL(created);
    };
  }, [docItem, fileUrl, isDataUrl, isPlainText, isSafe]);

  if (!docItem || !isSafe) return null;

  const displaySrc = blobUrl || fileUrl;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
      <div className="bg-white border-2 border-violet-200 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold text-amber-200">
              {docItem.pillar}
              {docItem.fileSizeLabel ? ` · ${docItem.fileSizeLabel}` : ''}
            </p>
            <h3 className="text-base font-bold font-display truncate">
              {docItem.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isDataUrl ? (
              <a
                href={fileUrl}
                download={docItem.fileName || `${docItem.title}.pdf`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-900 bg-white hover:bg-violet-50 rounded-xl whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh File
              </a>
            ) : (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-900 bg-white hover:bg-violet-50 rounded-xl whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Buka Tautan
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/90 hover:text-white rounded-lg hover:bg-white/20 cursor-pointer"
              aria-label="Tutup pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto flex-1 bg-slate-50 space-y-4">
          {docItem.description && (
            <p className="text-sm text-slate-700 bg-white border border-slate-200 rounded-xl p-3.5">
              {docItem.description}
            </p>
          )}

          {isImage && (
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center p-2">
              <img
                src={displaySrc}
                alt={docItem.title}
                referrerPolicy="no-referrer"
                className="max-h-[60vh] w-auto object-contain rounded-lg"
              />
            </div>
          )}

          {(isPdf || driveEmbedUrl) && !isImage && (
            <div className="w-full h-[60vh] rounded-xl overflow-hidden border border-slate-200 bg-white">
              <iframe
                src={driveEmbedUrl || displaySrc}
                title={docItem.title}
                className="w-full h-full border-0"
              />
            </div>
          )}

          {isPlainText && textPreview !== null && (
            <pre className="p-4 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 whitespace-pre-wrap overflow-x-auto max-h-[55vh]">
              {textPreview}
            </pre>
          )}

          {!isImage && !isPdf && !driveEmbedUrl && !isPlainText && (
            <div className="bg-white border-2 border-violet-200 rounded-2xl p-8 text-center space-y-3">
              <FileText className="w-10 h-10 text-violet-600 mx-auto" />
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {docItem.fileName || docItem.title}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Pratinjau langsung di browser tidak tersedia untuk format dokumen Office
                  (.doc/.docx/.xls/.xlsx). Silakan unduh file untuk membukanya.
                </p>
              </div>
              {isDataUrl ? (
                <a
                  href={fileUrl}
                  download={docItem.fileName || docItem.title}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl"
                >
                  <Download className="w-4 h-4" />
                  Unduh {docItem.fileName || 'Dokumen'}
                </a>
              ) : (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl"
                >
                  <ExternalLink className="w-4 h-4" />
                  Buka Dokumen di Tab Baru
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
