import { useState, type FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import type { Database } from '../../../lib/database.types'

interface AuthScreenProps {
  client: SupabaseClient<Database>
  error?: string
  onRetry?: () => void
}

export function AuthScreen({ client, error, onRetry }: AuthScreenProps) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatedPassword, setRepeatedPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    if (mode === 'sign-up' && password !== repeatedPassword) {
      setMessage('As senhas não coincidem.')
      return
    }
    setSubmitting(true)

    try {
      if (mode === 'sign-in') {
        const { error: signInError } = await client.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
      } else {
        const { data, error: signUpError } = await client.auth.signUp({
          email,
          password,
          options: { data: { full_name: name.trim() } },
        })
        if (signUpError) throw signUpError
        if (!data.session) setMessage('Conta criada. Confirme seu e-mail para continuar.')
      }
    } catch (submitError) {
      setMessage(submitError instanceof Error ? submitError.message : 'Não foi possível autenticar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-950 px-4 text-zinc-100">
      <section className="w-full max-w-sm rounded-md border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-6 flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-md bg-zinc-100 text-xs font-bold text-zinc-950">2s</div>
          <div>
            <h1 className="text-sm font-semibold">2sFlow</h1>
            <p className="text-xs text-zinc-500">Acesso seguro ao workspace</p>
          </div>
        </div>

        <div className="mb-5 flex gap-2 border-b border-zinc-800 pb-3">
          <button
            type="button"
            aria-pressed={mode === 'sign-in'}
            className={`text-sm ${mode === 'sign-in' ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
            onClick={() => { setMode('sign-in'); setMessage('') }}
          >
            Entrar
          </button>
          <span className="text-zinc-700">/</span>
          <button
            type="button"
            aria-pressed={mode === 'sign-up'}
            className={`text-sm ${mode === 'sign-up' ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
            onClick={() => { setMode('sign-up'); setMessage('') }}
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'sign-up' && (
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-400">Nome</span>
              <Input
                autoComplete="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Seu nome"
              />
            </label>
          )}
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-zinc-400">E-mail</span>
            <Input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@exemplo.com"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-zinc-400">Senha</span>
            <span className="relative block">
              <Input
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === 'sign-in' ? 'Digite sua senha' : 'Mínimo de 8 caracteres'}
                className="pr-11"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={showPassword}
                title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center rounded-r-md text-zinc-500 transition-colors hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400"
              >
                {showPassword ? (
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 5.2A11.5 11.5 0 0112 5c5.5 0 9 7 9 7a15.5 15.5 0 01-3.1 3.8M6.2 6.2C3.9 7.7 3 12 3 12s3.5 7 9 7c1.2 0 2.2-.3 3.1-.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                )}
              </button>
            </span>
            {mode === 'sign-up' && <span className="block text-[11px] text-zinc-600">Mínimo de 8 caracteres.</span>}
          </label>
          {mode === 'sign-up' && (
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-400">Repetir senha</span>
              <Input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                minLength={8}
                required
                value={repeatedPassword}
                onChange={(event) => setRepeatedPassword(event.target.value)}
                placeholder="Digite a senha novamente"
              />
            </label>
          )}
          <Button variant="primary" type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Aguarde...' : mode === 'sign-in' ? 'Entrar' : 'Criar conta'}
          </Button>
        </form>

        {(error || message) && <p role="alert" className="mt-4 text-xs leading-5 text-zinc-300">{error ?? message}</p>}
        {onRetry && (
          <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-4">
            <span className="text-xs text-zinc-500">Tente novamente após conferir a configuração.</span>
            <Button size="sm" onClick={onRetry}>Recarregar</Button>
          </div>
        )}
      </section>
    </main>
  )
}
