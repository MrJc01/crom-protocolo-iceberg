/**
 * Technologies Page - Full Tech Stack
 */

import Head from "next/head";
import DefaultLayout from "@/components/DefaultLayout";

export default function TecnologiasPage() {
  const stack = [
    {
      category: "🌐 Rede P2P",
      items: [
        { name: "IPFS", desc: "InterPlanetary File System - armazenamento distribuído de conteúdo", version: "0.18+" },
        { name: "Libp2p", desc: "Biblioteca modular para redes peer-to-peer", version: "0.45+" },
        { name: "DHT", desc: "Distributed Hash Table para descoberta de peers", version: "-" },
        { name: "PubSub", desc: "Publish/Subscribe para broadcast de mensagens", version: "-" },
      ]
    },
    {
      category: "🔐 Criptografia",
      items: [
        { name: "ED25519", desc: "Curva elíptica para assinaturas digitais", version: "-" },
        { name: "ChaCha20", desc: "Cifra simétrica para criptografia de dados", version: "-" },
        { name: "BIP39", desc: "Mnemônicos para backup de chaves", version: "-" },
        { name: "Blake3", desc: "Hash function ultra-rápida", version: "-" },
      ]
    },
    {
      category: "🖥️ Backend",
      items: [
        { name: "Node.js", desc: "Runtime JavaScript server-side", version: "18+" },
        { name: "TypeScript", desc: "Superset tipado de JavaScript", version: "5.0+" },
        { name: "Express", desc: "Framework HTTP minimalista", version: "4.18+" },
        { name: "SQLite", desc: "Banco de dados embarcado local", version: "3.0+" },
      ]
    },
    {
      category: "🎨 Frontend",
      items: [
        { name: "Next.js", desc: "Framework React com SSR", version: "14+" },
        { name: "React", desc: "Biblioteca UI declarativa", version: "18+" },
        { name: "Zustand", desc: "State management minimalista", version: "4.0+" },
        { name: "CSS Modules", desc: "Estilos com escopo local", version: "-" },
      ]
    },
    {
      category: "🛠️ DevOps",
      items: [
        { name: "Docker", desc: "Containerização", version: "24+" },
        { name: "GitHub Actions", desc: "CI/CD automático", version: "-" },
        { name: "Turborepo", desc: "Build system para monorepos", version: "1.10+" },
        { name: "Vitest", desc: "Framework de testes", version: "0.34+" },
      ]
    },
  ];

  return (
    <DefaultLayout>
      <Head>
        <title>Tecnologias - Iceberg</title>
        <meta name="description" content="Stack tecnológico do Protocolo Iceberg" />
      </Head>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🔧 Tecnologias</h1>
        <p className="text-secondary">Stack completo do Protocolo Iceberg</p>
      </div>

      {/* Architecture Diagram */}
      <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-6 mb-8 border border-primary/20">
        <h2 className="text-lg font-bold mb-4 text-center">📐 Arquitetura</h2>
        <pre className="text-xs md:text-sm font-mono text-center text-secondary overflow-x-auto">
{`
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│   Next.js  •  React  •  Zustand  •  CSS Modules              │
├─────────────────────────────────────────────────────────────┤
│                          DAEMON                              │
│   Express  •  TypeScript  •  SQLite  •  REST API             │
├─────────────────────────────────────────────────────────────┤
│                       REDE P2P                               │
│   Libp2p  •  IPFS  •  DHT  •  PubSub  •  NAT Traversal       │
├─────────────────────────────────────────────────────────────┤
│                      CRIPTOGRAFIA                            │
│   ED25519  •  ChaCha20  •  BIP39  •  Blake3                  │
└─────────────────────────────────────────────────────────────┘
`}
        </pre>
      </div>

      {/* Tech Categories */}
      <div className="space-y-8">
        {stack.map(cat => (
          <div key={cat.category}>
            <h2 className="text-xl font-bold mb-4">{cat.category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cat.items.map(item => (
                <div key={item.name} className="bg-surface rounded-xl p-4 border border-gray-800 flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary">{item.name}</span>
                      {item.version !== "-" && (
                        <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">{item.version}</span>
                      )}
                    </div>
                    <p className="text-sm text-secondary mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Why These? */}
      <div className="mt-12 bg-surface rounded-xl p-6 border border-gray-800">
        <h2 className="text-xl font-bold mb-4">🤔 Por que essas tecnologias?</h2>
        <div className="space-y-3 text-secondary text-sm">
          <p><strong className="text-on-surface">IPFS + Libp2p:</strong> Padrão da indústria para redes descentralizadas. Usado por Filecoin, IPNS, e milhares de projetos.</p>
          <p><strong className="text-on-surface">ED25519:</strong> Curva elíptica moderna, mais segura e rápida que RSA. Padrão em SSH, Signal, Tor.</p>
          <p><strong className="text-on-surface">TypeScript:</strong> Type safety para código mais confiável e manutenível.</p>
          <p><strong className="text-on-surface">Next.js:</strong> SSR, SSG, e excelente DX. Usado pelo TabNews (nossa inspiração).</p>
          <p><strong className="text-on-surface">SQLite:</strong> Banco local zero-config, perfeito para daemon descentralizado.</p>
        </div>
      </div>

      {/* Links */}
      <div className="mt-8 text-center">
        <a 
          href="https://github.com/MrJc01/crom-protocolo-iceberg" 
          className="inline-block px-6 py-3 bg-surface border border-gray-700 rounded-xl hover:border-primary transition-colors"
        >
          📦 Ver código no GitHub
        </a>
      </div>
    </DefaultLayout>
  );
}
