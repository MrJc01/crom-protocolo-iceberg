/**
 * API Documentation Page
 */

import { useState } from "react";
import Head from "next/head";
import DefaultLayout from "@/components/DefaultLayout";

export default function ApiPage() {
  const [activeSection, setActiveSection] = useState("posts");

  const endpoints = {
    posts: [
      { method: "GET", path: "/posts", desc: "Listar ices", params: "?region=BR-SP&level=1&limit=50" },
      { method: "GET", path: "/posts/:cid", desc: "Obter ice por CID", params: "" },
      { method: "POST", path: "/posts", desc: "Criar novo ice", params: "{ title, body, region }" },
    ],
    votes: [
      { method: "GET", path: "/votes/:cid", desc: "Obter votos de um ice", params: "" },
      { method: "POST", path: "/votes", desc: "Votar em ice", params: "{ postCid, type: 'up'|'down' }" },
    ],
    comments: [
      { method: "GET", path: "/comments/:postCid", desc: "Listar comentários", params: "" },
      { method: "POST", path: "/comments", desc: "Criar comentário", params: "{ postCid, body }" },
    ],
    identity: [
      { method: "GET", path: "/identity", desc: "Obter identidade atual", params: "" },
      { method: "POST", path: "/identity", desc: "Criar nova identidade", params: "" },
    ],
    network: [
      { method: "GET", path: "/health", desc: "Status do daemon", params: "" },
      { method: "GET", path: "/network/peers", desc: "Listar peers", params: "" },
    ],
  };

  const sections = [
    { id: "posts", label: "Posts/Ices", icon: "📝" },
    { id: "votes", label: "Votos", icon: "👍" },
    { id: "comments", label: "Comentários", icon: "💬" },
    { id: "identity", label: "Identidade", icon: "🔑" },
    { id: "network", label: "Rede", icon: "🌐" },
  ];

  return (
    <DefaultLayout>
      <Head>
        <title>API - Iceberg</title>
        <meta name="description" content="Documentação da API do Iceberg" />
      </Head>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🔌 API Reference</h1>
        <p className="text-secondary">
          Base URL: <code className="bg-surface px-2 py-1 rounded">http://localhost:8420</code>
        </p>
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap gap-2 mb-8">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeSection === s.id
                ? "bg-primary text-white"
                : "bg-surface hover:bg-surface/80"
            }`}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Endpoints */}
      <div className="space-y-4 mb-12">
        {endpoints[activeSection as keyof typeof endpoints]?.map((ep, i) => (
          <div key={i} className="bg-surface rounded-xl border border-gray-800 overflow-hidden">
            <div className="flex items-center gap-3 p-4 border-b border-gray-800">
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                ep.method === "GET" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"
              }`}>
                {ep.method}
              </span>
              <code className="font-mono text-primary">{ep.path}</code>
              <span className="text-secondary text-sm flex-1">{ep.desc}</span>
            </div>
            {ep.params && (
              <div className="p-4 bg-background/50">
                <code className="text-sm text-secondary">{ep.params}</code>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Auth */}
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-6 border border-primary/20 mb-8">
        <h2 className="text-xl font-bold mb-4">🔐 Autenticação</h2>
        <p className="text-secondary mb-4">
          Endpoints que modificam dados requerem autenticação via assinatura ED25519.
        </p>
        <pre className="bg-surface rounded-lg p-4 text-sm overflow-x-auto">
{`// Header de autenticação
Authorization: Ed25519 <pubkey>:<signature>

// A assinatura é feita sobre:
// timestamp + method + path + body_hash`}
        </pre>
      </div>

      {/* SDK */}
      <div className="bg-surface rounded-xl p-6 border border-gray-800 mb-8">
        <h2 className="text-xl font-bold mb-4">📦 SDK</h2>
        <p className="text-secondary mb-4">Use o SDK para integrar facilmente:</p>
        <pre className="bg-background rounded-lg p-4 text-sm overflow-x-auto mb-4">
{`npm install @iceberg/sdk`}
        </pre>
        <pre className="bg-background rounded-lg p-4 text-sm overflow-x-auto">
{`import { Iceberg } from '@iceberg/sdk';

const iceberg = new Iceberg({ daemon: 'http://localhost:8420' });

// Listar ices
const posts = await iceberg.posts.list({ region: 'BR-SP-SAO_PAULO' });

// Criar ice
await iceberg.posts.create({
  title: 'Meu Ice',
  body: '# Conteúdo em Markdown',
  region: 'BR-SP-SAO_PAULO'
});`}
        </pre>
      </div>

      {/* Response Format */}
      <div className="bg-surface rounded-xl p-6 border border-gray-800">
        <h2 className="text-xl font-bold mb-4">📋 Formato de Resposta</h2>
        <pre className="bg-background rounded-lg p-4 text-sm overflow-x-auto">
{`// Sucesso
{
  "success": true,
  "data": { ... }
}

// Erro
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Título é obrigatório"
  }
}`}
        </pre>
      </div>
    </DefaultLayout>
  );
}
