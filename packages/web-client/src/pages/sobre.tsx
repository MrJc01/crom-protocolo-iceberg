/**
 * About Page - Sobre o Iceberg
 */

import Head from "next/head";
import Link from "next/link";
import DefaultLayout from "@/components/DefaultLayout";

export default function SobrePage() {
  const features = [
    { icon: "🧊", title: "Imutável", desc: "Conteúdo preservado para sempre via IPFS" },
    { icon: "🔐", title: "Anônimo", desc: "Identidade baseada em chaves criptográficas" },
    { icon: "🌍", title: "Descentralizado", desc: "Sem servidor central, sem ponto de falha" },
    { icon: "✅", title: "Verificado", desc: "Sistema de níveis baseado em consenso" },
    { icon: "₿", title: "Bounties", desc: "Recompensas em Bitcoin para verificações" },
    { icon: "🔒", title: "Privacidade", desc: "Tor opcional, sem telemetria" },
  ];

  const faq = [
    { q: "O que é o Protocolo Iceberg?", a: "Uma plataforma descentralizada para preservar o conhecimento da humanidade. Como um WikiLeaks moderno para todo tipo de conteúdo." },
    { q: "Como funciona a censura?", a: "Não existe. O conteúdo é distribuído entre milhares de nós e não pode ser removido por governos ou corporações." },
    { q: "Preciso me identificar?", a: "Não. Sua identidade é uma chave criptográfica anônima. Não coletamos email ou dados pessoais." },
    { q: "O que são os níveis?", a: "Sistema de verificação: Nível 0 (novo) → Nível 3 (histórico imutável validado por milhares)." },
  ];

  const tech = [
    { name: "IPFS", desc: "Storage distribuído" },
    { name: "Libp2p", desc: "Rede P2P" },
    { name: "ED25519", desc: "Criptografia" },
    { name: "Next.js", desc: "Frontend" },
    { name: "SQLite", desc: "Banco local" },
    { name: "TypeScript", desc: "Backend" },
  ];

  return (
    <DefaultLayout>
      <Head>
        <title>Sobre - Iceberg</title>
        <meta name="description" content="Sobre o Protocolo Iceberg" />
      </Head>

      <div className="text-center py-12 mb-8">
        <h1 className="text-4xl font-bold mb-4">
          🧊 Protocolo <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Iceberg</span>
        </h1>
        <p className="text-xl text-secondary max-w-2xl mx-auto">
          O conhecimento da humanidade, preservado para sempre.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
        {features.map(f => (
          <div key={f.title} className="bg-surface/50 rounded-xl p-5 border border-gray-800">
            <div className="text-3xl mb-2">{f.icon}</div>
            <h3 className="font-semibold">{f.title}</h3>
            <p className="text-sm text-secondary">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 mb-12 border border-primary/20">
        <h2 className="text-2xl font-bold mb-4">🎯 Nossa Visão</h2>
        <p className="text-secondary">
          Acreditamos que o conhecimento humano pertence a todos. Arte, ciência, história, cultura, 
          memes, investigações - tudo merece existir sem censura. Somos uma rede de pessoas que 
          acreditam na liberdade de informação.
        </p>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">❓ FAQ</h2>
        <div className="space-y-3">
          {faq.map((item, i) => (
            <div key={i} className="bg-surface rounded-xl p-5 border border-gray-800">
              <h3 className="font-semibold mb-1">{item.q}</h3>
              <p className="text-secondary text-sm">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">🔧 Tecnologias</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {tech.map(t => (
            <div key={t.name} className="bg-surface/50 rounded-lg p-3 border border-gray-800 text-center">
              <div className="font-mono text-primary text-sm">{t.name}</div>
              <div className="text-xs text-secondary">{t.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: "/como-funciona", icon: "📖", label: "Como Funciona" },
          { href: "/api", icon: "🔌", label: "API" },
          { href: "/status", icon: "📊", label: "Status" },
          { href: "/rede", icon: "🌐", label: "Rede" },
        ].map(link => (
          <Link key={link.href} href={link.href} className="bg-surface rounded-xl p-5 text-center hover:border-primary/50 border border-gray-800 transition-colors">
            <div className="text-2xl mb-2">{link.icon}</div>
            <div className="font-medium">{link.label}</div>
          </Link>
        ))}
      </div>

      <div className="mt-12 text-center text-sm text-secondary">
        <p>100% Open Source • <a href="https://github.com/MrJc01/crom-protocolo-iceberg" className="text-primary hover:underline">GitHub</a></p>
      </div>
    </DefaultLayout>
  );
}
