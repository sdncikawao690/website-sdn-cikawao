import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  DEFAULT_ANNOUNCEMENTS,
  DEFAULT_EKSKUL,
  DEFAULT_GALLERY,
  DEFAULT_NEWS,
  DEFAULT_PKKS,
  DEFAULT_STUDENTS_SAMPLE,
  DEFAULT_TEACHERS,
  seedInitialSchoolData,
} from '../data/seedData';
import {
  auth,
  createOrLinkTimItAuthAccount,
  db,
  handleFirestoreError,
  logoutUser,
  OperationType,
  signInWithCredentials,
  signInWithGoogle,
} from '../lib/firebase';
import {
  MAX_DOC_DATA_LEN,
  MAX_LINK_LEN,
  MAX_PHOTO_DATA_LEN,
  MAX_SILOKA_FILE_LEN,
  assertLength,
  assertValidId,
  assertValidNisn,
  assertValidTicketCode,
  clampMediaUrl,
  clampNumber,
  clampString,
  computeNisnNameHash,
  computeNisnNikHash,
  generateSafeId,
  normalizeNik,
} from '../lib/validation';
import {
  GENERATED_IMAGES,
  SCHOOL_INFO,
  TIM_IT_ACCOUNT,
  type AdminMarker,
  type Announcement,
  type EkskulReport,
  type GalleryItem,
  type NewsArticle,
  type PkksItem,
  type SilokaDocument,
  type SilokaStatus,
  type SilokaTicket,
  type SiteMediaConfig,
  type StudentRecord,
  type TeacherProfile,
  type UserAccount,
  type UserRole,
} from '../types/school';

export const DEFAULT_SITE_MEDIA: SiteMediaConfig = {
  id: 'landing',
  heroImageUrl: GENERATED_IMAGES.heroCampus,
  heroVideoUrl: '',
  principalPhotoUrl: GENERATED_IMAGES.principalPortrait,
  schoolProfileDocUrl: '',
  updatedBy: SCHOOL_INFO.principalName,
};

interface SchoolContextValue {
  user: User | null;
  authReady: boolean;
  userRole: UserRole | null;
  isPrimaryAdmin: boolean;
  isAuthorizedAdmin: boolean;
  adminMarkers: AdminMarker[];
  loadingData: boolean;
  isFirestoreSeeded: boolean;
  siteMedia: SiteMediaConfig;
  teachers: TeacherProfile[];
  news: NewsArticle[];
  gallery: GalleryItem[];
  pkksItems: PkksItem[];
  ekskulReports: EkskulReport[];
  announcements: Announcement[];
  students: StudentRecord[];
  users: UserAccount[];
  silokaTickets: SilokaTicket[];
  silokaDocuments: SilokaDocument[];
  readAnnouncementIds: string[];
  unreadAnnouncementsCount: number;
  liveNotificationToast: Announcement | null;
  dismissToast: () => void;
  markAnnouncementRead: (id: string) => void;
  markAllAnnouncementsRead: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithCredentials: (
    usernameOrEmail: string,
    password: string
  ) => Promise<{ authorized: boolean; uid: string }>;
  activateTimItAdmin: (password: string) => Promise<void>;
  revokeTimItAdmin: (uid: string) => Promise<void>;
  logout: () => Promise<void>;
  runInitialSeed: () => Promise<void>;
  // CRUD operations
  saveSiteMedia: (
    data: Omit<SiteMediaConfig, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  saveUser: (
    data: Omit<UserAccount, 'createdAt' | 'updatedAt'>,
    isEdit: boolean
  ) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
  saveTeacher: (
    data: Omit<TeacherProfile, 'createdAt' | 'updatedAt'>,
    isEdit: boolean
  ) => Promise<void>;
  removeTeacher: (id: string) => Promise<void>;
  saveStudent: (
    data: Omit<StudentRecord, 'createdAt' | 'updatedAt'>,
    isEdit: boolean
  ) => Promise<void>;
  importStudentsBatch: (
    rows: Array<Omit<StudentRecord, 'id' | 'createdAt' | 'updatedAt'>>
  ) => Promise<{ createdCount: number; updatedCount: number }>;
  removeStudent: (id: string) => Promise<void>;
  saveNews: (
    data: Omit<NewsArticle, 'createdAt' | 'updatedAt'>,
    isEdit: boolean
  ) => Promise<void>;
  removeNews: (id: string) => Promise<void>;
  saveGallery: (
    data: Omit<GalleryItem, 'createdAt' | 'updatedAt'>,
    isEdit: boolean
  ) => Promise<void>;
  removeGallery: (id: string) => Promise<void>;
  savePkks: (
    data: Omit<PkksItem, 'createdAt' | 'updatedAt'>,
    isEdit: boolean
  ) => Promise<void>;
  removePkks: (id: string) => Promise<void>;
  saveEkskul: (
    data: Omit<EkskulReport, 'createdAt' | 'updatedAt'>,
    isEdit: boolean
  ) => Promise<void>;
  removeEkskul: (id: string) => Promise<void>;
  saveAnnouncement: (
    data: Omit<Announcement, 'createdAt' | 'updatedAt'>,
    isEdit: boolean
  ) => Promise<void>;
  removeAnnouncement: (id: string) => Promise<void>;
  createSilokaTicket: (input: {
    reporterName: string;
    reporterPhone?: string;
    category: SilokaTicket['category'];
    subject: string;
    description: string;
    photoUrl?: string;
    videoUrl?: string;
    documentUrl?: string;
    documentName?: string;
  }) => Promise<string>;
  updateSilokaTicket: (
    id: string,
    updates: {
      status: SilokaStatus;
      officialResponse?: string;
      responsePhotoUrl?: string;
      responseDocUrl?: string;
      responseDocName?: string;
      photoUrl?: string;
      videoUrl?: string;
      documentUrl?: string;
      documentName?: string;
      category?: SilokaTicket['category'];
      subject?: string;
      description?: string;
    }
  ) => Promise<void>;
  removeSilokaTicket: (id: string) => Promise<void>;
  saveSilokaDocument: (
    data: Omit<SilokaDocument, 'authorUid' | 'createdAt' | 'updatedAt'>,
    isEdit: boolean
  ) => Promise<void>;
  removeSilokaDocument: (id: string) => Promise<void>;
  lookupStudentNisn: (mode: 'nama' | 'nik', queryValue: string) => Promise<string | null>;
  syncNisnLookupIndex: () => Promise<number>;
}

const SchoolContext = createContext<SchoolContextValue | null>(null);

const READ_STORAGE_KEY = 'sdncikawao_read_announcements_v1';

export function SchoolProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [hasAdminMarker, setHasAdminMarker] = useState(false);
  const [adminMarkers, setAdminMarkers] = useState<AdminMarker[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isFirestoreSeeded, setIsFirestoreSeeded] = useState(false);

