export interface ParsedVideo {
  kind: 'iframe' | 'video' | 'link';
  src: string;
  youtubeThumb?: string;
}

const SAFE_DATA_URL_PREFIXES = [
  'data:image/jpeg;',
  'data:image/jpg;',
  'data:image/png;',
  'data:image/webp;',
  'data:image/gif;',
  'data:application/pdf;',
  'data:application/msword;',
  'data:application/vnd.openxmlformats-officedocument.',
  'data:application/vnd.ms-excel;',
  'data:text/plain;',
  'data:text/csv;',
];

export function isSafeMediaHref(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('/') ||
    SAFE_DATA_URL_PREFIXES.some((prefix) => trimmed.toLowerCase().startsWith(prefix))
  ) {
    return true;
  }
  return false;
}

export function parseVideoUrl(rawUrl?: string): ParsedVideo | null {
  const url = (rawUrl || '').trim();
  if (!url || !isSafeMediaHref(url)) return null;

  // YouTube (watch, share, shorts, embed)
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch?.[1]) {
    const id = ytMatch[1];
    return {
      kind: 'iframe',
      src: `https://www.youtube.com/embed/${id}?rel=0`,
      youtubeThumb: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    };
  }

  // Google Drive preview
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch?.[1]) {
    return {
      kind: 'iframe',
      src: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
    };
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch?.[1]) {
    return {
      kind: 'iframe',
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
    };
  }

  // Direct HTML5 video URL
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)) {
    return {
      kind: 'video',
      src: url,
    };
  }

  return {
    kind: 'link',
    src: url,
  };
}

/**
 * Compresses an uploaded image file via HTML5 canvas so it fits safely inside
 * Firestore document limits (max ~175KB base64 data URL).
 */
export async function compressImageFile(
  file: File,
  maxDimension = 900,
  maxChars = 175000
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File yang dipilih harus berupa gambar (JPG, PNG, atau WebP).');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
      el.src = objectUrl;
    });

    const dimensions = [maxDimension, 680, 500];
    const qualities = [0.82, 0.7, 0.56, 0.44];

    for (const dim of dimensions) {
      const scale = Math.min(1, dim / Math.max(img.width, img.height, 1));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Browser tidak mendukung pemrosesan gambar kanvas.');
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      for (const q of qualities) {
        const dataUrl = canvas.toDataURL('image/jpeg', q);
        if (dataUrl.length <= maxChars) {
          return dataUrl;
        }
      }
    }

    throw new Error(
      'Ukuran foto terlalu besar setelah dikompresi. Pilih foto lain atau gunakan tautan URL gambar.'
    );
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

const ALLOWED_DOC_EXT_RE = /\.(pdf|doc|docx|xls|xlsx|csv|txt|png|jpe?g|webp)$/i;

/**
 * Reads an uploaded document file into a base64 data URL (or compressed JPEG
 * if it is an image) bounded safely for Firestore document limits.
 */
export async function readDocumentFileAsDataUrl(
  file: File,
  maxChars = 200000
): Promise<{ dataUrl: string; fileName: string; fileSizeLabel: string }> {
  const safeName = file.name.trim().slice(0, 150) || 'dokumen-siloka';
  const formatBytes = (bytes: number) =>
    bytes >= 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.max(1, Math.round(bytes / 1024))} KB`;

  if (file.type.startsWith('image/')) {
    const compressed = await compressImageFile(file, 1000, maxChars);
    const approxBytes = Math.round((compressed.length * 3) / 4);
    return {
      dataUrl: compressed,
      fileName: safeName,
      fileSizeLabel: formatBytes(approxBytes),
    };
  }

  if (!ALLOWED_DOC_EXT_RE.test(safeName)) {
    throw new Error(
      'Format file tidak didukung. Gunakan PDF, Word (.doc/.docx), Excel (.xls/.xlsx/.csv), TXT, atau gambar (JPG/PNG/WebP).'
    );
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Gagal membaca file yang diunggah.'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file yang diunggah.'));
    reader.readAsDataURL(file);
  });

  const normalized = dataUrl.trim();
  if (!isSafeMediaHref(normalized)) {
    throw new Error(
      'Tipe MIME file tidak diizinkan. Gunakan PDF, Word, Excel, CSV, TXT, atau gambar.'
    );
  }

  if (normalized.length > maxChars) {
    const maxRawKb = Math.round((maxChars * 0.72) / 1024);
    throw new Error(
      `Ukuran file melebihi batas unggah langsung (~${maxRawKb} KB). Kompres file terlebih dahulu atau tempel tautan Google Drive.`
    );
  }

  return {
    dataUrl: normalized,
    fileName: safeName,
    fileSizeLabel: formatBytes(file.size),
  };
}
