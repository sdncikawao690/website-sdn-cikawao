import React, { useRef, useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Link2,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';
import {
  compressImageFile,
  parseVideoUrl,
  readDocumentFileAsDataUrl,
} from '../lib/media';
import { MEDIA_PRESETS } from '../types/school';
import { VideoPlayer } from './MediaViewer';
import { SafeImage } from './SafeImage';

interface MediaPickerProps {
  photoLabel?: string;
  photoUrl?: string;
  onPhotoChange?: (val: string) => void;
  showPresets?: boolean;
  maxPhotoDimension?: number;

  videoLabel?: string;
  videoUrl?: string;
  onVideoChange?: (val: string) => void;

  docLabel?: string;
  documentUrl?: string;
  onDocumentChange?: (val: string) => void;
  docPlaceholder?: string;
  allowDocFileUpload?: boolean;
  documentName?: string;
  onDocumentNameChange?: (name: string) => void;
}

export function MediaPicker({
  photoLabel = 'Foto / Gambar Dokumentasi',
  photoUrl = '',
  onPhotoChange,
  showPresets = true,
  maxPhotoDimension = 900,
  videoLabel = 'Video Dokumentasi (Opsional)',
  videoUrl = '',
  onVideoChange,
  docLabel = 'Tautan Dokumen Pendukung (Opsional)',
  documentUrl = '',
  onDocumentChange,
  docPlaceholder = 'https://drive.google.com/... (PDF, SK, Laporan)',
  allowDocFileUpload = false,
  documentName = '',
  onDocumentNameChange,
}: MediaPickerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const docFileRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [docUploading, setDocUploading] = useState(false);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onPhotoChange) return;

    setUploadError(null);
    setCompressing(true);
    try {
      const dataUrl = await compressImageFile(file, maxPhotoDimension, 175000);
      onPhotoChange(dataUrl);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Gagal memproses foto yang diunggah.'
      );
    } finally {
      setCompressing(false);
    }
  };

  const handleDocFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onDocumentChange) return;

    setDocUploadError(null);
    setDocUploading(true);
    try {
      const { dataUrl, fileName } = await readDocumentFileAsDataUrl(file, 200000);
      onDocumentChange(dataUrl);
      onDocumentNameChange?.(fileName);
    } catch (err) {
      setDocUploadError(
        err instanceof Error ? err.message : 'Gagal memproses file yang diunggah.'
      );
    } finally {
      setDocUploading(false);
    }
  };

  const parsedVideo = parseVideoUrl(videoUrl);

  return (
    <div className="space-y-4 bg-slate-50/80 border-2 border-slate-200 rounded-2xl p-4">
      {onPhotoChange && (
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
              <span>{photoLabel}</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => void handleFileSelect(e)}
                className="hidden"
              />
              <button
                type="button"
                disabled={compressing}
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 rounded-xl shadow-sm cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                {compressing
                  ? 'Memproses...'
                  : photoUrl
                    ? 'Ganti Foto dari Perangkat'
                    : 'Unggah Foto dari Perangkat'}
              </button>
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => onPhotoChange('')}
                  title="Hapus foto"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus
                </button>
              )}
            </div>
          </div>

          {uploadError && (
            <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              {uploadError}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
            <div className="sm:col-span-4 aspect-[4/3] rounded-xl overflow-hidden border-2 border-white shadow-sm bg-white">
              <SafeImage
                src={photoUrl}
                alt={photoLabel}
                className="w-full h-full object-cover"
                fallbackTitle="Belum ada foto dipilih"
              />
            </div>
            <div className="sm:col-span-8 space-y-2">
              {showPresets && (
                <select
                  value={MEDIA_PRESETS.some((p) => p.url === photoUrl) ? photoUrl : ''}
                  onChange={(e) => {
                    if (e.target.value) onPhotoChange(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold border-2 border-slate-200 rounded-xl bg-white"
                >
                  <option value="">-- Pilih dari Koleksi Foto Sekolah --</option>
                  {MEDIA_PRESETS.map((p) => (
                    <option key={p.url} value={p.url}>
                      {p.label}
                    </option>
                  ))}
                </select>
              )}
              <div className="relative">
                <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={250000}
                  value={photoUrl.startsWith('data:image/') ? '' : photoUrl}
                  onChange={(e) => onPhotoChange(e.target.value)}
                  placeholder={
                    photoUrl.startsWith('data:image/')
                      ? 'Foto berhasil diunggah dari perangkat (ketik URL untuk mengganti)'
                      : 'Atau tempel URL foto (https://...)'
                  }
                  className="w-full pl-8 pr-3 py-2 text-xs border-2 border-slate-200 rounded-xl bg-white font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Mendukung unggah JPG/PNG/WebP langsung dari komputer/HP atau tempel URL gambar.
              </p>
            </div>
          </div>
        </div>
      )}

      {onVideoChange && (
        <div className="space-y-2 pt-2 border-t border-slate-200/80">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-rose-600" />
            <span>{videoLabel}</span>
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              maxLength={500}
              value={videoUrl}
              onChange={(e) => onVideoChange(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... atau tautan video Drive/MP4"
              className="flex-1 px-3 py-2 text-xs border-2 border-slate-200 rounded-xl bg-white font-mono"
            />
            {videoUrl && (
              <button
                type="button"
                onClick={() => onVideoChange('')}
                className="px-2.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl cursor-pointer shrink-0"
              >
                Hapus
              </button>
            )}
          </div>
          {parsedVideo && (
            <div className="pt-1">
              <VideoPlayer
                url={videoUrl}
                title="Pratinjau Video"
                className="w-full max-w-sm aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-300"
              />
            </div>
          )}
        </div>
      )}

      {onDocumentChange && (
        <div className="space-y-2 pt-2 border-t border-slate-200/80">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>{docLabel}</span>
            </label>
            {allowDocFileUpload && (
              <div className="flex items-center gap-2">
                <input
                  ref={docFileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => void handleDocFileSelect(e)}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={docUploading}
                  onClick={() => docFileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl shadow-sm cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {docUploading
                    ? 'Mengunggah...'
                    : documentUrl
                      ? 'Ganti File dari Perangkat'
                      : 'Unggah File dari Perangkat'}
                </button>
              </div>
            )}
          </div>

          {docUploadError && (
            <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              {docUploadError}
            </p>
          )}

          {allowDocFileUpload && documentUrl.startsWith('data:') && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
              <span className="inline-flex items-center gap-1.5 font-semibold truncate">
                <FileText className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="truncate">{documentName || 'File dokumen terunggah'}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  onDocumentChange('');
                  onDocumentNameChange?.('');
                }}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-rose-700 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 cursor-pointer shrink-0"
              >
                <Trash2 className="w-3 h-3" />
                Hapus
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              maxLength={allowDocFileUpload ? 200000 : 500}
              value={documentUrl.startsWith('data:') ? '' : documentUrl}
              onChange={(e) => {
                onDocumentChange(e.target.value);
                if (e.target.value) onDocumentNameChange?.('');
              }}
              placeholder={
                documentUrl.startsWith('data:')
                  ? `File "${documentName || 'dokumen'}" siap disimpan (ketik URL untuk mengganti)`
                  : docPlaceholder
              }
              className="flex-1 px-3 py-2 text-xs border-2 border-slate-200 rounded-xl bg-white font-mono"
            />
            {documentUrl && (
              <button
                type="button"
                onClick={() => {
                  onDocumentChange('');
                  onDocumentNameChange?.('');
                }}
                className="px-2.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl cursor-pointer shrink-0"
              >
                Hapus
              </button>
            )}
          </div>
          {allowDocFileUpload && (
            <p className="text-[11px] text-slate-500">
              Mendukung unggah file langsung PDF, Word (.doc/.docx), Excel (.xls/.xlsx), CSV, TXT, atau foto/scan hingga ~145 KB, maupun tempel tautan URL Drive.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