  const [siteMedia, setSiteMedia] = useState<SiteMediaConfig>(DEFAULT_SITE_MEDIA);
  const [teachers, setTeachers] = useState<TeacherProfile[]>(DEFAULT_TEACHERS);
  const [news, setNews] = useState<NewsArticle[]>(DEFAULT_NEWS);
  const [gallery, setGallery] = useState<GalleryItem[]>(DEFAULT_GALLERY);
  const [pkksItems, setPkksItems] = useState<PkksItem[]>(DEFAULT_PKKS);
  const [ekskulReports, setEkskulReports] = useState<EkskulReport[]>(DEFAULT_EKSKUL);
  const [announcements, setAnnouncements] = useState<Announcement[]>(DEFAULT_ANNOUNCEMENTS);

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [silokaTickets, setSilokaTickets] = useState<SilokaTicket[]>([]);
  const [silokaDocuments, setSilokaDocuments] = useState<SilokaDocument[]>([]);

  const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(READ_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [liveNotificationToast, setLiveNotificationToast] = useState<Announcement | null>(null);
  const prevAnnouncementIdsRef = useRef<Set<string>>(new Set());
  const initialAnnouncementSyncDone = useRef(false);
  const autoSeedAttemptedRef = useRef(false);

  const isPrimaryAdmin = Boolean(
    user &&
      user.email?.toLowerCase() === SCHOOL_INFO.email.toLowerCase() &&
      user.emailVerified
  );

  const isAuthorizedAdmin = Boolean(
    isPrimaryAdmin || (user && hasAdminMarker && userRole === 'admin')
  );

  const assertAuthorizedAdmin = useCallback(() => {
    if (!isAuthorizedAdmin) {
      throw new Error(
        `Akses ditolak. Masuk sebagai ${SCHOOL_INFO.email} atau akun Tim IT aktif untuk menambah atau mengubah data.`
      );
    }
  }, [isAuthorizedAdmin]);

  const assertPrimaryAdmin = useCallback(() => {
    if (!isPrimaryAdmin) {
      throw new Error(
        `Operasi ini khusus untuk email admin utama ${SCHOOL_INFO.email}.`
      );
    }
  }, [isPrimaryAdmin]);

  const resolveUserRole = useCallback(
    async (firebaseUser: User): Promise<{ role: UserRole | null; isMarkerAdmin: boolean }> => {
      if (
        firebaseUser.email?.toLowerCase() === SCHOOL_INFO.email.toLowerCase() &&
        firebaseUser.emailVerified
      ) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        try {
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              displayName: clampString(
                firebaseUser.displayName || SCHOOL_INFO.principalName,
                100
              ),
              email: firebaseUser.email,
              role: 'admin',
              nipOrNik: SCHOOL_INFO.principalNip,
              rombel: 'Manajerial Sekolah',
              status: 'aktif',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        } catch (err) {
          console.warn('Sinkronisasi profil admin:', err);
        }
        return { role: 'admin', isMarkerAdmin: true };
      }

      try {
        const markerSnap = await getDoc(doc(db, 'admins', firebaseUser.uid));
        if (markerSnap.exists()) {
          return { role: 'admin', isMarkerAdmin: true };
        }
      } catch (err) {
        console.warn('Pemeriksaan marker admin:', err);
      }

      // Semua akun lain hanya berstatus pengunjung read-only
      return { role: null, isMarkerAdmin: false };
    },
    []
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const { role, isMarkerAdmin } = await resolveUserRole(firebaseUser);
        setUserRole(role);
        setHasAdminMarker(isMarkerAdmin);
        setUser(firebaseUser);
        if (role !== 'admin') {
          setStudents([]);
          setUsers([]);
          setSilokaTickets([]);
          setAdminMarkers([]);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setHasAdminMarker(false);
        setStudents([]);
        setUsers([]);
        setSilokaTickets([]);
        setAdminMarkers([]);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, [resolveUserRole]);

  // Load public school data once for read-only visitors; attach real-time onSnapshot when authorized admin
  useEffect(() => {
    if (!authReady) return;

    if (!user || !isAuthorizedAdmin) {
      let cancelled = false;
      const loadPublicData = async () => {
        setLoadingData(true);
        try {
          const [siteSnap, tSnap, nSnap, gSnap, pSnap, eSnap, aSnap, sdSnap] = await Promise.all([
            getDoc(doc(db, 'site_settings', 'landing')),
            getDocs(collection(db, 'teachers')),
            getDocs(collection(db, 'news')),
            getDocs(collection(db, 'gallery')),
            getDocs(collection(db, 'pkks_items')),
            getDocs(collection(db, 'ekskul_reports')),
            getDocs(collection(db, 'announcements')),
            getDocs(collection(db, 'siloka_documents')),
          ]);
          if (cancelled) return;

          if (siteSnap.exists()) {
            setSiteMedia({
              ...DEFAULT_SITE_MEDIA,
              id: siteSnap.id,
              ...(siteSnap.data() as Omit<SiteMediaConfig, 'id'>),
            });
          } else {
            setSiteMedia(DEFAULT_SITE_MEDIA);
          }

          const hasLive = !tSnap.empty || !nSnap.empty || !pSnap.empty;
          setIsFirestoreSeeded(hasLive);

          if (!tSnap.empty) {
            const list = tSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as TeacherProfile);
            list.sort((a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99));
            setTeachers(list);
          } else {
            setTeachers(DEFAULT_TEACHERS);
          }

          if (!nSnap.empty) {
            const list = nSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as NewsArticle);
            list.sort((a, b) => b.publishedDate.localeCompare(a.publishedDate));
            setNews(list);
          } else {
            setNews(DEFAULT_NEWS);
          }

          if (!gSnap.empty) {
            const list = gSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as GalleryItem);
            list.sort((a, b) => b.takenDate.localeCompare(a.takenDate));
            setGallery(list);
          } else {
            setGallery(DEFAULT_GALLERY);
          }

          if (!pSnap.empty) {
            const list = pSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as PkksItem);
            list.sort((a, b) => a.indicatorCode.localeCompare(b.indicatorCode));
            setPkksItems(list);
          } else {
            setPkksItems(DEFAULT_PKKS);
          }

          if (!eSnap.empty) {
            const list = eSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as EkskulReport);
            list.sort((a, b) => b.activityDate.localeCompare(a.activityDate));
            setEkskulReports(list);
          } else {
            setEkskulReports(DEFAULT_EKSKUL);
          }

          if (!aSnap.empty) {
            const list = aSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Announcement);
            setAnnouncements(list);
          } else {
            setAnnouncements(DEFAULT_ANNOUNCEMENTS);
          }

