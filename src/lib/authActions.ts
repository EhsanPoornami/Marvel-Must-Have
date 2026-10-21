import {
  createUserWithEmailAndPassword, GoogleAuthProvider, sendPasswordResetEmail, signInWithEmailAndPassword,
  signInWithPopup, signInWithRedirect, signOut as fbSignOut,
} from 'firebase/auth'
import { auth } from './firebase'

const MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'Indirizzo email non valido.',
  'auth/missing-password': 'Inserisci la password.',
  'auth/weak-password': 'La password deve avere almeno 6 caratteri.',
  'auth/email-already-in-use': 'Esiste già un account con questa email: usa "Accedi".',
  'auth/invalid-credential': 'Email o password non corretti.',
  'auth/wrong-password': 'Email o password non corretti.',
  'auth/user-not-found': 'Nessun account con questa email.',
  'auth/too-many-requests': 'Troppi tentativi: riprova tra qualche minuto.',
  'auth/network-request-failed': 'Connessione assente: riprova quando sei online.',
  'auth/popup-closed-by-user': 'Accesso annullato.',
  'auth/cancelled-popup-request': 'Accesso annullato.',
  'auth/unauthorized-domain': 'Questo indirizzo non è autorizzato in Firebase (Authentication → Settings → Authorized domains).',
  'auth/operation-not-allowed': 'Metodo di accesso non attivo in Firebase (Authentication → Sign-in method).',
}

export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? ''
  return MESSAGES[code] ?? `Errore di accesso${code ? ` (${code})` : ''}.`
}

export async function signInWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  try {
    await signInWithPopup(auth!, provider)
  } catch (err) {
    // Some mobile browsers block popups: fall back to a full-page redirect.
    if ((err as { code?: string })?.code === 'auth/popup-blocked') await signInWithRedirect(auth!, provider)
    else throw err
  }
}

export const signInWithEmail = (email: string, password: string) => signInWithEmailAndPassword(auth!, email.trim(), password)
export const signUpWithEmail = (email: string, password: string) => createUserWithEmailAndPassword(auth!, email.trim(), password)
export const resetPassword = (email: string) => sendPasswordResetEmail(auth!, email.trim())
export const signOut = () => fbSignOut(auth!)
