import { Download, ExternalLink, Play } from 'lucide-react';
import { isSafeMediaHref, parseVideoUrl } from '../lib/media';
import { SafeImage } from './SafeImage';

interface VideoPlayerProps {
  url?: string;
  title: string;
  className?: string;
}

export function VideoPlayer({
  url,
  title,
  className = 'w-full aspect-video rounded-xl overflow-hidden bg-slate-950',
}: VideoPlayerProps) {
  const parsed = parseVideoUrl(url);
  if (!parsed) return null;

  if (parsed.kind === 'iframe') {
    return (
      <div className={className}>
        <iframe
          src={parsed.src}
          title={title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (parsed.kind === 'video') {
    return (
      <div className={className}>
        <video
          src={parsed.src}
          controls
          preload="metadata"
          className="w-full h-full object-contain bg-slate-950"
        />
      </div>
    );
  }

  return (
    <a
      href={parsed.src}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-600 rounded-xl hover:from-rose-600 hover:to-pink-700"
    >
      <Play className="w-4 h-4" />
      Tonton Video Dokumentasi
      <ExternalLink className="w-3.5 h-3.5" />
    </a>
  );
}

interface AttachmentStripProps {
  photoUrl?: string;
  videoUrl?: string;
  documentUrl?: string;
  documentName?: string;
  title: string;
  compact?: boolean;
}

export function AttachmentStrip({
  photoUrl,
  videoUrl,
  documentUrl,
  documentName,
  title,
  compact = false,
}: AttachmentStripProps) {
  const hasPhoto = Boolean(photoUrl && isSafeMediaHref(photoUrl));
  const parsedVideo = parseVideoUrl(videoUrl);
  const hasDoc = Boolean(documentUrl && isSafeMediaHref(documentUrl));
  const isDataDoc = Boolean(hasDoc && documentUrl?.startsWith('data:'));

  if (!hasPhoto && !parsedVideo && !hasDoc) return null;

  return (
    <div className="space-y-2.5 mt-2">
      {hasPhoto && (
        <div
          className={`rounded-xl overflow-hidden border border-slate-200 bg-slate-50 ${
            compact ? 'max-w-[220px] aspect-[16/10]' : 'max-w-md aspect-[16/10]'
          }`}
        >
          <SafeImage
            src={photoUrl}
            alt={`Dokumentasi ${title}`}
            className="w-full h-full object-cover"
            fallbackTitle={title}
          />
        </div>
      )}

      {parsedVideo && !compact && (
        <VideoPlayer url={videoUrl} title={`Video ${title}`} />
      )}

      <div className="flex flex-wrap items-center gap-2">
        {parsedVideo && compact && (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100"
          >
            <Play className="w-3 h-3" />
            Lihat Video
          </a>
        )}
        {hasDoc &&
          (isDataDoc ? (
            <a
              href={documentUrl}
              download={documentName || 'lampiran-siloka'}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100"
            >
              <Download className="w-3 h-3" />
              Unduh File{documentName ? `: ${documentName}` : ''}
            </a>
          ) : (
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100"
            >
              <ExternalLink className="w-3 h-3" />
              {documentName ? `Buka ${documentName}` : 'Buka Dokumen'}
            </a>
          ))}
      </div>
    </div>
  );
}
