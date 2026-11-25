import React, { useMemo, useRef, useState } from 'react';
import {
  Download,
  Edit2,
  Eye,
  FileText,
  FolderOpen,
  MessageSquareReply,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { readDocumentFileAsDataUrl } from '../../lib/media';
import { MAX_SILOKA_FILE_LEN } from '../../lib/validation';
import {
  SILOKA_PILLARS,
  type SilokaCategory,
  type SilokaDocument,
  type SilokaPillar,
  type SilokaStatus,
  type SilokaTicket,
} from '../../types/school';
import { Icon3D } from '../Icon3D';
import { MediaPicker } from '../MediaPicker';
import { AttachmentStrip } from '../MediaViewer';
import { SilokaFilePreviewModal } from '../SilokaFilePreviewModal';

const PILLAR_OPTIONS: SilokaPillar[] = [
  'Perencanaan',
  'Pengorganisasian',
  'Pelaksana',
  'Program Unggulan',
  'Evaluasi',
];

export function SilokaTab() {
  const {
    user,
    userRole,
    silokaTickets,
    silokaDocuments,
    createSilokaTicket,
    updateSilokaTicket,
    removeSilokaTicket,
    saveSilokaDocument,
    removeSilokaDocument,
  } = useSchool();

  const canRespond = userRole === 'admin' || userRole === 'guru';

  const [statusFilter, setStatusFilter] = useState<'all' | SilokaStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | SilokaCategory>('all');
  const [respondModal, setRespondModal] = useState<SilokaTicket | null>(null);
  const [newStatus, setNewStatus] = useState<SilokaStatus>('Diproses');
  const [officialResponse, setOfficialResponse] = useState('');
  const [responsePhotoUrl, setResponsePhotoUrl] = useState('');
  const [responseDocUrl, setResponseDocUrl] = useState('');
  const [responseDocName, setResponseDocName] = useState('');
  const [editTicketPhotoUrl, setEditTicketPhotoUrl] = useState('');
  const [editTicketVideoUrl, setEditTicketVideoUrl] = useState('');
  const [editTicketDocUrl, setEditTicketDocUrl] = useState('');
  const [editTicketDocName, setEditTicketDocName] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create ticket modal
  const [createOpen, setCreateOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<SilokaCategory>('Perencanaan');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [documentName, setDocumentName] = useState('');

  // 5-Pillar SILOKA File Upload Modal & Preview
  const docFileInputRef = useRef<HTMLInputElement>(null);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docIsEdit, setDocIsEdit] = useState(false);
  const [docBusy, setDocBusy] = useState(false);
  const [docUploading, setDocUploading] = useState(false);
  const [docErrorMsg, setDocErrorMsg] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<SilokaDocument | null>(null);
  const [docForm, setDocForm] = useState<{
    id: string;
    pillar: SilokaPillar;
    title: string;
    description: string;
    fileUrl: string;
    fileName: string;
    fileSizeLabel: string;
    uploadedBy: string;
  }>({
    id: '',
    pillar: 'Perencanaan',
    title: '',
    description: '',
    fileUrl: '',
    fileName: '',
    fileSizeLabel: '',
    uploadedBy: user?.displayName || '',
  });

  const filteredDocs = useMemo(() => {
    if (categoryFilter === 'all') return silokaDocuments;
    return silokaDocuments.filter((d) => d.pillar === categoryFilter);
  }, [silokaDocuments, categoryFilter]);

  const filteredTickets = useMemo(() => {
    return silokaTickets.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      return true;
    });
  }, [silokaTickets, statusFilter, categoryFilter]);

  const openUploadDoc = (presetPillar?: SilokaPillar) => {
    const activePillar: SilokaPillar =
      presetPillar ||
      (PILLAR_OPTIONS.includes(categoryFilter as SilokaPillar)
        ? (categoryFilter as SilokaPillar)
        : 'Perencanaan');
    setDocIsEdit(false);
    setDocForm({
      id: '',
      pillar: activePillar,
      title: '',
      description: '',
      fileUrl: '',
      fileName: '',
      fileSizeLabel: '',
      uploadedBy: user?.displayName || 'Admin SDN Cikawao',
    });
    setDocErrorMsg(null);
    setDocModalOpen(true);
  };

  const openEditDoc = (item: SilokaDocument) => {
    setDocIsEdit(true);
    setDocForm({
      id: item.id,
      pillar: item.pillar,
      title: item.title,
      description: item.description || '',
      fileUrl: item.fileUrl,
      fileName: item.fileName || '',
      fileSizeLabel: item.fileSizeLabel || '',
      uploadedBy: item.uploadedBy,
    });
    setDocErrorMsg(null);
    setDocModalOpen(true);
  };

  const handlePillarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setDocErrorMsg(null);
    setDocUploading(true);
    try {
      const { dataUrl, fileName, fileSizeLabel } = await readDocumentFileAsDataUrl(
        file,
        MAX_SILOKA_FILE_LEN
      );
      setDocForm((prev) => ({
        ...prev,
        fileUrl: dataUrl,
        fileName,
        fileSizeLabel,
        title: prev.title.trim() ? prev.title : fileName.replace(/\.[^.]+$/, ''),
      }));
    } catch (err) {
      setDocErrorMsg(
        err instanceof Error ? err.message : 'Gagal membaca file yang dipilih.'
      );
    } finally {
      setDocUploading(false);
    }
  };

  const submitDocForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocBusy(true);
    setDocErrorMsg(null);
    try {
      await saveSilokaDocument(docForm, docIsEdit);
      setDocModalOpen(false);
    } catch (err) {
      setDocErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan file.');
    } finally {
      setDocBusy(false);
    }
  };

  const openRespond = (t: SilokaTicket) => {
    setRespondModal(t);
    setNewStatus(t.status);
    setOfficialResponse(t.officialResponse || '');
    setResponsePhotoUrl(t.responsePhotoUrl || '');
    setResponseDocUrl(t.responseDocUrl || '');
    setResponseDocName(t.responseDocName || '');
    setEditTicketPhotoUrl(t.photoUrl || '');
    setEditTicketVideoUrl(t.videoUrl || '');
    setEditTicketDocUrl(t.documentUrl || '');
    setEditTicketDocName(t.documentName || '');
    setErrorMsg(null);
  };

  const submitRespond = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondModal) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      await updateSilokaTicket(respondModal.id, {
        status: newStatus,
        officialResponse,
        responsePhotoUrl,
        responseDocUrl,
        responseDocName,
        ...(userRole === 'admin'
          ? {
              photoUrl: editTicketPhotoUrl,
              videoUrl: editTicketVideoUrl,
              documentUrl: editTicketDocUrl,
              documentName: editTicketDocName,
            }
          : {}),
      });
      setRespondModal(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan tindak lanjut.');
    } finally {
      setBusy(false);
    }
  };

  const submitNewTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg(null);
    try {
      await createSilokaTicket({
        reporterName: user?.displayName || 'Orang Tua Murid',
        reporterPhone: phone,
        category,
        subject,
        description,
        photoUrl,
        videoUrl,
        documentUrl,
        documentName,
      });
      setSubject('');
      setDescription('');
      setPhotoUrl('');
      setVideoUrl('');
      setDocumentUrl('');
      setDocumentName('');
      setCreateOpen(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal mengirim aduan.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Icon3D name="siloka" size="md" />
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 font-display">
              SILOKA — Dokumen 5 Unsur Manajemen & Layanan Pengaduan
            </h2>
            <p className="text-xs text-slate-600">
              Unggah dan tampilkan file Perencanaan, Pengorganisasian, Pelaksana, Program Unggulan,
              Evaluasi, serta tindak lanjut pengaduan masyarakat
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canRespond && (
            <button
              type="button"
              onClick={() => openUploadDoc()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl btn-3d-emerald cursor-pointer whitespace-nowrap shrink-0"
            >
              <Upload className="w-4 h-4" />
              Upload File SILOKA
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setCreateOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-[0_4px_0_#4338ca] hover:-translate-y-0.5 transition-transform rounded-xl cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Buat Aduan
          </button>
        </div>
      </div>

      {/* 5 Aspek SILOKA Interactive Filter Strip (Files + Tickets) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {SILOKA_PILLARS.map((p) => {
          const docCount = silokaDocuments.filter((d) => d.pillar === p.id).length;
          const ticketCount = silokaTickets.filter((t) => t.category === p.id).length;
          const active = categoryFilter === p.id;
          return (
            <div
              key={p.id}
              className={`rounded-2xl border-2 transition-colors flex flex-col justify-between ${
                active
                  ? 'bg-violet-600 text-white border-violet-700'
                  : 'bg-white border-violet-200 hover:border-violet-400 text-slate-900'
              }`}
            >
              <button
                type="button"
                onClick={() => setCategoryFilter(active ? 'all' : p.id)}
                className="text-left p-3.5 cursor-pointer flex-1"
              >
                <div className="flex items-center justify-between gap-2 text-xs font-mono font-bold tabular-nums mb-1">
                  <span className={active ? 'text-amber-200' : 'text-violet-700'}>{p.code}</span>
                  <span className={active ? 'text-violet-100' : 'text-slate-500'}>
                    {docCount} file · {ticketCount} tiket
                  </span>
                </div>
                <p className="text-sm font-extrabold font-display">{p.id}</p>
                <p
                  className={`text-[11px] line-clamp-2 mt-1 ${
                    active ? 'text-violet-100' : 'text-slate-600'
                  }`}
                >
                  {p.description}
                </p>
              </button>
              {canRespond && (
                <div
                  className={`px-3.5 pb-3 pt-1 border-t ${
                    active ? 'border-violet-500/60' : 'border-violet-100'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => openUploadDoc(p.id as SilokaPillar)}
                    className={`inline-flex items-center gap-1 text-[11px] font-bold cursor-pointer ${
                      active
                        ? 'text-amber-200 hover:text-white'
                        : 'text-emerald-700 hover:text-emerald-900'
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                    Upload {p.id}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* BAGIAN 1: ARSIP FILE 5 UNSUR SILOKA (PERENCANAAN .. EVALUASI)         */}
      {/* ===================================================================== */}
      <div className="bg-white border-2 border-violet-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 bg-violet-50/80 border-b border-violet-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <FolderOpen className="w-5 h-5 text-violet-700" />
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 font-display">
                Arsip File{' '}
                {categoryFilter === 'all'
                  ? 'Perencanaan, Pengorganisasian, Pelaksana, Program Unggulan & Evaluasi'
                  : categoryFilter}
              </h3>
              <p className="text-xs text-slate-600">
                Menampilkan {filteredDocs.length} file terunggah
                {categoryFilter !== 'all' ? ` untuk bidang ${categoryFilter}` : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(['all', ...PILLAR_OPTIONS] as const).map((pil) => (
              <button
                key={pil}
                type="button"
                onClick={() => setCategoryFilter(pil)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg cursor-pointer transition-colors whitespace-nowrap ${
                  categoryFilter === pil
                    ? 'bg-violet-600 text-white'
                    : 'bg-white border border-violet-200 text-slate-700 hover:text-violet-800'
                }`}
              >
                {pil === 'all' ? 'Semua Unsur' : pil}
              </button>
            ))}
          </div>
        </div>

        {filteredDocs.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm text-slate-500">
              Belum ada file diunggah
              {categoryFilter !== 'all' ? ` pada unsur ${categoryFilter}` : ''}.
            </p>
            {canRespond && (
              <button
                type="button"
                onClick={() => openUploadDoc()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl btn-3d-emerald cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload File Pertama
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-violet-100 bg-slate-50/70 text-xs font-bold text-slate-700">
                  <th className="py-3 px-5">Nama & Deskripsi File</th>
                  <th className="py-3 px-4">Unsur SILOKA</th>
                  <th className="py-3 px-4">File & Ukuran</th>
                  <th className="py-3 px-4">Pengunggah</th>
                  <th className="py-3 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-100 text-sm">
                {filteredDocs.map((docItem) => {
                  const isData = docItem.fileUrl.startsWith('data:');
                  return (
                    <tr key={docItem.id} className="hover:bg-violet-50/35">
                      <td className="py-3.5 px-5 align-top max-w-md">
                        <div className="flex items-start gap-2.5">
                          <FileText className="w-4 h-4 text-violet-700 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-slate-900">{docItem.title}</p>
                            {docItem.description && (
                              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                                {docItem.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 align-top whitespace-nowrap font-bold text-violet-700 text-xs">
                        {docItem.pillar}
                      </td>
                      <td className="py-3.5 px-4 align-top text-xs text-slate-600">
                        <p className="font-mono truncate max-w-[190px]">
                          {docItem.fileName || (isData ? 'Dokumen terunggah' : 'Tautan Eksternal')}
                        </p>
                        {docItem.fileSizeLabel && (
                          <p className="font-mono tabular-nums text-[11px] text-slate-500">
                            {docItem.fileSizeLabel}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 align-top text-xs text-slate-700">
                        {docItem.uploadedBy}
                      </td>
                      <td className="py-3.5 px-5 align-top text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(docItem)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-violet-800 hover:bg-violet-50 rounded-lg mr-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Lihat
                        </button>
                        {isData ? (
                          <a
                            href={docItem.fileUrl}
                            download={docItem.fileName || docItem.title}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg mr-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Unduh
                          </a>
                        ) : (
                          <a
                            href={docItem.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg mr-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Buka
                          </a>
                        )}
                        {canRespond && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditDoc(docItem)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-sky-700 hover:bg-sky-50 rounded-lg mr-1 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Ubah
                            </button>
                            <button
                              type="button"
                              onClick={() => void removeSilokaDocument(docItem.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Hapus
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* BAGIAN 2: TIKET PENGADUAN & ASPIRASI MASYARAKAT                       */}
      {/* ===================================================================== */}
      <div className="bg-white border-2 border-violet-200 rounded-2xl divide-y divide-violet-100 overflow-hidden">
        <div className="px-5 py-3.5 bg-violet-50/50 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-extrabold text-slate-900 font-display">
            Daftar Tiket Pengaduan Masyarakat ({filteredTickets.length})
          </h3>
          <div className="flex items-center gap-1 p-1 bg-white border border-violet-200 rounded-xl">
            {(['all', 'Menunggu', 'Diproses', 'Selesai'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                  statusFilter === st
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-indigo-700'
                }`}
              >
                {st === 'all' ? 'Semua' : st}
              </button>
            ))}
          </div>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Belum ada tiket SILOKA pada filter ini.
          </div>
        ) : (
          filteredTickets.map((t) => (
            <div key={t.id} className="p-5 space-y-3 hover:bg-violet-50/35">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono font-bold text-indigo-700">{t.ticketCode}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-slate-700">{t.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>Pelapor: {t.reporterName}</span>
                  {t.reporterPhone && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{t.reporterPhone}</span>
                    </>
                  )}
                </div>

                <span
                  className={`text-xs font-bold ${
                    t.status === 'Selesai'
                      ? 'text-emerald-700'
                      : t.status === 'Diproses'
                        ? 'text-amber-700'
                        : 'text-rose-700'
                  }`}
                >
                  {t.status}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">{t.subject}</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">{t.description}</p>
                <AttachmentStrip
                  photoUrl={t.photoUrl}
                  videoUrl={t.videoUrl}
                  documentUrl={t.documentUrl}
                  documentName={t.documentName}
                  title={`Bukti Aduan ${t.ticketCode}`}
                  compact
                />
              </div>

              {(t.officialResponse || t.responsePhotoUrl || t.responseDocUrl) && (
                <div className="p-3.5 bg-emerald-50 border-2 border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-2">
                  {t.officialResponse && (
                    <p>
                      <span className="font-bold text-emerald-800">Tanggapan Sekolah:</span>{' '}
                      {t.officialResponse}
                    </p>
                  )}
                  <AttachmentStrip
                    photoUrl={t.responsePhotoUrl}
                    documentUrl={t.responseDocUrl}
                    documentName={t.responseDocName}
                    title={`Tindak Lanjut ${t.ticketCode}`}
                    compact
                  />
                  {t.respondedBy && (
                    <span className="block text-[11px] font-medium text-emerald-700">
                      Oleh: {t.respondedBy}
                    </span>
                  )}
                </div>
              )}

              {canRespond && (
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => openRespond(t)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-200 rounded-xl cursor-pointer"
                  >
                    <MessageSquareReply className="w-3.5 h-3.5" />
                    Tanggapi / Lampirkan Bukti
                  </button>
                  {userRole === 'admin' && (
                    <button
                      type="button"
                      onClick={() => void removeSilokaTicket(t.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Upload / Edit 5-Pillar SILOKA File Modal */}
      {docModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-emerald-200 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-between">
              <h3 className="text-base font-bold font-display">
                {docIsEdit ? 'Ubah File SILOKA' : 'Upload File Unsur SILOKA'}
              </h3>
              <button
                type="button"
                onClick={() => setDocModalOpen(false)}
                className="p-1.5 text-white/90 hover:text-white rounded-lg hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => void submitDocForm(e)} className="p-6 space-y-4">
              {docErrorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                  {docErrorMsg}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Aspek / Unsur SILOKA
                </label>
                <select
                  value={docForm.pillar}
                  onChange={(e) =>
                    setDocForm({ ...docForm, pillar: e.target.value as SilokaPillar })
                  }
                  className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl bg-white"
                >
                  {PILLAR_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Dokumen / File
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={160}
                  value={docForm.title}
                  onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                  placeholder="Contoh: Dokumen Perencanaan RKAS Semester Ganjil"
                  className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan Singkat (Opsional)
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={docForm.description}
                  onChange={(e) => setDocForm({ ...docForm, description: e.target.value })}
                  placeholder="Ringkasan isi dokumen atau periode berlaku..."
                  className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    Pilih File dari Perangkat atau Tautan URL
                  </span>
                  <div>
                    <input
                      ref={docFileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp"
                      onChange={(e) => void handlePillarFileSelect(e)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={docUploading}
                      onClick={() => docFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl cursor-pointer disabled:opacity-60"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {docUploading
                        ? 'Memproses File...'
                        : docForm.fileUrl
                          ? 'Ganti File dari Perangkat'
                          : 'Pilih File (.pdf/.docx/.xlsx/foto)'}
                    </button>
                  </div>
                </div>

                {docForm.fileUrl.startsWith('data:') && (
                  <div className="flex items-center justify-between gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950">
                    <span className="inline-flex items-center gap-1.5 font-semibold truncate">
                      <FileText className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span className="truncate">
                        {docForm.fileName || 'File siap diunggah'}
                      </span>
                      {docForm.fileSizeLabel && (
                        <span className="font-mono text-[11px] text-emerald-700 shrink-0">
                          ({docForm.fileSizeLabel})
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDocForm((prev) => ({
                          ...prev,
                          fileUrl: '',
                          fileName: '',
                          fileSizeLabel: '',
                        }))
                      }
                      className="px-2 py-1 text-[11px] font-bold text-rose-700 bg-white border border-rose-200 rounded-lg cursor-pointer shrink-0"
                    >
                      Hapus
                    </button>
                  </div>
                )}

                <input
                  type="text"
                  maxLength={MAX_SILOKA_FILE_LEN}
                  value={docForm.fileUrl.startsWith('data:') ? '' : docForm.fileUrl}
                  onChange={(e) =>
                    setDocForm({
                      ...docForm,
                      fileUrl: e.target.value,
                      fileName: e.target.value ? '' : docForm.fileName,
                      fileSizeLabel: e.target.value ? 'Tautan URL' : '',
                    })
                  }
                  placeholder={
                    docForm.fileUrl.startsWith('data:')
                      ? `File "${docForm.fileName}" siap disimpan (atau tempel URL untuk mengganti)`
                      : 'Atau tempel URL Google Drive / link dokumen (https://...)'
                  }
                  className="w-full px-3 py-2 text-xs border-2 border-slate-200 rounded-xl bg-white font-mono"
                />
                <p className="text-[11px] text-slate-500">
                  Mendukung unggah file langsung PDF, Word, Excel, CSV, TXT, atau foto/scan hingga
                  ~250 KB, serta tautan Google Drive untuk dokumen besar.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setDocModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={docBusy || docUploading}
                  className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl btn-3d-emerald cursor-pointer disabled:opacity-60"
                >
                  {docBusy ? 'Menyimpan...' : 'Simpan File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Respond Modal */}
      {respondModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-violet-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 px-6 py-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white flex items-center justify-between">
              <h3 className="text-base font-bold font-display">
                Tindak Lanjut Tiket {respondModal.ticketCode}
              </h3>
              <button
                type="button"
                onClick={() => setRespondModal(null)}
                className="p-1.5 text-white/90 hover:text-white rounded-lg hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => void submitRespond(e)} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                  {errorMsg}
                </div>
              )}
              <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl text-xs text-slate-700">
                <p className="font-bold text-slate-900">{respondModal.subject}</p>
                <p className="mt-1">{respondModal.description}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Penanganan
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as SilokaStatus)}
                  className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl bg-white"
                >
                  <option value="Menunggu">Menunggu</option>
                  <option value="Diproses">Diproses</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggapan Resmi SDN Cikawao
                </label>
                <textarea
                  required
                  rows={3}
                  maxLength={1000}
                  value={officialResponse}
                  onChange={(e) => setOfficialResponse(e.target.value)}
                  placeholder="Tuliskan penjelasan atau solusi tindak lanjut sekolah..."
                  className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                />
              </div>

              <MediaPicker
                photoLabel="Foto Bukti Tindak Lanjut / Penyelesaian Sekolah (Opsional)"
                photoUrl={responsePhotoUrl}
                onPhotoChange={setResponsePhotoUrl}
                showPresets={false}
                docLabel="Upload File / Tautan Dokumen Tindak Lanjut (Opsional)"
                documentUrl={responseDocUrl}
                onDocumentChange={setResponseDocUrl}
                allowDocFileUpload
                documentName={responseDocName}
                onDocumentNameChange={setResponseDocName}
              />

              {userRole === 'admin' && (
                <MediaPicker
                  photoLabel="Foto Bukti Aduan Pelapor (Admin Dapat Memperbarui)"
                  photoUrl={editTicketPhotoUrl}
                  onPhotoChange={setEditTicketPhotoUrl}
                  showPresets={false}
                  videoLabel="Video Bukti Aduan Pelapor (Opsional)"
                  videoUrl={editTicketVideoUrl}
                  onVideoChange={setEditTicketVideoUrl}
                  docLabel="Upload File / Lampiran Aduan (Admin Dapat Memperbarui)"
                  documentUrl={editTicketDocUrl}
                  onDocumentChange={setEditTicketDocUrl}
                  allowDocFileUpload
                  documentName={editTicketDocName}
                  onDocumentNameChange={setEditTicketDocName}
                />
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRespondModal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 shadow-[0_4px_0_#4338ca] rounded-xl cursor-pointer"
                >
                  {busy ? 'Menyimpan...' : 'Simpan Tanggapan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-violet-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 px-6 py-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white flex items-center justify-between">
              <h3 className="text-base font-bold font-display">
                Kirim Pengaduan SILOKA Baru
              </h3>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="p-1.5 text-white/90 hover:text-white rounded-lg hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => void submitNewTicket(e)} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                  {errorMsg}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SilokaCategory)}
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Perencanaan">Perencanaan</option>
                    <option value="Pengorganisasian">Pengorganisasian</option>
                    <option value="Pelaksana">Pelaksana</option>
                    <option value="Program Unggulan">Program Unggulan</option>
                    <option value="Evaluasi">Evaluasi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. WhatsApp (Opsional)
                  </label>
                  <input
                    type="tel"
                    maxLength={25}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subjek Pengaduan
                </label>
                <input
                  type="text"
                  required
                  minLength={4}
                  maxLength={160}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Uraian Lengkap
                </label>
                <textarea
                  required
                  rows={4}
                  minLength={10}
                  maxLength={1500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                />
              </div>

              <MediaPicker
                photoLabel="Foto Bukti / Dokumentasi Aduan (Opsional)"
                photoUrl={photoUrl}
                onPhotoChange={setPhotoUrl}
                showPresets={false}
                videoLabel="Tautan Video Bukti Aduan (Opsional)"
                videoUrl={videoUrl}
                onVideoChange={setVideoUrl}
                docLabel="Upload File / Dokumen Pendukung (PDF, Word, Excel, Gambar)"
                documentUrl={documentUrl}
                onDocumentChange={setDocumentUrl}
                allowDocFileUpload
                documentName={documentName}
                onDocumentNameChange={setDocumentName}
              />

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 shadow-[0_4px_0_#4338ca] rounded-xl cursor-pointer"
                >
                  {busy ? 'Mengirim...' : 'Kirim Aduan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SilokaFilePreviewModal
        docItem={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
}
