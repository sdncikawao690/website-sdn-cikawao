import { deleteApp, initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { TIM_IT_ACCOUNT } from '../types/school';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
export const FIREBASE_AUTH_PROVIDERS_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`;
export const FIREBASE_AUTH_USERS_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/users`;

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export class FirebaseAuthUiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'FirebaseAuthUiError';
    this.code = code;
  }
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
    return false;
  }
}

export function resolveAdminLoginEmail(usernameOrEmail: string): string {
  const normalized = usernameOrEmail.trim().replace(/\s+/g, ' ').toLowerCase();
  if (!normalized) {
    throw new FirebaseAuthUiError(
      'auth/missing-username',
      'Masukkan username (tim it sdn cikawao) atau email admin.'
    );
  }
  if ((TIM_IT_ACCOUNT.aliases as readonly string[]).includes(normalized)) {
    return TIM_IT_ACCOUNT.internalEmail;
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return normalized;
  }
  throw new FirebaseAuthUiError(
    'auth/unknown-username',
    `Username tidak dikenali. Gunakan "${TIM_IT_ACCOUNT.username}" atau email admin terdaftar.`
  );
}

function mapAuthError(err: unknown): FirebaseAuthUiError {
  const rawCode =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: unknown }).code || '')
      : '';

  if (err instanceof FirebaseAuthUiError) return err;

  switch (rawCode) {
    case 'auth/operation-not-allowed':
      return new FirebaseAuthUiError(
        rawCode,
        'Metode login Email/Password belum diaktifkan di Firebase Console. Aktifkan terlebih dahulu pada menu Authentication -> Sign-in method -> Email/Password.'
      );
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return new FirebaseAuthUiError(
        rawCode,
        'Username atau password belum sesuai, atau akun Tim IT belum dibuat/diaktifkan melalui menu Manajemen Pengguna (Google Admin) / Firebase Console.'
      );
    case 'auth/weak-password':
      return new FirebaseAuthUiError(
        rawCode,
        'Password minimal 6 karakter sesuai ketentuan keamanan.'
      );
    case 'auth/too-many-requests':
      return new FirebaseAuthUiError(
        rawCode,
        'Terlalu banyak percobaan login. Tunggu beberapa saat lalu coba kembali.'
      );
    case 'auth/user-disabled':
      return new FirebaseAuthUiError(
        rawCode,
        'Akun ini sedang dinonaktifkan oleh administrator Firebase.'
      );
    default:
      return new FirebaseAuthUiError(
        rawCode || 'auth/unknown',
        err instanceof Error ? err.message : 'Gagal melakukan autentikasi.'
      );
  }
}

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signInWithCredentials(
  usernameOrEmail: string,
  password: string
): Promise<User> {
  const email = resolveAdminLoginEmail(usernameOrEmail);
  if (!password || password.length < 4) {
    throw new FirebaseAuthUiError(
      'auth/missing-password',
      'Masukkan password dengan benar.'
    );
  }
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (err) {
    throw mapAuthError(err);
  }
}

/**
 * Creates or links the Tim IT Email/Password Firebase Auth user via an isolated secondary
 * Firebase app instance so the active Google Admin session remains signed in uninterrupted.
 */
export async function createOrLinkTimItAuthAccount(password: string): Promise<string> {
  if (!password || password.length < 6) {
    throw new FirebaseAuthUiError(
      'auth/weak-password',
      'Password Tim IT minimal 6 karakter.'
    );
  }

  const secondaryApp = initializeApp(
    firebaseConfig,
    `timItProvisioner_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  );
  const secondaryAuth = getAuth(secondaryApp);

  try {
    let targetUser: User;
    try {
      const created = await createUserWithEmailAndPassword(
        secondaryAuth,
        TIM_IT_ACCOUNT.internalEmail,
        password
      );
      targetUser = created.user;
    } catch (err) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code || '')
          : '';
      if (code === 'auth/email-already-in-use') {
        const signedIn = await signInWithEmailAndPassword(
          secondaryAuth,
          TIM_IT_ACCOUNT.internalEmail,
          password
        );
        targetUser = signedIn.user;
      } else {
        throw err;
      }
    }

    await updateProfile(targetUser, {
      displayName: TIM_IT_ACCOUNT.displayName,
    }).catch(() => undefined);

    return targetUser.uid;
  } catch (err) {
    throw mapAuthError(err);
  } finally {
    await signOut(secondaryAuth).catch(() => undefined);
    await deleteApp(secondaryApp).catch(() => undefined);
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

void testConnection();
