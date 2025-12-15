/**
 * Version Page - Changelog and Version Info
 */

import Head from "next/head";
import Link from "next/link";
import DefaultLayout from "@/components/DefaultLayout";

export default function VersaoPage() {
  const currentVersion = "1.0.0";
  
  const changelog = [
    {
      version: "1.0.0",
      date: "Dezembro 2024",
      type: "major",
      changes: [
        "🎉 Lançamento inicial do Protocolo Iceberg",
        "✅ Sistema de identidade ED25519",
        "✅ Publicação e votação de ices",
        "✅ Sistema de níveis (0-3)",
        "✅ Chat P2P",
        "✅ Agendamento de publicações",
        "✅ Moderação por IA (Gemini)",
        "✅ CLI completa",
        "✅ 60+ categorias de conteúdo",
      ]
    },
    {
      version: "0.9.0-beta",
      date: "Novembro 2024",
      type: "beta",
      changes: [
        "📦 Integração IPFS",
        "📦 Sistema de consenso",
        "📦 Frontend Next.js",
        "📦 Daemon TypeScript",
      ]
    },
    {
      version: "0.5.0-alpha",
      date: "Outubro 2024",
      type: "alpha",
      changes: [
        "🔬 Prova de conceito",
        "🔬 Estrutura do monorepo",
        "🔬 Documentação inicial",
      ]
    },
  ];

  const roadmap = [
    { q: "Q1 2025", items: ["Mobile apps (React Native)", "Tor integration", "Multi-language"] },
    { q: "Q2 2025", items: ["Desktop app (Tauri)", "Browser extension", "Public beta"] },
    { q: "Q3 2025", items: ["Bitcoin Lightning", "Federation protocol", "Scale to 10k nodes"] },
  ];

  return (
    <DefaultLayout>
      <Head>
        <title>Versão - Iceberg</title>
        <meta name="description" content="Histórico de versões do Protocolo Iceberg" />
      </Head>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📦 Versão</h1>
        <p className="text-secondary">Histórico de versões e roadmap</p>
      </div>

      {/* Current Version */}
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 mb-8 border border-primary/20 text-center">
        <div className="text-sm text-secondary mb-2">Versão Atual</div>
        <div className="text-5xl font-bold font-mono text-primary mb-4">{currentVersion}</div>
        <div className="flex justify-center gap-2">
          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">Estável</span>
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">MVP</span>
        </div>
      </div>

      {/* Changelog */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">📝 Changelog</h2>
        <div className="space-y-6">
          {changelog.map(release => (
            <div key={release.version} className="bg-surface rounded-xl border border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-gray-800 flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  release.type === "major" ? "bg-green-500/20 text-green-400" :
                  release.type === "beta" ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-gray-500/20 text-gray-400"
                }`}>
                  {release.version}
                </span>
                <span className="text-secondary text-sm">{release.date}</span>
              </div>
              <ul className="p-4 space-y-2">
                {release.changes.map((change, i) => (
                  <li key={i} className="text-sm text-secondary">{change}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Roadmap */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">🗺️ Roadmap</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {roadmap.map(q => (
            <div key={q.q} className="bg-surface rounded-xl p-5 border border-gray-800">
              <div className="font-bold text-primary mb-3">{q.q}</div>
              <ul className="space-y-2">
                {q.items.map((item, i) => (
                  <li key={i} className="text-sm text-secondary flex items-start gap-2">
                    <span className="text-gray-500">○</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link href="https://github.com/MrJc01/crom-protocolo-iceberg" className="text-primary hover:underline text-sm">
            Ver roadmap completo no GitHub →
          </Link>
        </div>
      </div>

      {/* System Requirements */}
      <div className="bg-surface rounded-xl p-5 border border-gray-800">
        <h2 className="font-semibold mb-4">💻 Requisitos</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium mb-2">Daemon/CLI</div>
            <ul className="text-secondary space-y-1">
              <li>• Node.js 18+</li>
              <li>• 512MB RAM</li>
              <li>• 1GB disk</li>
            </ul>
          </div>
          <div>
            <div className="font-medium mb-2">Navegador</div>
            <ul className="text-secondary space-y-1">
              <li>• Chrome 90+</li>
              <li>• Firefox 90+</li>
              <li>• Safari 15+</li>
            </ul>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
