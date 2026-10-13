import { useEffect } from 'react'

type LegalDocument = 'privacy' | 'terms'

const updatedAt = '13 de outubro de 2026'
const contactEmail = 'admin@2swebtech.com.br'

interface LegalPageProps {
  document: LegalDocument
}

export function LegalPage({ document }: LegalPageProps) {
  const isPrivacy = document === 'privacy'
  const title = isPrivacy ? 'Política de Privacidade' : 'Termos de Serviço'

  useEffect(() => {
    window.document.title = `${title} | 2sFlow`
  }, [title])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <a href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="grid size-8 place-items-center rounded-md bg-zinc-100 text-xs font-bold text-zinc-950">2s</span>
            2sFlow
          </a>
          <nav aria-label="Documentos legais" className="flex gap-4 text-xs text-zinc-400 sm:gap-6 sm:text-sm">
            <a href="/privacidade" aria-current={isPrivacy ? 'page' : undefined} className="hover:text-zinc-100 aria-[current=page]:text-zinc-100">
              Privacidade
            </a>
            <a href="/termos" aria-current={!isPrivacy ? 'page' : undefined} className="hover:text-zinc-100 aria-[current=page]:text-zinc-100">
              Termos
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-8 border-b border-zinc-800 pb-6">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">2sFlow · App de gestão de tarefas</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-3 text-sm text-zinc-500">Última atualização: {updatedAt}</p>
        </div>

        {isPrivacy ? <PrivacyPolicy /> : <TermsOfService />}

        <footer className="mt-12 flex flex-col gap-3 border-t border-zinc-800 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Responsável: 2swebtech</span>
          <a className="text-zinc-300 hover:text-white" href={`mailto:${contactEmail}`}>{contactEmail}</a>
        </footer>
      </main>
    </div>
  )
}

function PrivacyPolicy() {
  return (
    <div className="space-y-8 text-sm leading-7 text-zinc-300">
      <section>
        <h2 className="text-base font-semibold text-zinc-100">1. Sobre esta política</h2>
        <p className="mt-2">
          Esta política explica como o 2sFlow trata informações quando você usa o app para organizar
          workspaces, projetos e tarefas. O responsável pelo serviço é 2swebtech.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-100">2. Informações tratadas</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            <strong className="text-zinc-100">Conta:</strong> nome e e-mail fornecidos no cadastro,
            além da credencial usada para autenticação. A senha é processada pelo Supabase Auth e
            não é incluída nos dados de tarefas do app.
          </li>
          <li>
            <strong className="text-zinc-100">Conteúdo:</strong> workspaces, projetos, colunas,
            tarefas, descrições, prioridades, datas e subtarefas que você criar.
          </li>
          <li>
            <strong className="text-zinc-100">Preferências:</strong> tema, largura da barra lateral,
            sessão e cópias locais necessárias para o funcionamento offline e a sincronização.
          </li>
        </ul>
        <p className="mt-3">
          O app não usa ferramentas de analytics ou publicidade e não realiza coleta anônima ou
          rastreamento comportamental.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-100">3. Como os dados são armazenados</h2>
        <p className="mt-2">
          Sem configuração de nuvem, os dados de uso ficam no armazenamento local do navegador
          (localStorage) do dispositivo. Eles podem ser removidos ao limpar os dados do navegador.
        </p>
        <p className="mt-2">
          Quando o Supabase está configurado, a autenticação e a sincronização usam os serviços
          Supabase Auth e Supabase Database. O conteúdo é associado à sua conta e as políticas de
          segurança do banco limitam o acesso às linhas do próprio usuário. O app também mantém
          uma cópia local para permitir o uso offline e sincroniza alterações quando a conexão
          retorna.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-100">4. Serviços de terceiros</h2>
        <p className="mt-2">
          O Supabase é utilizado para autenticação e armazenamento em nuvem somente quando essa
          integração está configurada na instalação que você utiliza. A versão atual do app oferece
          cadastro e login por e-mail e senha; não há login com Google implementado na interface.
        </p>
        <p className="mt-2">
          O app carrega a fonte Inter pelo Google Fonts. Para fornecer a fonte, o navegador faz
          requisições aos domínios do Google Fonts, que podem receber dados técnicos da conexão,
          como o endereço IP e informações do navegador, conforme as políticas do Google.
        </p>
        <p className="mt-2">
          O serviço de hospedagem também pode processar dados técnicos necessários para entregar
          o site e proteger sua infraestrutura, de acordo com as próprias práticas e políticas.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-100">5. Finalidades e bases do tratamento</h2>
        <p className="mt-2">
          As informações são usadas para criar e manter sua conta, autenticar o acesso, salvar e
          sincronizar seu conteúdo, oferecer recursos offline e manter a segurança e o funcionamento
          do app. Quando aplicável, o tratamento se baseia na execução do serviço solicitado, no
          cumprimento de obrigações legais e no legítimo interesse de manter a segurança e a
          operação do serviço, respeitados seus direitos.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-100">6. Compartilhamento e retenção</h2>
        <p className="mt-2">
          Não vendemos seus dados nem os compartilhamos para publicidade. O compartilhamento fica
          limitado aos provedores descritos nesta política, quando necessários para operar os
          recursos que você utiliza, ou a situações exigidas por lei.
        </p>
        <p className="mt-2">
          Os dados locais permanecem no navegador até serem removidos por você ou pelo próprio
          navegador. Os dados em nuvem permanecem enquanto a conta e o serviço estiverem ativos,
          salvo obrigação legal de conservação. Para solicitar a exclusão de dados associados à
          conta, escreva para o contato ao final desta página; cópias técnicas de segurança podem
          permanecer pelo período necessário aos ciclos de retenção do provedor.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-100">7. Seus direitos</h2>
        <p className="mt-2">
          Nos termos da legislação aplicável, incluindo a LGPD, você pode solicitar confirmação
          do tratamento, acesso, correção, portabilidade, informação sobre compartilhamento,
          anonimização ou exclusão quando cabível, além de revogar consentimento quando essa for a
          base aplicável. Para exercer seus direitos, entre em contato pelo e-mail indicado abaixo.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-100">8. Segurança e alterações</h2>
        <p className="mt-2">
          Adotamos os controles disponíveis no app e nos provedores utilizados para proteger as
          informações. Nenhum sistema conectado à internet pode oferecer garantia absoluta de
          segurança. Esta política pode ser atualizada; a data no início da página indica a versão
          vigente.
        </p>
      </section>
    </div>
  )
}

