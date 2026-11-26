import React, { useState } from 'react';
import {
  Camera,
  Edit2,
  ExternalLink,
  Play,
  Plus,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { isSafeMediaHref, parseVideoUrl } from '../../lib/media';
import {
  GENERATED_IMAGES,
  NEWS_CATEGORIES,
  type GalleryCategory,
  type GalleryItem,
  type GalleryMediaType,
  type NewsArticle,
  type NewsCategory,
} from '../../types/school';
import { Icon3D } from '../Icon3D';
import { MediaPicker } from '../MediaPicker';
import { SafeImage } from '../SafeImage';

export function NewsGalleryTab() {
  const { user, news, gallery, saveNews, removeNews, saveGallery, removeGallery } =
    useSchool();
  const [subTab, setSubTab] = useState<'news' | 'gallery'>('news');

  // News modal state
  const [newsModal, setNewsModal] = useState(false);
  const [isEditNews, setIsEditNews] = useState(false);
  const [newsForm, setNewsForm] = useState<Omit<NewsArticle, 'createdAt' | 'updatedAt'>>({
    id: '',
    title: '',
    category: 'KBM',
    summary: '',
    content: '',
    imageUrl: GENERATED_IMAGES.kbmClassroom,
    videoUrl: '',
    tiktokUrl: '',
    documentUrl: '',
    authorName: user?.displayName || 'Admin SDN Cikawao',
    authorUid: user?.uid || '',
    publishedDate: new Date().toISOString().slice(0, 10),
  });

  // Gallery modal state
  const [galModal, setGalModal] = useState(false);
  const [isEditGal, setIsEditGal] = useState(false);
  const [galForm, setGalForm] = useState<Omit<GalleryItem, 'createdAt' | 'updatedAt'>>({
    id: '',
    title: '',
    category: 'KBM',
    mediaType: 'foto',
    caption: '',
    imageUrl: GENERATED_IMAGES.kbmClassroom,
    videoUrl: '',
    takenDate: new Date().toISOString().slice(0, 10),
    authorUid: user?.uid || '',
  });

  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openCreateNews = () => {
    setIsEditNews(false);
    setNewsForm({
      id: '',
      title: '',
      category: 'KBM',
      summary: '',
      content: '',
      imageUrl: GENERATED_IMAGES.kbmClassroom,
      videoUrl: '',
      tiktokUrl: '',
      documentUrl: '',
      authorName: user?.displayName || 'Admin SDN Cikawao',
      authorUid: user?.uid || '',
      publishedDate: new Date().toISOString().slice(0, 10),
    });
    setErrorMsg(null);
    setNewsModal(true);
  };

  const openEditNews = (n: NewsArticle) => {
    setIsEditNews(true);
    setNewsForm({
      id: n.id,
      title: n.title,
      category: n.category,
      summary: n.summary,
      content: n.content,
      imageUrl: n.imageUrl,
      videoUrl: n.videoUrl || '',
      tiktokUrl: n.tiktokUrl || '',
      documentUrl: n.documentUrl || '',
      authorName: n.authorName,
      authorUid: n.authorUid,
      publishedDate: n.publishedDate,
    });
    setErrorMsg(null);
    setNewsModal(true);
  };

  const openCreateGal = () => {
    setIsEditGal(false);
    setGalForm({
      id: '',
      title: '',
      category: 'KBM',
      mediaType: 'foto',
      caption: '',
      imageUrl: GENERATED_IMAGES.heroCampus,
      videoUrl: '',
      takenDate: new Date().toISOString().slice(0, 10),
      authorUid: user?.uid || '',
    });
    setErrorMsg(null);
    setGalModal(true);
  };

  const openEditGal = (g: GalleryItem) => {
    setIsEditGal(true);
    setGalForm({
      id: g.id,
      title: g.title,
      category: g.category,
      mediaType: g.mediaType || (g.videoUrl ? 'video' : 'foto'),
      caption: g.caption,
      imageUrl: g.imageUrl,
      videoUrl: g.videoUrl || '',
      takenDate: g.takenDate,
      authorUid: g.authorUid,
    });
    setErrorMsg(null);
    setGalModal(true);
  };

  const submitNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg(null);
    try {
      await saveNews(newsForm, isEditNews);
      setNewsModal(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan berita.');
    } finally {
      setBusy(false);
    }
  };

  const submitGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg(null);
    try {
      await saveGallery(galForm, isEditGal);
      setGalModal(false);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal menyimpan dokumentasi galeri.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Icon3D name={subTab === 'news' ? 'news' : 'gallery'} size="md" />
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 font-display">
              {subTab === 'news'
                ? 'Kelola Berita & Kegiatan Belajar Mengajar'
                : 'Kelola Galeri Foto & Video Dokumentasi Sekolah'}
            </h2>
            <p className="text-xs text-slate-600">
              Unggah atau ganti foto, tambahkan video dokumentasi, serta tautan berkas KBM untuk
              orang tua murid
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-sky-50 border-2 border-sky-200 rounded-xl">
            <button
              type="button"
              onClick={() => setSubTab('news')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                subTab === 'news'
                  ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-sky-800'
              }`}
            >
              Berita & KBM ({news.length})
            </button>
            <button
              type="button"
              onClick={() => setSubTab('gallery')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                subTab === 'gallery'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              Galeri Foto & Video ({gallery.length})
            </button>
          </div>

          <button
            type="button"
            onClick={subTab === 'news' ? openCreateNews : openCreateGal}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white rounded-xl cursor-pointer whitespace-nowrap shrink-0 ${
              subTab === 'news'
                ? 'bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-600 hover:to-sky-700 btn-3d-sky'
                : 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-[0_4px_0_#be123c] hover:-translate-y-0.5 transition-transform'
            }`}
          >
            <Plus className="w-4 h-4" />
            {subTab === 'news' ? 'Tulis Berita KBM' : 'Tambah Foto / Video'}
          </button>
        </div>
      </div>

      {subTab === 'news' ? (
        <div className="bg-white border-2 border-sky-200 rounded-2xl overflow-hidden">
          <div className="divide-y divide-sky-100">
            {news.map((item) => (
              <div
                key={item.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-sky-50/40"
              >
                <div className="flex items-start gap-4">
                  <div className="w-24 h-16 rounded-xl overflow-hidden bg-sky-50 border border-sky-200 shrink-0 relative">
                    <SafeImage
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    {item.videoUrl && (
                      <span className="absolute bottom-1 right-1 bg-rose-600 text-white p-1 rounded-md shadow">
                        <Video className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-0.5">
                      <span className="font-bold text-sky-700">{item.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{item.publishedDate}</span>
                      {item.videoUrl && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-bold text-rose-600">Dilengkapi Video</span>
                        </>
                      )}
                      {item.tiktokUrl && isSafeMediaHref(item.tiktokUrl) && (
                        <>
                          <span aria-hidden="true">·</span>
                          <a
                            href={item.tiktokUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 font-bold text-slate-900 dark:text-cyan-300 hover:underline"
                          >
                            TikTok
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </>
                      )}
                      {item.documentUrl && (
                        <>
                          <span aria-hidden="true">·</span>
                          <a
                            href={item.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 font-bold text-emerald-700 hover:underline"
                          >
                            Dokumen
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                      {item.summary}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => openEditNews(item)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-50 rounded-lg cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Ubah
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeNews(item.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {gallery.map((g) => {
            const isVideo = g.mediaType === 'video' || Boolean(g.videoUrl);
            const parsedVid = parseVideoUrl(g.videoUrl);
            const thumbSrc = g.imageUrl || parsedVid?.youtubeThumb || GENERATED_IMAGES.kbmClassroom;

            return (
              <div
                key={g.id}
                className="bg-white border-2 border-rose-200 rounded-2xl overflow-hidden flex flex-col hover:border-rose-300 transition-colors"
              >
                <div className="aspect-[4/3] bg-rose-50 overflow-hidden relative">
                  <SafeImage
                    src={thumbSrc}
                    alt={g.title}
                    className="w-full h-full object-cover"
                  />
                  {isVideo && (
                    <div className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600/95 text-white text-[11px] font-bold shadow">
                      <Play className="w-3 h-3 fill-white" />
                      Video
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <span className="font-bold text-rose-700">{g.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{g.takenDate}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{g.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 flex-1">{g.caption}</p>
                  <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-rose-100">
                    <button
                      type="button"
                      onClick={() => openEditGal(g)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-sky-700 hover:bg-sky-50 rounded-lg cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Ubah
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeGallery(g.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* News Modal */}
      {newsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-sky-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-cyan-500 to-sky-600 text-white px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-base font-bold font-display">
                {isEditNews ? 'Ubah Berita & Dokumentasi' : 'Tulis Berita & KBM Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setNewsModal(false)}
                className="p-1.5 text-white/90 hover:text-white rounded-lg hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => void submitNews(e)} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                  {errorMsg}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Berita
                </label>
                <input
                  type="text"
                  required
                  minLength={4}
                  maxLength={160}
                  value={newsForm.title}
                  onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={newsForm.category}
                    onChange={(e) =>
                      setNewsForm({ ...newsForm, category: e.target.value as NewsCategory })
                    }
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl bg-white"
                  >
                    {NEWS_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Publikasi
                  </label>
                  <input
                    type="date"
                    required
                    value={newsForm.publishedDate}
                    onChange={(e) =>
                      setNewsForm({ ...newsForm, publishedDate: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <MediaPicker
                photoLabel="Foto Utama Berita"
                photoUrl={newsForm.imageUrl}
                onPhotoChange={(val) => setNewsForm({ ...newsForm, imageUrl: val })}
                videoLabel="Video Liputan KBM / Kegiatan (Opsional)"
                videoUrl={newsForm.videoUrl || ''}
                onVideoChange={(val) => setNewsForm({ ...newsForm, videoUrl: val })}
                docLabel="Tautan Dokumen / Unduhan Lampiran (Opsional)"
                documentUrl={newsForm.documentUrl || ''}
                onDocumentChange={(val) => setNewsForm({ ...newsForm, documentUrl: val })}
              />

              <div className="bg-slate-50/80 border-2 border-slate-200 rounded-2xl p-4 space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-slate-900 text-white inline-flex items-center justify-center shrink-0">
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                      className="w-3.5 h-3.5"
                    >
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2 6.34 6.34 0 0 0 9.49 21.5a6.34 6.34 0 0 0 6.34-6.34V8.76a8.16 8.16 0 0 0 4.76 1.52V6.84a4.86 4.86 0 0 1-1-.15Z" />
                    </svg>
                  </span>
                  <span>Link TikTok Dokumentasi (Opsional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    maxLength={500}
                    value={newsForm.tiktokUrl || ''}
                    onChange={(e) => setNewsForm({ ...newsForm, tiktokUrl: e.target.value })}
                    placeholder="https://www.tiktok.com/@sdncikawao/video/... atau https://vt.tiktok.com/..."
                    className="flex-1 px-3 py-2 text-xs border-2 border-slate-200 rounded-xl bg-white font-mono"
                  />
                  {newsForm.tiktokUrl && (
                    <button
                      type="button"
                      onClick={() => setNewsForm({ ...newsForm, tiktokUrl: '' })}
                      className="px-2.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl cursor-pointer shrink-0"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span>
                    Tempel tautan video TikTok kegiatan KBM, sekolah, atau ekstrakulikuler.
                  </span>
                  {newsForm.tiktokUrl && isSafeMediaHref(newsForm.tiktokUrl) && (
                    <a
                      href={newsForm.tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-sky-700 hover:underline"
                    >
                      Pratinjau Link TikTok
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ringkasan Singkat (10–320 karakter)
                </label>
                <textarea
                  required
                  rows={2}
                  minLength={10}
                  maxLength={320}
                  value={newsForm.summary}
                  onChange={(e) => setNewsForm({ ...newsForm, summary: e.target.value })}
                  className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Isi Lengkap Berita
                </label>
                <textarea
                  required
                  rows={5}
                  minLength={10}
                  maxLength={4000}
                  value={newsForm.content}
                  onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                  className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setNewsModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-sky-600 rounded-xl btn-3d-sky cursor-pointer"
                >
                  {busy ? 'Menyimpan...' : 'Publikasikan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      {galModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-rose-200 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 px-6 py-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white flex items-center justify-between">
              <h3 className="text-base font-bold font-display">
                {isEditGal ? 'Ubah Dokumentasi Galeri' : 'Tambah Foto / Video Galeri'}
              </h3>
              <button
                type="button"
                onClick={() => setGalModal(false)}
                className="p-1.5 text-white/90 hover:text-white rounded-lg hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => void submitGallery(e)} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Jenis Dokumentasi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'foto', label: 'Foto Dokumentasi', icon: Camera },
                      { id: 'video', label: 'Video Dokumentasi', icon: Video },
                    ] as const
                  ).map((item) => {
                    const IconComp = item.icon;
                    const active = (galForm.mediaType || 'foto') === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          setGalForm({
                            ...galForm,
                            mediaType: item.id as GalleryMediaType,
                          })
                        }
                        className={`flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-xl border-2 cursor-pointer transition-colors ${
                          active
                            ? 'bg-rose-50 border-rose-500 text-rose-800'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-rose-200'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Dokumentasi
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={120}
                  value={galForm.title}
                  onChange={(e) => setGalForm({ ...galForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={galForm.category}
                    onChange={(e) =>
                      setGalForm({ ...galForm, category: e.target.value as GalleryCategory })
                    }
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl bg-white"
                  >
                    <option value="KBM">KBM</option>
                    <option value="Ekstrakurikuler">Ekstrakurikuler</option>
                    <option value="Seni Budaya">Seni Budaya</option>
                    <option value="Lingkungan Sekolah">Lingkungan Sekolah</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Dokumentasi
                  </label>
                  <input
                    type="date"
                    required
                    value={galForm.takenDate}
                    onChange={(e) => setGalForm({ ...galForm, takenDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <MediaPicker
                photoLabel={
                  galForm.mediaType === 'video'
                    ? 'Gambar Sampul / Thumbnail Video (Opsional)'
                    : 'Foto Dokumentasi Galeri'
                }
                photoUrl={galForm.imageUrl}
                onPhotoChange={(val) => setGalForm({ ...galForm, imageUrl: val })}
                videoLabel="Tautan Video Dokumentasi (YouTube / Google Drive / MP4)"
                videoUrl={galForm.videoUrl || ''}
                onVideoChange={(val) => setGalForm({ ...galForm, videoUrl: val })}
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan Dokumentasi
                </label>
                <textarea
                  required
                  rows={2}
                  minLength={5}
                  maxLength={300}
                  value={galForm.caption}
                  onChange={(e) => setGalForm({ ...galForm, caption: e.target.value })}
                  className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setGalModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-[0_4px_0_#be123c] rounded-xl cursor-pointer"
                >
                  {busy ? 'Menyimpan...' : 'Simpan Dokumentasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