          if (!sdSnap.empty) {
            const list = sdSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as SilokaDocument);
            list.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
            setSilokaDocuments(list);
          } else {
            setSilokaDocuments([]);
          }
        } catch (error) {
          console.warn('Memuat tampilan dasar publik:', error);
        } finally {
          if (!cancelled) setLoadingData(false);
        }
      };

      void loadPublicData();
      return () => {
        cancelled = true;
      };
    }

    // Authenticated real-time listeners (onSnapshot)
    setLoadingData(true);
    const unsubs: Unsubscribe[] = [];

    unsubs.push(
      onSnapshot(
        doc(db, 'site_settings', 'landing'),
        (snap) => {
          if (snap.exists()) {
            setSiteMedia({
              ...DEFAULT_SITE_MEDIA,
              id: snap.id,
              ...(snap.data() as Omit<SiteMediaConfig, 'id'>),
            });
          } else {
            setSiteMedia(DEFAULT_SITE_MEDIA);
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'site_settings/landing')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'teachers'),
        (snap) => {
          if (!snap.empty) {
            setIsFirestoreSeeded(true);
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TeacherProfile);
            list.sort((a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99));
            setTeachers(list);
          } else {
            setTeachers(DEFAULT_TEACHERS);
          }
          setLoadingData(false);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'teachers')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'news'),
        (snap) => {
          if (!snap.empty) {
            setIsFirestoreSeeded(true);
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as NewsArticle);
            list.sort((a, b) => b.publishedDate.localeCompare(a.publishedDate));
            setNews(list);
          } else {
            setNews(DEFAULT_NEWS);
          }
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'news')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'gallery'),
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as GalleryItem);
            list.sort((a, b) => b.takenDate.localeCompare(a.takenDate));
            setGallery(list);
          } else {
            setGallery(DEFAULT_GALLERY);
          }
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'gallery')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'pkks_items'),
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PkksItem);
            list.sort((a, b) => a.indicatorCode.localeCompare(b.indicatorCode));
            setPkksItems(list);
          } else {
            setPkksItems(DEFAULT_PKKS);
          }
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'pkks_items')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'ekskul_reports'),
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EkskulReport);
            list.sort((a, b) => b.activityDate.localeCompare(a.activityDate));
            setEkskulReports(list);
          } else {
            setEkskulReports(DEFAULT_EKSKUL);
          }
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'ekskul_reports')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'announcements'),
        (snap) => {
          const list: Announcement[] = !snap.empty
            ? snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Announcement)
            : [...DEFAULT_ANNOUNCEMENTS];

          list.sort((a, b) => {
            const ta = a.createdAt?.seconds ?? 0;
            const tb = b.createdAt?.seconds ?? 0;
            return tb - ta;
          });
          setAnnouncements(list);

          if (initialAnnouncementSyncDone.current) {
            for (const item of list) {
              if (
                !prevAnnouncementIdsRef.current.has(item.id) &&
                item.isActive &&
                item.autoNotifyParents
              ) {
                setLiveNotificationToast(item);
                break;
              }
            }
          }
          prevAnnouncementIdsRef.current = new Set(list.map((a) => a.id));
          initialAnnouncementSyncDone.current = true;
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'announcements')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'siloka_documents'),
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SilokaDocument);
          list.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
          setSilokaDocuments(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'siloka_documents')
      )
    );

    // Admin-only PII & management listeners
    if (isAuthorizedAdmin && userRole === 'admin') {
      unsubs.push(
        onSnapshot(
          collection(db, 'users'),
          (snap) => {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as UserAccount);
            list.sort((a, b) => a.displayName.localeCompare(b.displayName));
            setUsers(list);
          },
          (error) => handleFirestoreError(error, OperationType.LIST, 'users')
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'students'),
          (snap) => {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as StudentRecord);
            list.sort(
              (a, b) => a.rombel.localeCompare(b.rombel) || a.fullName.localeCompare(b.fullName)
            );
            setStudents(list);
          },
          (error) => handleFirestoreError(error, OperationType.LIST, 'students')
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'siloka_tickets'),
          (snap) => {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SilokaTicket);
            list.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
            setSilokaTickets(list);
          },
          (error) => handleFirestoreError(error, OperationType.LIST, 'siloka_tickets')
        )
      );
    }

    if (isPrimaryAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'admins'),
          (snap) => {
            const list = snap.docs.map((d) => d.data() as AdminMarker);
            setAdminMarkers(list);
          },
          (error) => handleFirestoreError(error, OperationType.LIST, 'admins')
        )
      );
    }

    if (isAuthorizedAdmin && !autoSeedAttemptedRef.current) {
      autoSeedAttemptedRef.current = true;
      void (async () => {
        try {
          const [tCheck, pCheck, nCheck] = await Promise.all([
            getDocs(collection(db, 'teachers')),
            getDocs(collection(db, 'pkks_items')),
            getDocs(collection(db, 'news')),
          ]);
          if (tCheck.empty && pCheck.empty && nCheck.empty) {
            await seedInitialSchoolData(
              user.uid,
              clampString(user.displayName || SCHOOL_INFO.principalName, 100)
            );
            setIsFirestoreSeeded(true);
          }
        } catch (err) {
          console.warn('Inisialisasi otomatis data sekolah dilewati:', err);
        }
      })();
    }

    return () => {
      for (const u of unsubs) u();
    };
  }, [authReady, user, userRole, isAuthorizedAdmin, isPrimaryAdmin]);

  const markAnnouncementRead = useCallback((id: string) => {
    setReadAnnouncementIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const markAllAnnouncementsRead = useCallback(() => {
    const allIds = announcements.map((a) => a.id);
    setReadAnnouncementIds(allIds);
    try {
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(allIds));
    } catch {
      // ignore storage errors
    }
  }, [announcements]);

  const unreadAnnouncementsCount = useMemo(() => {
    return announcements.filter(
      (a) => a.isActive && a.autoNotifyParents && !readAnnouncementIds.includes(a.id)
    ).length;
  }, [announcements, readAnnouncementIds]);

  const loginWithGoogle = useCallback(async () => {
    await signInWithGoogle();
  }, []);

  const loginWithCredentials = useCallback(
    async (
      usernameOrEmail: string,
      password: string
    ): Promise<{ authorized: boolean; uid: string }> => {
      const signedUser = await signInWithCredentials(usernameOrEmail, password);
      const { role, isMarkerAdmin } = await resolveUserRole(signedUser);
      setUserRole(role);
      setHasAdminMarker(isMarkerAdmin);
      setUser(signedUser);
      return {
        authorized: role === 'admin' && isMarkerAdmin,
        uid: signedUser.uid,
      };
    },
    [resolveUserRole]
  );

  const activateTimItAdmin = useCallback(
    async (password: string) => {
      assertPrimaryAdmin();
      if (!user) throw new Error('Autentikasi diperlukan.');
      const targetUid = assertValidId(await createOrLinkTimItAuthAccount(password));

      try {
        await setDoc(doc(db, 'admins', targetUid), {
          uid: targetUid,
          email: TIM_IT_ACCOUNT.internalEmail,
          assignedBy: assertValidId(user.uid),
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `admins/${targetUid}`);
      }

      const userRef = doc(db, 'users', targetUid);
      try {
        const existingUser = await getDoc(userRef);
        const userPayload = {
          uid: targetUid,
          displayName: TIM_IT_ACCOUNT.displayName,
          email: TIM_IT_ACCOUNT.internalEmail,
          role: 'admin' as UserRole,
          rombel: 'Tim IT Sekolah',
          status: 'aktif' as const,
          updatedAt: serverTimestamp(),
        };
        if (existingUser.exists()) {
          await updateDoc(userRef, userPayload);
        } else {
          await setDoc(userRef, {
            ...userPayload,
            createdAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${targetUid}`);
      }
    },
    [user, assertPrimaryAdmin]
  );

  const revokeTimItAdmin = useCallback(
    async (uid: string) => {
      assertPrimaryAdmin();
      const targetUid = assertValidId(uid);
      try {
        await deleteDoc(doc(db, 'admins', targetUid));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `admins/${targetUid}`);
      }
    },
    [assertPrimaryAdmin]
  );

  const logout = useCallback(async () => {
    await logoutUser();
  }, []);

  const runInitialSeed = useCallback(async () => {
    assertAuthorizedAdmin();
    if (!user) throw new Error('Autentikasi diperlukan.');
    await seedInitialSchoolData(
      user.uid,
      clampString(user.displayName || SCHOOL_INFO.principalName, 100)
    );
    setIsFirestoreSeeded(true);
  }, [user, assertAuthorizedAdmin]);

  // ---------------------------------------------------------------------------
  // CRUD Mutations (Strictly Admin Email sdncikawao690@gmail.com)
  // ---------------------------------------------------------------------------
  const saveSiteMedia = useCallback(
    async (data: Omit<SiteMediaConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
      assertAuthorizedAdmin();
      if (!user) throw new Error('Autentikasi diperlukan.');
      const payload = {
        heroImageUrl: clampMediaUrl(
          data.heroImageUrl || GENERATED_IMAGES.heroCampus,
          MAX_PHOTO_DATA_LEN
        ),
        heroVideoUrl: clampMediaUrl(data.heroVideoUrl, MAX_LINK_LEN),
        principalPhotoUrl: clampMediaUrl(
          data.principalPhotoUrl || GENERATED_IMAGES.principalPortrait,
          MAX_PHOTO_DATA_LEN
        ),
        schoolProfileDocUrl: clampMediaUrl(data.schoolProfileDocUrl, MAX_LINK_LEN),
        updatedBy: assertLength(
          'Diperbarui Oleh',
          data.updatedBy || user.displayName || SCHOOL_INFO.principalName,
          2,
          100
        ),
        updatedAt: serverTimestamp(),
      };
      const ref = doc(db, 'site_settings', 'landing');
      try {
        const snap = await getDoc(ref);
        if (snap.exists()) {
          await updateDoc(ref, payload);
        } else {
          await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'site_settings/landing');
      }
    },
    [user, assertAuthorizedAdmin]
  );

  const saveUser = useCallback(
    async (data: Omit<UserAccount, 'createdAt' | 'updatedAt'>, isEdit: boolean) => {
      assertAuthorizedAdmin();
      if (!user) throw new Error('Autentikasi diperlukan.');
      const docId = assertValidId(isEdit ? data.id : generateSafeId('usr'));
      const payload = {
        ...(data.uid ? { uid: assertValidId(data.uid) } : {}),
        displayName: assertLength('Nama Lengkap', data.displayName, 2, 100),
        email: assertLength('Email', data.email.toLowerCase(), 5, 150),
        role: data.role,
        nipOrNik: clampString(data.nipOrNik || '', 40),
        rombel: clampString(data.rombel || '', 40),
        phone: clampString(data.phone || '', 25),
        photoUrl: clampMediaUrl(data.photoUrl, MAX_PHOTO_DATA_LEN),
        ...(data.linkedStudentId ? { linkedStudentId: assertValidId(data.linkedStudentId) } : {}),
        status: data.status,
        updatedAt: serverTimestamp(),
      };

      const ref = doc(db, 'users', docId);
      try {
        const existingSnap = isEdit ? await getDoc(ref) : null;
        if (isEdit && existingSnap?.exists()) {
          await updateDoc(ref, payload);
        } else {
          await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
        }
        if (data.uid && data.role === 'admin') {
          await setDoc(doc(db, 'admins', assertValidId(data.uid)), {
            uid: assertValidId(data.uid),
            email: payload.email,
            assignedBy: user.uid,
            createdAt: serverTimestamp(),
          });
        } else if (data.uid && data.role !== 'admin' && data.email !== SCHOOL_INFO.email) {
          try {
            await deleteDoc(doc(db, 'admins', assertValidId(data.uid)));
          } catch {
            // Admin marker may not exist
          }
        }
      } catch (error) {
        handleFirestoreError(
          error,
          isEdit ? OperationType.UPDATE : OperationType.CREATE,
          `users/${docId}`
        );
      }
    },
    [user, assertAuthorizedAdmin]
  );

  const removeUser = useCallback(
    async (id: string) => {
      assertAuthorizedAdmin();
      const docId = assertValidId(id);
      try {
        await deleteDoc(doc(db, 'users', docId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${docId}`);
      }
    },
    [assertAuthorizedAdmin]
  );

  const saveTeacher = useCallback(
    async (data: Omit<TeacherProfile, 'createdAt' | 'updatedAt'>, isEdit: boolean) => {
      assertAuthorizedAdmin();
      const docId = assertValidId(isEdit ? data.id : generateSafeId('guru'));
      const payload = {
        name: assertLength('Nama Guru', data.name, 2, 100),
        nip: clampString(data.nip || '', 40),
        position: assertLength('Jabatan', data.position, 2, 80),
        rank: clampString(data.rank || '', 60),
        rombel: clampString(data.rombel || '', 40),
        status: data.status,
        displayOrder: clampNumber(Number(data.displayOrder || 1), 0, 100),
        photoUrl: clampMediaUrl(data.photoUrl, MAX_PHOTO_DATA_LEN),
        videoUrl: clampMediaUrl(data.videoUrl, MAX_LINK_LEN),
        documentUrl: clampMediaUrl(data.documentUrl, MAX_LINK_LEN),
        updatedAt: serverTimestamp(),
      };
      const ref = doc(db, 'teachers', docId);
      try {
        const existingSnap = isEdit ? await getDoc(ref) : null;
        if (isEdit && existingSnap?.exists()) {
          await updateDoc(ref, payload);
        } else {
          await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
        }
      } catch (error) {
        handleFirestoreError(
          error,
          isEdit ? OperationType.UPDATE : OperationType.CREATE,
          `teachers/${docId}`
        );
      }
    },
    [assertAuthorizedAdmin]
  );

  const removeTeacher = useCallback(
    async (id: string) => {
      assertAuthorizedAdmin();
      const docId = assertValidId(id);
      try {
        await deleteDoc(doc(db, 'teachers', docId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `teachers/${docId}`);
      }
    },
    [assertAuthorizedAdmin]
  );

  const saveStudent = useCallback(
    async (data: Omit<StudentRecord, 'createdAt' | 'updatedAt'>, isEdit: boolean) => {
      assertAuthorizedAdmin();
      if (!user) throw new Error('Autentikasi diperlukan.');
      const docId = assertValidId(isEdit ? data.id : generateSafeId('stu'));
      const cleanNisn = assertValidNisn(data.nisn);
      const cleanFullName = assertLength('Nama Siswa', data.fullName, 2, 100);
      const cleanNik = normalizeNik(data.nik);
      const payload = {
        nisn: cleanNisn,
        nik: cleanNik,
        fullName: cleanFullName,
        rombel: data.rombel,
        gender: data.gender,
        parentName: assertLength('Nama Orang Tua', data.parentName, 2, 100),
        parentEmail: clampString(data.parentEmail.toLowerCase(), 150),
        teacherEmail: clampString(data.teacherEmail.toLowerCase(), 150),
        attendancePercent: clampNumber(Number(data.attendancePercent), 0, 100),
        nilaiFormatif: clampNumber(Number(data.nilaiFormatif), 0, 100),
        nilaiSumatif: clampNumber(Number(data.nilaiSumatif), 0, 100),
        capaianP5: data.capaianP5,
        academicNote: clampString(data.academicNote || '', 500),
        photoUrl: clampMediaUrl(data.photoUrl, MAX_PHOTO_DATA_LEN),
        videoUrl: clampMediaUrl(data.videoUrl, MAX_LINK_LEN),
        documentUrl: clampMediaUrl(data.documentUrl, MAX_LINK_LEN),
        updatedBy: assertLength(
          'Diperbarui Oleh',
          data.updatedBy || user.displayName || 'Admin',
          2,
          100
        ),
        updatedAt: serverTimestamp(),
      };
      const ref = doc(db, 'students', docId);
      try {
        const existingSnap = isEdit ? await getDoc(ref) : null;
        const oldData = existingSnap?.exists()
          ? (existingSnap.data() as Partial<StudentRecord>)
          : null;

        if (isEdit && existingSnap?.exists()) {
          await updateDoc(ref, payload);
        } else {
          await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
        }

        const newNameHash = await computeNisnNameHash(cleanFullName);
        const newNikHash =
          cleanNik.length >= 6 ? await computeNisnNikHash(cleanNik) : '';

        if (oldData?.fullName) {
          const oldNameHash = await computeNisnNameHash(oldData.fullName);
          if (oldNameHash && oldNameHash !== newNameHash) {
            try {
              await deleteDoc(doc(db, 'nisn_lookup', oldNameHash));
            } catch {
              // Ignore cleanup miss
            }
          }
        }
        if (oldData?.nik && normalizeNik(oldData.nik).length >= 6) {
          const oldNikHash = await computeNisnNikHash(oldData.nik);
          if (oldNikHash && oldNikHash !== newNikHash) {
            try {
              await deleteDoc(doc(db, 'nisn_lookup', oldNikHash));
            } catch {
              // Ignore cleanup miss
            }
          }
        }
        if (newNameHash) {
          await setDoc(doc(db, 'nisn_lookup', newNameHash), {
            nisn: cleanNisn,
            updatedAt: serverTimestamp(),
          });
        }
        if (newNikHash) {
          await setDoc(doc(db, 'nisn_lookup', newNikHash), {
            nisn: cleanNisn,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(
          error,
          isEdit ? OperationType.UPDATE : OperationType.CREATE,
          `students/${docId}`
        );
      }
    },
    [user, assertAuthorizedAdmin]
  );

  const importStudentsBatch = useCallback(
    async (
      rows: Array<Omit<StudentRecord, 'id' | 'createdAt' | 'updatedAt'>>
    ): Promise<{ createdCount: number; updatedCount: number }> => {
      assertAuthorizedAdmin();
      if (!user) throw new Error('Autentikasi diperlukan.');
      if (rows.length === 0) return { createdCount: 0, updatedCount: 0 };

      const existingByNisn = new Map<string, StudentRecord>();
      students.forEach((s) => {
        existingByNisn.set(s.nisn.trim().toLowerCase(), s);
      });

      let createdCount = 0;
      let updatedCount = 0;
      const chunkSize = 150;

      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const batch = writeBatch(db);

        for (let idx = 0; idx < chunk.length; idx++) {
          const data = chunk[idx];
          const cleanNisn = assertValidNisn(data.nisn);
          const existing = existingByNisn.get(cleanNisn.toLowerCase());
          const docId = existing
            ? assertValidId(existing.id)
            : assertValidId(generateSafeId(`stu${i + idx}`));

          const cleanFullName = assertLength('Nama Siswa', data.fullName, 2, 100);
          const cleanNik = normalizeNik(data.nik) || normalizeNik(existing?.nik);

          const payload = {
            nisn: cleanNisn,
            nik: cleanNik,
            fullName: cleanFullName,
            rombel: data.rombel,
            gender: data.gender,
            parentName: assertLength('Nama Orang Tua', data.parentName, 2, 100),
            parentEmail: clampString((data.parentEmail || '').toLowerCase(), 150),
            teacherEmail: clampString(
              (data.teacherEmail || user.email || '').toLowerCase(),
              150
            ),
            attendancePercent: clampNumber(Number(data.attendancePercent), 0, 100),
            nilaiFormatif: clampNumber(Number(data.nilaiFormatif), 0, 100),
            nilaiSumatif: clampNumber(Number(data.nilaiSumatif), 0, 100),
            capaianP5: data.capaianP5,
            academicNote: clampString(data.academicNote || '', 500),
            photoUrl: existing?.photoUrl || '',
            videoUrl: existing?.videoUrl || '',
            documentUrl: existing?.documentUrl || '',
            updatedBy: assertLength(
              'Diperbarui Oleh',
              data.updatedBy || user.displayName || 'Admin',
              2,
              100
            ),
            updatedAt: serverTimestamp(),
          };

          const ref = doc(db, 'students', docId);
          if (existing) {
            batch.update(ref, payload);
            updatedCount += 1;
          } else {
            batch.set(ref, { ...payload, createdAt: serverTimestamp() });
            createdCount += 1;
          }

          const nameHash = await computeNisnNameHash(cleanFullName);
          if (nameHash) {
            batch.set(doc(db, 'nisn_lookup', nameHash), {
              nisn: cleanNisn,
              updatedAt: serverTimestamp(),
            });
          }

          if (cleanNik.length >= 6) {
            const nikHash = await computeNisnNikHash(cleanNik);
            if (nikHash) {
              batch.set(doc(db, 'nisn_lookup', nikHash), {
                nisn: cleanNisn,
                updatedAt: serverTimestamp(),
              });
            }
          }
        }

        try {
          await batch.commit();
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'students_excel_import');
        }
      }

      return { createdCount, updatedCount };
    },
    [user, students, assertAuthorizedAdmin]
  );

  const removeStudent = useCallback(
    async (id: string) => {
      assertAuthorizedAdmin();
      const docId = assertValidId(id);
      try {
        const snap = await getDoc(doc(db, 'students', docId));
        if (snap.exists()) {
          const data = snap.data() as Partial<StudentRecord>;
          if (data.fullName) {
            const oldNameHash = await computeNisnNameHash(data.fullName);
            if (oldNameHash) {
              try {
                await deleteDoc(doc(db, 'nisn_lookup', oldNameHash));
              } catch {
                // Ignore cleanup miss
              }
            }
          }
          if (data.nik && normalizeNik(data.nik).length >= 6) {
            const oldNikHash = await computeNisnNikHash(data.nik);
            if (oldNikHash) {
              try {
                await deleteDoc(doc(db, 'nisn_lookup', oldNikHash));
              } catch {
                // Ignore cleanup miss
              }
            }
          }
        }
        await deleteDoc(doc(db, 'students', docId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `students/${docId}`);
      }
    },
    [assertAuthorizedAdmin]
  );

  const saveNews = useCallback(
    async (data: Omit<NewsArticle, 'createdAt' | 'updatedAt'>, isEdit: boolean) => {
      assertAuthorizedAdmin();
      if (!user) throw new Error('Autentikasi diperlukan.');
      const docId = assertValidId(isEdit ? data.id : generateSafeId('news'));
      const payload = {
        title: assertLength('Judul Berita', data.title, 4, 160),
        category: data.category,
        summary: assertLength('Ringkasan', data.summary, 10, 320),
        content: assertLength('Isi Berita', data.content, 10, 4000),
        imageUrl: clampMediaUrl(
          data.imageUrl || GENERATED_IMAGES.kbmClassroom,
          MAX_PHOTO_DATA_LEN
        ),
        videoUrl: clampMediaUrl(data.videoUrl, MAX_LINK_LEN),
        tiktokUrl: clampMediaUrl(data.tiktokUrl, MAX_LINK_LEN),
        documentUrl: clampMediaUrl(data.documentUrl, MAX_LINK_LEN),
        authorName: assertLength(
          'Penulis',
          data.authorName || user.displayName || SCHOOL_INFO.principalName,
          2,
          100
        ),
        publishedDate: assertLength('Tanggal Terbit', data.publishedDate, 8, 30),
        updatedAt: serverTimestamp(),
      };
      const ref = doc(db, 'news', docId);
      try {
        const existingSnap = isEdit ? await getDoc(ref) : null;
        if (isEdit && existingSnap?.exists()) {
          await updateDoc(ref, payload);
        } else {
          await setDoc(ref, {
            ...payload,
            authorUid: assertValidId(user.uid),
            createdAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(
          error,
          isEdit ? OperationType.UPDATE : OperationType.CREATE,
          `news/${docId}`
        );
      }
    },
    [user, assertAuthorizedAdmin]
  );

  const removeNews = useCallback(
    async (id: string) => {
      assertAuthorizedAdmin();
      const docId = assertValidId(id);
      try {
        await deleteDoc(doc(db, 'news', docId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `news/${docId}`);
      }
    },
    [assertAuthorizedAdmin]
  );

  const saveGallery = useCallback(
    async (data: Omit<GalleryItem, 'createdAt' | 'updatedAt'>, isEdit: boolean) => {
      assertAuthorizedAdmin();
      if (!user) throw new Error('Autentikasi diperlukan.');
      const mediaType = data.mediaType === 'video' ? 'video' : 'foto';
      const cleanedImage = clampMediaUrl(data.imageUrl, MAX_PHOTO_DATA_LEN);
      const cleanedVideo = clampMediaUrl(data.videoUrl, MAX_LINK_LEN);

      if (mediaType === 'foto' && !cleanedImage) {
        throw new Error('Silakan unggah atau masukkan URL foto untuk galeri.');
      }
      if (mediaType === 'video' && !cleanedVideo) {
        throw new Error('Silakan masukkan tautan video YouTube/Google Drive/MP4.');
      }

      const docId = assertValidId(isEdit ? data.id : generateSafeId('gal'));
      const payload = {
        title: assertLength('Judul Dokumentasi', data.title, 3, 120),
        category: data.category,
        mediaType,
        caption: assertLength('Keterangan Dokumentasi', data.caption, 5, 300),
        imageUrl: cleanedImage,
        videoUrl: cleanedVideo,
        takenDate: assertLength('Tanggal Dokumentasi', data.takenDate, 4, 30),
        updatedAt: serverTimestamp(),
      };
      const ref = doc(db, 'gallery', docId);
      try {
        const existingSnap = isEdit ? await getDoc(ref) : null;
        if (isEdit && existingSnap?.exists()) {
          await updateDoc(ref, payload);
        } else {
          await setDoc(ref, {
            ...payload,
            authorUid: assertValidId(user.uid),
            createdAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(
          error,
          isEdit ? OperationType.UPDATE : OperationType.CREATE,
          `gallery/${docId}`
        );
      }
    },
    [user, assertAuthorizedAdmin]
  );

  const removeGallery = useCallback(
    async (id: string) => {
      assertAuthorizedAdmin();
      const docId = assertValidId(id);
      try {
        await deleteDoc(doc(db, 'gallery', docId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `gallery/${docId}`);
      }
    },
    [assertAuthorizedAdmin]
  );

  const savePkks = useCallback(
    async (data: Omit<PkksItem, 'createdAt' | 'updatedAt'>, isEdit: boolean) => {
      assertAuthorizedAdmin();
      if (!user) throw new Error('Autentikasi diperlukan.');
      const docId = assertValidId(isEdit ? data.id : generateSafeId('pkks'));
      const payload = {
        component: data.component,
        indicatorCode: assertLength('Kode Indikator', data.indicatorCode, 2, 20),
        indicatorTitle: assertLength('Uraian Indikator', data.indicatorTitle, 4, 180),
        targetScore: clampNumber(Number(data.targetScore), 1, 100),
        achievedScore: clampNumber(Number(data.achievedScore), 0, 100),
        status: data.status,
        evidenceSummary: assertLength('Ringkasan Bukti Fisik', data.evidenceSummary, 4, 400),
        evidenceUrl: clampMediaUrl(data.evidenceUrl, MAX_LINK_LEN),
        evidencePhotoUrl: clampMediaUrl(data.evidencePhotoUrl, MAX_PHOTO_DATA_LEN),
        evidenceVideoUrl: clampMediaUrl(data.evidenceVideoUrl, MAX_LINK_LEN),
        updatedBy: assertLength(
          'Pembaru',
          data.updatedBy || user.displayName || SCHOOL_INFO.principalName,
          2,
          100
        ),
        updatedAt: serverTimestamp(),
      };
      const ref = doc(db, 'pkks_items', docId);
      try {
        const existingSnap = isEdit ? await getDoc(ref) : null;
        if (isEdit && existingSnap?.exists()) {
          await updateDoc(ref, payload);
        } else {
          await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
        }
      } catch (error) {
        handleFirestoreError(
          error,
          isEdit ? OperationType.UPDATE : OperationType.CREATE,
          `pkks_items/${docId}`
        );
      }
    },
    [user, assertAuthorizedAdmin]
  );

  const removePkks = useCallback(
    async (id: string) => {
      assertAuthorizedAdmin();
      const docId = assertValidId(id);
      try {
        await deleteDoc(doc(db, 'pkks_items', docId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `pkks_items/${docId}`);
      }
    },
    [assertAuthorizedAdmin]
  );

  const saveEkskul = useCallback(
    async (data: Omit<EkskulReport, 'createdAt' | 'updatedAt'>, isEdit: boolean) => {
      assertAuthorizedAdmin();
      if (!user) throw new Error('Autentikasi diperlukan.');
      const docId = assertValidId(isEdit ? data.id : generateSafeId('ekskul'));
      const payload = {
        ekskulName: data.ekskulName,
        activityTitle: assertLength('Judul Kegiatan', data.activityTitle, 4, 150),
        coachName: assertLength('Nama Pembina', data.coachName, 2, 100),
        schedule: assertLength('Jadwal', data.schedule, 3, 80),
        participantCount: clampNumber(Number(data.participantCount), 0, 500),
        activityDate: assertLength('Tanggal Kegiatan', data.activityDate, 4, 30),
        reportSummary: assertLength('Laporan Kegiatan', data.reportSummary, 10, 600),
        transparencyNote: clampString(data.transparencyNote || '', 300),
        imageUrl: clampMediaUrl(
          data.imageUrl || GENERATED_IMAGES.pramukaGarden,
          MAX_PHOTO_DATA_LEN
        ),
        videoUrl: clampMediaUrl(data.videoUrl, MAX_LINK_LEN),
        documentUrl: clampMediaUrl(data.documentUrl, MAX_LINK_LEN),
        updatedAt: serverTimestamp(),
      };
      const ref = doc(db, 'ekskul_reports', docId);
      try {
        const existingSnap = isEdit ? await getDoc(ref) : null;
        if (isEdit && existingSnap?.exists()) {
          await updateDoc(ref, payload);
        } else {
          await setDoc(ref, {
            ...payload,
            authorUid: assertValidId(user.uid),
            createdAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(
          error,
          isEdit ? OperationType.UPDATE : OperationType.CREATE,
          `ekskul_reports/${docId}`
        );
      }
    },
    [user, assertAuthorizedAdmin]
  );

  const removeEkskul = useCallback(
    async (id: string) => {
      assertAuthorizedAdmin();
      const docId = assertValidId(id);
      try {
        await deleteDoc(doc(db, 'ekskul_reports', docId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `ekskul_reports/${docId}`);
      }
    },
    [assertAuthorizedAdmin]
  );

  const saveAnnouncement = useCallback(
    async (data: Omit<Announcement, 'createdAt' | 'updatedAt'>, isEdit: boolean) => {
      assertAuthorizedAdmin();
      if (!user) throw new Error('Autentikasi diperlukan.');
      const docId = assertValidId(isEdit ? data.id : generateSafeId('ann'));
      const payload = {
        title: assertLength('Judul Pengumuman', data.title, 4, 150),
        message: assertLength('Isi Pengumuman', data.message, 8, 1000),
        priority: data.priority,
        targetRombel: data.targetRombel,
        autoNotifyParents: Boolean(data.autoNotifyParents),
        isActive: Boolean(data.isActive),
        photoUrl: clampMediaUrl(data.photoUrl, MAX_PHOTO_DATA_LEN),
        videoUrl: clampMediaUrl(data.videoUrl, MAX_LINK_LEN),
        documentUrl: clampMediaUrl(data.documentUrl, MAX_LINK_LEN),
        authorName: assertLength(
          'Pengirim',
          data.authorName || user.displayName || SCHOOL_INFO.principalName,
          2,
          100
        ),
        updatedAt: serverTimestamp(),
      };
      const ref = doc(db, 'announcements', docId);
      try {
        const existingSnap = isEdit ? await getDoc(ref) : null;
        if (isEdit && existingSnap?.exists()) {
          await updateDoc(ref, payload);
        } else {
          await setDoc(ref, {
            ...payload,
            authorUid: assertValidId(user.uid),
            createdAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(
          error,
          isEdit ? OperationType.UPDATE : OperationType.CREATE,
          `announcements/${docId}`
        );
      }
    },
    [user, assertAuthorizedAdmin]
  );

  const removeAnnouncement = useCallback(
    async (id: string) => {
      assertAuthorizedAdmin();
      const docId = assertValidId(id);
      try {
        await deleteDoc(doc(db, 'announcements', docId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `announcements/${docId}`);
      }
    },
    [assertAuthorizedAdmin]
  );

  const createSilokaTicket = useCallback(
    async (input: {
      reporterName: string;
      reporterPhone?: string;
      category: SilokaTicket['category'];
      subject: string;
      description: string;
      photoUrl?: string;
      videoUrl?: string;
      documentUrl?: string;
      documentName?: string;
    }): Promise<string> => {
      assertAuthorizedAdmin();
      if (!user || !user.email) {
        throw new Error('Autentikasi admin diperlukan.');
      }
      const docId = assertValidId(generateSafeId('slk'));
      const ticketCode = assertValidTicketCode(
        `SLK-${Math.floor(1000 + Math.random() * 9000)}`
      );
      const payload = {
        ticketCode,
        reporterUid: assertValidId(user.uid),
        reporterName: assertLength('Nama Pelapor', input.reporterName, 2, 100),
        reporterEmail: assertLength('Email Pelapor', user.email, 5, 150),
        reporterPhone: clampString(input.reporterPhone || '', 25),
        category: input.category,
        subject: assertLength('Subjek Pengaduan', input.subject, 4, 160),
        description: assertLength('Uraian Pengaduan', input.description, 10, 1500),
        photoUrl: clampMediaUrl(input.photoUrl, MAX_PHOTO_DATA_LEN),
        videoUrl: clampMediaUrl(input.videoUrl, MAX_LINK_LEN),
        documentUrl: clampMediaUrl(input.documentUrl, MAX_DOC_DATA_LEN),
        documentName: clampString(input.documentName || '', 150),
        status: 'Menunggu' as SilokaStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      try {
        await setDoc(doc(db, 'siloka_tickets', docId), payload);
        return ticketCode;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `siloka_tickets/${docId}`);
      }
    },
    [user, assertAuthorizedAdmin]
  );

  const updateSilokaTicket = useCallback(
    async (
      id: string,
      updates: {
        status: SilokaStatus;
        officialResponse?: string;
        responsePhotoUrl?: string;
        responseDocUrl?: string;
        responseDocName?: string;
        photoUrl?: string;
        videoUrl?: string;
        documentUrl?: string;
        documentName?: string;
        category?: SilokaTicket['category'];
        subject?: string;
        description?: string;
      }
    ) => {
      assertAuthorizedAdmin();
      if (!user) throw new Error('Autentikasi diperlukan.');
      const docId = assertValidId(id);
      const payload: Record<string, unknown> = {
        status: updates.status,
        updatedAt: serverTimestamp(),
      };
      if (updates.officialResponse !== undefined) {
        payload.officialResponse = clampString(updates.officialResponse, 1000);
        payload.respondedBy = clampString(user.displayName || SCHOOL_INFO.principalName, 100);
      }
      if (updates.responsePhotoUrl !== undefined) {
        payload.responsePhotoUrl = clampMediaUrl(updates.responsePhotoUrl, MAX_PHOTO_DATA_LEN);
      }
      if (updates.responseDocUrl !== undefined) {
        payload.responseDocUrl = clampMediaUrl(updates.responseDocUrl, MAX_DOC_DATA_LEN);
      }
      if (updates.responseDocName !== undefined) {
        payload.responseDocName = clampString(updates.responseDocName, 150);
      }
      if (updates.photoUrl !== undefined) {
        payload.photoUrl = clampMediaUrl(updates.photoUrl, MAX_PHOTO_DATA_LEN);
      }
      if (updates.videoUrl !== undefined) {
        payload.videoUrl = clampMediaUrl(updates.videoUrl, MAX_LINK_LEN);
      }
      if (updates.documentUrl !== undefined) {
        payload.documentUrl = clampMediaUrl(updates.documentUrl, MAX_DOC_DATA_LEN);
      }
      if (updates.documentName !== undefined) {
        payload.documentName = clampString(updates.documentName, 150);
      }
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.subject !== undefined)
        payload.subject = assertLength('Subjek', updates.subject, 4, 160);
      if (updates.description !== undefined)
        payload.description = assertLength('Deskripsi', updates.description, 10, 1500);

      try {
        await updateDoc(doc(db, 'siloka_tickets', docId), payload);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `siloka_tickets/${docId}`);
      }
    },
    [user, assertAuthorizedAdmin]
  );

  const removeSilokaTicket = useCallback(
    async (id: string) => {
      assertAuthorizedAdmin();
      const docId = assertValidId(id);
      try {
        await deleteDoc(doc(db, 'siloka_tickets', docId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `siloka_tickets/${docId}`);
      }
    },
    [assertAuthorizedAdmin]
  );

  const saveSilokaDocument = useCallback(
    async (
      data: Omit<SilokaDocument, 'authorUid' | 'createdAt' | 'updatedAt'>,
      isEdit: boolean
    ) => {
      assertAuthorizedAdmin();
      if (!user) throw new Error('Autentikasi diperlukan.');
      const docId = assertValidId(isEdit ? data.id : generateSafeId('slkdoc'));
      const fileUrl = clampMediaUrl(data.fileUrl, MAX_SILOKA_FILE_LEN);
      if (!fileUrl || fileUrl.length < 4) {
        throw new Error('Silakan unggah file atau masukkan tautan dokumen terlebih dahulu.');
      }
      const payload = {
        pillar: data.pillar,
        title: assertLength('Judul File', data.title, 3, 160),
        description: clampString(data.description || '', 500),
        fileUrl,
        fileName: clampString(data.fileName || '', 150),
        fileSizeLabel: clampString(data.fileSizeLabel || '', 40),
        uploadedBy: assertLength(
          'Pengunggah',
          data.uploadedBy || user.displayName || SCHOOL_INFO.principalName,
          2,
          100
        ),
        updatedAt: serverTimestamp(),
      };
      const ref = doc(db, 'siloka_documents', docId);
      try {
        const existingSnap = isEdit ? await getDoc(ref) : null;
        if (isEdit && existingSnap?.exists()) {
          await updateDoc(ref, payload);
        } else {
          await setDoc(ref, {
            ...payload,
            authorUid: assertValidId(user.uid),
            createdAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(
          error,
          isEdit ? OperationType.UPDATE : OperationType.CREATE,
          `siloka_documents/${docId}`
        );
      }
    },
    [user, assertAuthorizedAdmin]
  );

  const removeSilokaDocument = useCallback(
    async (id: string) => {
      assertAuthorizedAdmin();
      const docId = assertValidId(id);
      try {
        await deleteDoc(doc(db, 'siloka_documents', docId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `siloka_documents/${docId}`);
      }
    },
    [assertAuthorizedAdmin]
  );

  const lookupStudentNisn = useCallback(
    async (mode: 'nama' | 'nik', queryValue: string): Promise<string | null> => {
      let hash = '';
      if (mode === 'nama') {
        const cleanName = queryValue.trim();
        if (cleanName.length < 2) {
          throw new Error('Masukkan nama lengkap peserta didik minimal 2 karakter.');
        }
        hash = await computeNisnNameHash(cleanName);
      } else {
        const cleanNik = normalizeNik(queryValue);
        if (cleanNik.length < 6) {
          throw new Error('Masukkan NIK peserta didik yang valid (angka minimal 6 digit).');
        }
        hash = await computeNisnNikHash(cleanNik);
      }

      if (!hash) {
        throw new Error('Periksa kembali kata kunci pencarian yang dimasukkan.');
      }

      try {
        const snap = await getDoc(doc(db, 'nisn_lookup', hash));
        if (snap.exists()) {
          const data = snap.data() as { nisn?: string };
          return data.nisn ? String(data.nisn) : null;
        }
        if (!isFirestoreSeeded) {
          if (mode === 'nama') {
            const normalizedQueryName = queryValue.trim().replace(/\s+/g, ' ').toLowerCase();
            const sampleMatch = DEFAULT_STUDENTS_SAMPLE.find(
              (s) =>
                s.fullName.trim().replace(/\s+/g, ' ').toLowerCase() === normalizedQueryName
            );
            if (sampleMatch) return sampleMatch.nisn;
          } else {
            const cleanNik = normalizeNik(queryValue);
            const sampleMatch = DEFAULT_STUDENTS_SAMPLE.find(
              (s) => normalizeNik(s.nik) === cleanNik
            );
            if (sampleMatch) return sampleMatch.nisn;
          }
        }
        return null;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `nisn_lookup/${hash}`);
      }
    },
    [isFirestoreSeeded]
  );

  const syncNisnLookupIndex = useCallback(async (): Promise<number> => {
    assertAuthorizedAdmin();
    if (students.length === 0) return 0;

    let synced = 0;
    const chunkSize = 200;
    for (let i = 0; i < students.length; i += chunkSize) {
      const chunk = students.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const s of chunk) {
        let indexed = false;
        const nameHash = await computeNisnNameHash(s.fullName);
        if (nameHash) {
          batch.set(doc(db, 'nisn_lookup', nameHash), {
            nisn: s.nisn,
            updatedAt: serverTimestamp(),
          });
          indexed = true;
        }
        const cleanNik = normalizeNik(s.nik);
        if (cleanNik.length >= 6) {
          const nikHash = await computeNisnNikHash(cleanNik);
          if (nikHash) {
            batch.set(doc(db, 'nisn_lookup', nikHash), {
              nisn: s.nisn,
              updatedAt: serverTimestamp(),
            });
            indexed = true;
          }
        }
        if (indexed) synced += 1;
      }
      try {
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'nisn_lookup_sync');
      }
    }
    return synced;
  }, [students, assertAuthorizedAdmin]);

  const value: SchoolContextValue = {
    user,
    authReady,
    userRole,
    isPrimaryAdmin,
    isAuthorizedAdmin,
    adminMarkers,
    loadingData,
    isFirestoreSeeded,
    siteMedia,
    teachers,
    news,
    gallery,
    pkksItems,
    ekskulReports,
    announcements,
    students,
    users,
    silokaTickets,
    silokaDocuments,
    readAnnouncementIds,
    unreadAnnouncementsCount,
    liveNotificationToast,
    dismissToast: () => setLiveNotificationToast(null),
    markAnnouncementRead,
    markAllAnnouncementsRead,
    loginWithGoogle,
    loginWithCredentials,
    activateTimItAdmin,
    revokeTimItAdmin,
    logout,
    runInitialSeed,
    saveSiteMedia,
    saveUser,
    removeUser,
    saveTeacher,
    removeTeacher,
    saveStudent,
    importStudentsBatch,
    removeStudent,
    saveNews,
    removeNews,
    saveGallery,
    removeGallery,
    savePkks,
    removePkks,
    saveEkskul,
    removeEkskul,
    saveAnnouncement,
    removeAnnouncement,
    createSilokaTicket,
    updateSilokaTicket,
    removeSilokaTicket,
    saveSilokaDocument,
    removeSilokaDocument,
    lookupStudentNisn,
    syncNisnLookupIndex,
  };

  return <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>;
}

export function useSchool(): SchoolContextValue {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error('useSchool must be used inside SchoolProvider');
  return ctx;
}