function TermsOfService() {
  return (
    <div className="space-y-8 text-sm leading-7 text-zinc-300">
      <section>
        <h2 className="text-base font-semibold text-zinc-100">1. Aceitação e serviço</h2>
        <p className="mt-2">
          Ao acessar ou usar o 2sFlow, você concorda com estes Termos. O 2sFlow é um app de gestão
          de tarefas que permite organizar workspaces, projetos, quadros, listas e tarefas. Alguns
          recursos de conta e sincronização dependem de o Supabase estar configurado na instalação
          que você utiliza.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-100">2. Conta e uso responsável</h2>
        <p className="mt-2">
          Quando houver cadastro, forneça informações corretas e mantenha suas credenciais em
          segurança. Você é responsável pelas atividades realizadas em sua conta e pelo conteúdo
          que adiciona. Não use o serviço para fins ilícitos, para tentar acessar dados de terceiros
          ou para comprometer o funcionamento e a segurança do app.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-100">3. Seus dados e conteúdo</h2>
        <p className="mt-2">
          Você mantém a responsabilidade pelo conteúdo que cria e deve ter autorização para inserir
          quaisquer informações pessoais ou materiais de terceiros. Você concede ao serviço
          permissão limitada para armazenar, processar e sincronizar esse conteúdo apenas na medida
          necessária para disponibilizar as funcionalidades do 2sFlow, conforme a{' '}
          <a href="/privacidade" className="text-zinc-100 underline underline-offset-4 hover:text-white">
            Política de Privacidade
          </a>.
        </p>
        <p className="mt-2">
          No modo local, os dados ficam no navegador do dispositivo. Com a nuvem configurada, o
          conteúdo é sincronizado por meio do Supabase. Você é responsável por manter cópias
          próprias de informações importantes; o modo offline e a sincronização não substituem
          uma estratégia independente de backup.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-100">4. Disponibilidade e alterações</h2>
        <p className="mt-2">
          O serviço é fornecido conforme disponível. Podemos corrigir, modificar, suspender ou
          descontinuar funcionalidades para manutenção, segurança ou evolução do app, procurando
          evitar interrupções desnecessárias. A sincronização depende de conexão, configuração
          válida e disponibilidade dos provedores envolvidos.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-100">5. Propriedade intelectual</h2>
        <p className="mt-2">
          Os elementos próprios do 2sFlow são protegidos pela legislação aplicável. Estes Termos
          não transferem a você direitos sobre o app, exceto a permissão limitada de utilizá-lo
          para sua finalidade normal. O conteúdo que você cria continua sob sua responsabilidade
          e titularidade, conforme a lei.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-100">6. Limitação de responsabilidade</h2>
        <p className="mt-2">
          Na medida permitida pela legislação, o responsável pelo 2sFlow não responde por
          interrupções decorrentes de fatores fora de seu controle, falhas de conexão, indisponibilidade
          de provedores ou perda de dados causada pelo dispositivo ou navegador do usuário. Nada
          nestes Termos exclui direitos ou responsabilidades que não possam ser afastados por lei.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-100">7. Encerramento e atualizações</h2>
        <p className="mt-2">
          Você pode parar de usar o serviço a qualquer momento. Se precisar solicitar a exclusão
          dos dados de uma conta na nuvem, entre em contato pelo e-mail informado ao final desta
          página. Estes Termos podem ser atualizados, e a data no início indica a versão vigente.
          O uso continuado após uma atualização representa aceitação dos novos Termos, respeitados
          os direitos previstos em lei.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-100">8. Lei aplicável e contato</h2>
        <p className="mt-2">
          Estes Termos são interpretados conforme as leis brasileiras, sem prejuízo dos direitos
          assegurados pela legislação de proteção ao consumidor. Dúvidas, solicitações ou
          comunicações sobre o serviço podem ser enviadas para o contato indicado ao final desta
          página.
        </p>
      </section>
    </div>
  )
}
