import { useEffect, useState } from 'react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import App from '../../../App'
import { AuthScreen } from './AuthScreen'
import { Button } from '../../../components/ui/Button'
import { isSupabaseConfigured, supabase, supabaseConfigurationError } from '../../../lib/supabase'
import {
  getWorkspaceSnapshot,
  loadUserWorkspace,
  isNetworkFailure,
  persistShadowSnapshot,
  saveUserWorkspace,
  subscribeWorkspaceStores,
  type WorkspaceSnapshot,
} from '../../../lib/supabaseSync'
import type { Database } from '../../../lib/database.types'

export function AuthGate() {
  if (supabaseConfigurationError) {
    return (
      <main className="grid min-h-screen place-items-center bg-zinc-950 px-6 text-zinc-100">
        <section className="max-w-lg rounded-md border border-zinc-800 bg-zinc-900 p-6">
          <h1 className="text-sm font-semibold">Configuração do Supabase incompleta</h1>
          <p className="mt-2 text-sm text-zinc-400">{supabaseConfigurationError}</p>
        </section>
      </main>
    )
  }

  if (!isSupabaseConfigured || !supabase) return <App />
  return <AuthenticatedApp client={supabase} />
}

function AuthenticatedApp({ client }: { client: SupabaseClient<Database> }) {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [dataReady, setDataReady] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [syncError, setSyncError] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'syncing'>('online')
  const [retry, setRetry] = useState(0)
  const userId = session?.user.id

  useEffect(() => {
    let active = true
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      setAuthReady(true)
    })

    void client.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) setLoadError(error.message)
      setSession(data.session)
      setAuthReady(true)
    }).catch((error: unknown) => {
      if (active) setLoadError(error instanceof Error ? error.message : 'Não foi possível recuperar a sessão.')
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [client])

  useEffect(() => {
    if (!userId) {
      setDataReady(false)
      return
    }

    let active = true
    setDataReady(false)
    setLoadError('')
    setSyncError('')
    void loadUserWorkspace(client, userId).then((result) => {
      if (active) {
        setConnectionStatus(result.offline ? 'offline' : 'online')
        setSyncError(result.offline
          ? 'Sem conexão com o Supabase. As alterações ficam salvas localmente e serão sincronizadas quando a conexão voltar.'
          : '')
        setDataReady(true)
      }
    }).catch((error: unknown) => {
      if (!active) return
      if (isNetworkFailure(error)) {
        setConnectionStatus('offline')
        setSyncError('Sem conexão com o Supabase. As alterações ficam salvas localmente e serão sincronizadas quando a conexão voltar.')
        setDataReady(true)
        return
      }
      setLoadError(error instanceof Error ? error.message : 'Não foi possível carregar os dados do Supabase.')
    })

    return () => {
      active = false
    }
  }, [client, retry, userId])

  useEffect(() => {
    if (!userId) return

    function handleOffline() {
      setConnectionStatus('offline')
      setSyncError('Sem conexão com o Supabase. As alterações ficam salvas localmente e serão sincronizadas quando a conexão voltar.')
    }

    function handleOnline() {
      setConnectionStatus('syncing')
      setDataReady(false)
      setRetry((value) => value + 1)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    if (!navigator.onLine) handleOffline()
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [userId])

  useEffect(() => {
    if (!userId || !dataReady) return
    const ownerId = userId
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined
    let pendingSave = Promise.resolve()
    let lastSaved: WorkspaceSnapshot = getWorkspaceSnapshot()

    function scheduleSave() {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        const snapshot = getWorkspaceSnapshot()
        pendingSave = pendingSave.then(async () => {
          await saveUserWorkspace(client, ownerId, snapshot, lastSaved)
          lastSaved = snapshot
          persistShadowSnapshot(ownerId, snapshot)
          if (active) {
            setConnectionStatus('online')
            setSyncError('')
          }
        }).catch((error: unknown) => {
          if (!active) return
          const message = isNetworkFailure(error)
            ? 'Sem conexão com o Supabase. As alterações ficam salvas localmente e serão sincronizadas quando a conexão voltar.'
            : error instanceof Error ? error.message : 'Não foi possível sincronizar com o Supabase.'
          if (isNetworkFailure(error)) setConnectionStatus('offline')
          setSyncError(message)
        })
      }, 300)
    }

    const unsubscribe = subscribeWorkspaceStores(scheduleSave)
    return () => {
      active = false
      if (timer) clearTimeout(timer)
      unsubscribe()
    }
  }, [client, dataReady, userId])

  async function signOut() {
    const { error } = await client.auth.signOut()
    if (error) setSyncError(`Não foi possível sair: ${error.message}`)
  }

  if (!authReady) return <LoadingScreen label="Verificando sessão..." />
  if (!userId) return <AuthScreen client={client} error={loadError || undefined} />
  if (loadError) {
    return (
      <>
        <AuthScreen client={client} error={loadError} onRetry={() => setRetry((value) => value + 1)} />
        <Button className="fixed bottom-4 right-4" size="sm" onClick={() => void signOut()}>Sair</Button>
      </>
    )
  }
  if (!dataReady) return <LoadingScreen label="Carregando seus dados..." />

  return (
    <>
      <App accountEmail={session?.user.email} onSignOut={signOut} />
      {(connectionStatus !== 'online' || syncError) && (
        <div role="status" className="fixed bottom-4 right-4 flex max-w-[min(30rem,calc(100vw-2rem))] items-center gap-3 rounded-md border border-zinc-700 bg-zinc-900 px-4 py-3 text-xs text-zinc-200 shadow-xl">
          <span>{syncError || (connectionStatus === 'syncing' ? 'Reconectando e sincronizando alterações...' : 'Sincronizado com o Supabase.')}</span>
          {syncError && <button className="shrink-0 text-zinc-500 hover:text-zinc-100" aria-label="Fechar aviso" onClick={() => setSyncError('')}>×</button>}
        </div>
      )}
    </>
  )
}

function LoadingScreen({ label }: { label: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-zinc-950 text-sm text-zinc-400">
      {label}
    </main>
  )
}
