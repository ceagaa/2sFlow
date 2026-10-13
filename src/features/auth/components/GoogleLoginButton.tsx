import { useEffect, useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../../lib/database.types'

const GOOGLE_IDENTITY_SCRIPT = 'https://accounts.google.com/gsi/client'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()

type GoogleCredentialResponse = {
  credential: string
}

type GoogleButtonMode = 'signin_with' | 'signup_with'

type GoogleIdentityServices = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string
        callback: (response: GoogleCredentialResponse) => void
      }) => void
      renderButton: (
        parent: HTMLElement,
        options: {
          type: 'standard'
          theme: 'outline'
          size: 'large'
          text: GoogleButtonMode
          shape: 'rectangular'
          logo_alignment: 'left'
          width: number
        },
      ) => void
    }
  }
}

declare global {
  interface Window {
    google?: GoogleIdentityServices
  }
}

interface GoogleLoginButtonProps {
  client: SupabaseClient<Database>
  mode: 'sign-in' | 'sign-up'
}

export function GoogleLoginButton({ client, mode }: GoogleLoginButtonProps) {
  const buttonContainer = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [authenticating, setAuthenticating] = useState(false)
  const [error, setError] = useState('')
  const authenticatingRef = useRef(false)
  const initializedRef = useRef(false)
  const clientRef = useRef(client)
  const credentialHandlerRef = useRef<(response: GoogleCredentialResponse) => void>(() => {})
  clientRef.current = client

  useEffect(() => {
    let active = true
    let script: HTMLScriptElement | undefined
    let onLoad: (() => void) | undefined
    let onError: (() => void) | undefined
    const container = buttonContainer.current
    const clientId = GOOGLE_CLIENT_ID
    if (!container) return

    setLoading(true)
    setError('')
    container.replaceChildren()
    if (!clientId) {
      setLoading(false)
      setError('Login com Google não configurado. Defina VITE_GOOGLE_CLIENT_ID no arquivo .env.')
      return () => {
        active = false
      }
    }

    async function handleCredential(response: GoogleCredentialResponse) {
      if (!active || authenticatingRef.current) return
      if (!response.credential) {
        setError('O Google não retornou uma credencial válida. Tente novamente.')
        return
      }

      authenticatingRef.current = true
      setAuthenticating(true)
      setError('')

      try {
        const { error: authError } = await clientRef.current.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
        })
        if (authError) throw authError
      } catch (authError) {
        if (active) {
          setError(authError instanceof Error ? authError.message : 'Não foi possível autenticar com o Google.')
        }
      } finally {
        authenticatingRef.current = false
        if (active) setAuthenticating(false)
      }
    }

    credentialHandlerRef.current = (response) => { void handleCredential(response) }

    function renderGoogleButton(target: HTMLDivElement, googleClientId: string) {
      if (!active) return
      const google = window.google
      if (!google) {
        setLoading(false)
        setError('Não foi possível carregar o login do Google. Verifique sua conexão e tente novamente.')
        return
      }

      try {
        if (!initializedRef.current) {
          google.accounts.id.initialize({
            client_id: googleClientId,
            callback: (response) => credentialHandlerRef.current(response),
          })
          initializedRef.current = true
        }
        google.accounts.id.renderButton(target, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: mode === 'sign-in' ? 'signin_with' : 'signup_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: Math.floor(target.getBoundingClientRect().width),
        })
        setLoading(false)
      } catch (renderError) {
        setLoading(false)
        setError(renderError instanceof Error
          ? `Não foi possível iniciar o login do Google: ${renderError.message}`
          : 'Não foi possível iniciar o login do Google.')
      }
    }

    script = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_IDENTITY_SCRIPT}"]`) ?? undefined
    if (window.google) {
      renderGoogleButton(container, clientId)
    } else {
      onLoad = () => {
        const target = buttonContainer.current
        if (target && clientId) renderGoogleButton(target, clientId)
      }
      onError = () => {
        if (!active) return
        setLoading(false)
        setError('Não foi possível carregar o login do Google. Verifique sua conexão e tente novamente.')
      }

      if (!script) {
        script = document.createElement('script')
        script.src = GOOGLE_IDENTITY_SCRIPT
        script.async = true
        script.defer = true
      }
      script.addEventListener('load', onLoad)
      script.addEventListener('error', onError)
      if (!script.isConnected) document.head.appendChild(script)
    }

    return () => {
      active = false
      if (script && onLoad) script.removeEventListener('load', onLoad)
      if (script && onError) script.removeEventListener('error', onError)
    }
  }, [mode])

  return (
    <div>
      {loading && <p className="mb-2 text-center text-xs text-zinc-500">Carregando login do Google...</p>}
      <div
        ref={buttonContainer}
        aria-busy={loading || authenticating}
        className={`flex min-h-10 w-full justify-center ${authenticating ? 'pointer-events-none opacity-60' : ''}`}
      />
      {authenticating && <p role="status" className="mt-2 text-center text-xs text-zinc-400">Conectando à sua conta...</p>}
      {error && <p role="alert" className="mt-2 text-xs leading-5 text-red-300">{error}</p>}
    </div>
  )
}
