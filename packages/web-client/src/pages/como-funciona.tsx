/**
 * Como Funciona - How It Works Page
 */

import Head from "next/head";
import Link from "next/link";
import DefaultLayout from "@/components/DefaultLayout";

export default function ComoFuncionaPage() {
  const steps = [
    {
      num: 1,
      title: "Crie sua Identidade",
      icon: "🔑",
      desc: "Um par de chaves criptográficas (ED25519) é gerado localmente. Ninguém mais tem acesso a sua chave privada.",
      detail: "Sem email, sem senha, sem dados pessoais. Apenas uma chave anônima que você controla."
    },
    {
      num: 2,
      title: "Publique um Ice",
      icon: "✏️",
      desc: "Crie conteúdo em Markdown com título, corpo, categoria e região. O conteúdo é assinado com sua chave.",
      detail: "O Ice é distribuído via IPFS para múltiplos nós. Não existe um servidor central que pode deletar."
    },
    {
      num: 3,
      title: "Comunidade Verifica",
      icon: "👥",
      desc: "Outros usuários votam e verificam seu conteúdo. Votos positivos aumentam o nível, negativos diminuem.",
      detail: "O consenso é distribuído - não existe um moderador central decidindo o que fica ou sai."
    },
    {
      num: 4,
      title: "Sobe de Nível",
      icon: "📈",
      desc: "Conforme recebe votos, o Ice sobe de nível: 0 → 1 → 2 → 3. Nível 3 é permanente e imutável.",
      detail: "Nível 3 (Legacy) nunca pode ser removido. É gravado na história para sempre."
    },
  ];

  const levels = [
    { level: 0, name: "The Wild", color: "gray", icon: "🔍", desc: "Novo, não verificado", visibility: "Link direto" },
    { level: 1, name: "Regional", color: "blue", icon: "📍", desc: "Verificado regionalmente", visibility: "Cidade" },
    { level: 2, name: "Surface", color: "green", icon: "✅", desc: "Verificado globalmente", visibility: "Global" },
    { level: 3, name: "Legacy", color: "yellow", icon: "🏛️", desc: "Arquivo histórico", visibility: "Permanente" },
  ];

  const privacy = [
    { icon: "🔐", title: "Chaves Locais", desc: "Sua chave privada nunca sai do seu dispositivo" },
    { icon: "🧅", title: "Tor Opcional", desc: "Use via Tor para anonimato de IP" },
    { icon: "📡", title: "Zero Telemetria", desc: "Não coletamos dados de uso" },
    { icon: "🌐", title: "P2P Puro", desc: "Comunicação direta entre peers" },
  ];

  return (
    <DefaultLayout>
      <Head>
        <title>Como Funciona - Iceberg</title>
        <meta name="description" content="Entenda como o Protocolo Iceberg funciona" />
      </Head>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📖 Como Funciona</h1>
        <p className="text-secondary">
          Entenda o Protocolo Iceberg em 4 passos simples
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-6 mb-12">
        {steps.map((step) => (
          <div key={step.num} className="bg-surface rounded-xl p-6 border border-gray-800">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl font-bold shrink-0">
                {step.num}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-1 flex items-center gap-2">
                  {step.icon} {step.title}
                </h3>
                <p className="text-secondary mb-2">{step.desc}</p>
                <p className="text-sm text-gray-500">{step.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Levels */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">📊 Sistema de Níveis</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {levels.map((l) => (
            <div key={l.level} className={`rounded-xl p-5 border border-${l.color}-500/30 bg-${l.color}-500/10`} style={{ borderColor: `var(--${l.color}, #666)` }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{l.icon}</span>
                <span className="font-bold">Nível {l.level}</span>
              </div>
              <div className="font-semibold text-lg">{l.name}</div>
              <div className="text-sm text-secondary">{l.desc}</div>
              <div className="text-xs text-gray-500 mt-2">👁️ {l.visibility}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">🔒 Privacidade</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {privacy.map((p) => (
            <div key={p.title} className="bg-surface rounded-xl p-4 border border-gray-800">
              <div className="text-2xl mb-2">{p.icon}</div>
              <div className="font-semibold text-sm">{p.title}</div>
              <div className="text-xs text-secondary">{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Diagram */}
      <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-8 border border-primary/20 mb-8">
        <h2 className="text-xl font-bold mb-4 text-center">🌐 Arquitetura Descentralizada</h2>
        <div className="text-center text-secondary">
          <pre className="text-sm font-mono inline-block text-left">
{`
   ┌─────────┐     ┌─────────┐     ┌─────────┐
   │  Peer A │◄───►│  Peer B │◄───►│  Peer C │
   └────┬────┘     └────┬────┘     └────┬────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
                   ┌────▼────┐
                   │  IPFS   │
                   │ Content │
                   └─────────┘
`}
          </pre>
        </div>
        <p className="text-center text-sm text-secondary mt-4">
          Cada peer é igual. Não existe servidor central.
        </p>
      </div>

      {/* CTA */}
      <div className="text-center">
        <Link href="/publicar" className="inline-block px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl hover:opacity-90">
          Criar Meu Primeiro Ice
        </Link>
      </div>
    </DefaultLayout>
  );
}
