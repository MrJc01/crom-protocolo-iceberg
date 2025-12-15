/**
 * App Configuration Page - System Settings (LOCAL MODE ONLY)
 * 
 * This page provides full access to system configuration and is only available
 * when running in LOCAL mode (desktop app). In ONLINE mode, users are redirected
 * or shown an access denied message.
 */

import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import DefaultLayout from "@/components/DefaultLayout";
import { useSystemMode, formatUptime, formatBytes } from "@/lib/useSystemMode";

export default function AppPage() {
  const router = useRouter();
  const { 
    mode, 
    isLocal, 
    canConfigure, 
    systemInfo, 
    systemConfig, 
    limits, 
    loading, 
    error,
    refresh,
    refreshConfig,
    updateConfig,
  } = useSystemMode();

  const [activeTab, setActiveTab] = useState<"status" | "config" | "data" | "about">("status");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  
  // Configuration form state
  const [configForm, setConfigForm] = useState({
    maxMemoryMB: 2048,
    maxStorageGB: 10,
    maxPeers: 100,
    maxPostsPerDay: 50,
  });

  // Load initial config values
  useEffect(() => {
    if (limits) {
      setConfigForm({
        maxMemoryMB: limits.maxMemoryMB ?? 2048,
        maxStorageGB: limits.maxStorageGB ?? 10,
        maxPeers: limits.maxPeers ?? 100,
        maxPostsPerDay: limits.maxPostsPerDay ?? 50,
      });
    }
  }, [limits]);

  // Check access on mode change
  useEffect(() => {
    if (!loading && !isLocal) {
      // Optionally redirect to home after showing message
    }
  }, [loading, isLocal]);

  const handleSaveConfig = async () => {
    setSaveStatus("saving");
    const result = await updateConfig(configForm);
    if (result.success) {
      setSaveStatus("success");
      setTimeout(() => setSaveStatus(null), 3000);
    } else {
      setSaveStatus(`error: ${result.message}`);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await fetch("http://localhost:8420/system/export", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        // Download as JSON file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `iceberg-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  // Access denied view for online mode
  if (!loading && !isLocal) {
    return (
      <DefaultLayout>
        <Head>
          <title>Configurações - Acesso Negado</title>
        </Head>

        <div className="max-w-2xl mx-auto py-12 text-center">
          <div className="text-6xl mb-6">🔐</div>
          <h1 className="text-3xl font-bold mb-4">Acesso Restrito</h1>
          <p className="text-secondary mb-6">
            Esta página está disponível apenas no <strong>modo local</strong> (app desktop).
          </p>
          <div className="bg-surface border border-gray-700 rounded-lg p-6 mb-6">
            <p className="text-sm text-secondary mb-4">
              Você está acessando o Iceberg no modo <strong className="text-yellow-400">ONLINE</strong> (compartilhado).
            </p>
            <p className="text-sm text-secondary">
              Para acessar as configurações do sistema, execute o Iceberg localmente com:
            </p>
            <code className="block bg-gray-900 px-4 py-2 rounded mt-2 text-sm">
              ICEBERG_MODE=local npm run dev
            </code>
          </div>
          
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-primary text-black rounded-lg font-medium hover:bg-opacity-90"
          >
            Voltar para Início
          </button>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <Head>
        <title>Configurações do Sistema - Iceberg</title>
        <meta name="description" content="Configurações e controle do sistema Iceberg" />
      </Head>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">⚙️</span>
          <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
            MODO LOCAL
          </span>
        </div>
        <p className="text-secondary">
          Gerencie recursos, armazenamento e configurações do daemon local
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-700">
        {[
          { id: "status", label: "📊 Status", icon: "📊" },
          { id: "config", label: "⚙️ Limites", icon: "⚙️" },
          { id: "data", label: "💾 Dados", icon: "💾" },
          { id: "about", label: "ℹ️ Sobre", icon: "ℹ️" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 border-b-2 transition -mb-px ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-secondary hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-secondary mt-4">Carregando informações do sistema...</p>
        </div>
      ) : (
        <>
          {/* Status Tab */}
          {activeTab === "status" && systemInfo && (
            <div className="space-y-6">
              {/* Resource Usage Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Memory */}
                <div className="bg-surface rounded-xl p-6 border border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-semibold">💾 Memória</span>
                    <span className="text-2xl font-bold text-primary">
                      {systemInfo.memory.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                    <div 
                      className={`h-3 rounded-full transition-all ${
                        systemInfo.memory.percentage > 80 ? "bg-red-500" : 
                        systemInfo.memory.percentage > 60 ? "bg-yellow-500" : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(100, systemInfo.memory.percentage)}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-secondary">Em uso:</span>
                      <span className="ml-2">{systemInfo.formatted?.memory.used}</span>
                    </div>
                    <div>
                      <span className="text-secondary">Limite:</span>
                      <span className="ml-2">{systemInfo.formatted?.memory.limit}</span>
                    </div>
                    <div>
                      <span className="text-secondary">Total sistema:</span>
                      <span className="ml-2">{systemInfo.formatted?.memory.total}</span>
                    </div>
                    <div>
                      <span className="text-secondary">Disponível:</span>
                      <span className="ml-2">{systemInfo.formatted?.memory.available}</span>
                    </div>
                  </div>
                </div>

                {/* CPU */}
                <div className="bg-surface rounded-xl p-6 border border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-semibold">🖥️ CPU</span>
                    <span className="text-2xl font-bold text-blue-400">
                      {systemInfo.cpu.usage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                    <div 
                      className="h-3 rounded-full bg-blue-500 transition-all"
                      style={{ width: `${Math.min(100, systemInfo.cpu.usage)}%` }}
                    />
                  </div>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-secondary">Núcleos:</span>
                      <span className="ml-2">{systemInfo.cpu.cores}</span>
                    </div>
                    <div>
                      <span className="text-secondary">Modelo:</span>
                      <span className="ml-2 text-xs">{systemInfo.cpu.model?.substring(0, 30)}...</span>
                    </div>
                  </div>
                </div>

                {/* Storage */}
                <div className="bg-surface rounded-xl p-6 border border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-semibold">📦 Armazenamento</span>
                    <span className="text-2xl font-bold text-purple-400">
                      {systemInfo.formatted?.storage.used}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-secondary">Limite:</span>
                      <span className="ml-2">{systemInfo.formatted?.storage.limit}</span>
                    </div>
                    <div>
                      <span className="text-secondary">Banco de dados:</span>
                      <span className="ml-2">{systemInfo.formatted?.storage.dbSize}</span>
                    </div>
                    {systemInfo.storage.dataDir && (
                      <div>
                        <span className="text-secondary">Diretório:</span>
                        <code className="ml-2 text-xs bg-gray-800 px-1 rounded">
                          {systemInfo.storage.dataDir}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Stats */}
              {systemInfo.data && (
                <div className="bg-surface rounded-xl p-6 border border-gray-800">
                  <h3 className="text-lg font-semibold mb-4">📝 Dados Armazenados</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-3xl font-bold text-primary">{systemInfo.data.posts}</div>
                      <div className="text-sm text-secondary">Posts</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-secondary">{systemInfo.data.comments}</div>
                      <div className="text-sm text-secondary">Comentários</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-green-400">{systemInfo.data.votes}</div>
                      <div className="text-sm text-secondary">Votos</div>
                    </div>
                  </div>
                </div>
              )}

              {/* System Info */}
              <div className="bg-surface rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-semibold mb-4">🔧 Informações do Sistema</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-secondary block">Uptime</span>
                    <span className="font-mono">{formatUptime(systemInfo.uptime)}</span>
                  </div>
                  <div>
                    <span className="text-secondary block">Plataforma</span>
                    <span className="font-mono">{systemInfo.platform}</span>
                  </div>
                  <div>
                    <span className="text-secondary block">Arquitetura</span>
                    <span className="font-mono">{systemInfo.arch}</span>
                  </div>
                  <div>
                    <span className="text-secondary block">Node.js</span>
                    <span className="font-mono">{systemInfo.nodeVersion}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={refresh}
                className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
              >
                🔄 Atualizar Informações
              </button>
            </div>
          )}

          {/* Config Tab */}
          {activeTab === "config" && (
            <div className="space-y-6">
              <div className="bg-surface rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-semibold mb-4">⚙️ Limites de Recursos</h3>
                <p className="text-secondary text-sm mb-6">
                  Configure os limites máximos de recursos que o daemon pode utilizar.
                  Algumas alterações requerem reiniciar o daemon.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Max Memory */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Memória Máxima (MB)
                    </label>
                    <input
                      type="number"
                      min={256}
                      max={16384}
                      value={configForm.maxMemoryMB}
                      onChange={(e) => setConfigForm({ ...configForm, maxMemoryMB: parseInt(e.target.value) || 2048 })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary focus:outline-none"
                    />
                    <span className="text-xs text-secondary mt-1 block">
                      Padrão: 2048 MB • Mín: 256 MB • Máx: 16384 MB
                    </span>
                  </div>

                  {/* Max Storage */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Armazenamento Máximo (GB)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={configForm.maxStorageGB}
                      onChange={(e) => setConfigForm({ ...configForm, maxStorageGB: parseInt(e.target.value) || 10 })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary focus:outline-none"
                    />
                    <span className="text-xs text-secondary mt-1 block">
                      Padrão: 10 GB • Mín: 1 GB • Máx: 100 GB
                    </span>
                  </div>

                  {/* Max Peers */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Máximo de Peers
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={configForm.maxPeers}
                      onChange={(e) => setConfigForm({ ...configForm, maxPeers: parseInt(e.target.value) || 100 })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary focus:outline-none"
                    />
                    <span className="text-xs text-secondary mt-1 block">
                      Padrão: 100 • Mín: 1 • Máx: 1000
                    </span>
                  </div>

                  {/* Max Posts Per Day */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Posts por Dia
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={configForm.maxPostsPerDay}
                      onChange={(e) => setConfigForm({ ...configForm, maxPostsPerDay: parseInt(e.target.value) || 50 })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary focus:outline-none"
                    />
                    <span className="text-xs text-secondary mt-1 block">
                      Padrão: 50 • Mín: 1 • Máx: 100
                    </span>
                  </div>
                </div>

                {/* Save Button */}
                <div className="mt-6 flex items-center gap-4">
                  <button
                    onClick={handleSaveConfig}
                    disabled={saveStatus === "saving"}
                    className="px-6 py-2 bg-primary text-black font-medium rounded-lg hover:bg-opacity-90 disabled:opacity-50"
                  >
                    {saveStatus === "saving" ? "Salvando..." : "💾 Salvar Configurações"}
                  </button>
                  
                  {saveStatus === "success" && (
                    <span className="text-green-400 text-sm">✅ Configurações salvas!</span>
                  )}
                  {saveStatus?.startsWith("error") && (
                    <span className="text-red-400 text-sm">{saveStatus}</span>
                  )}
                </div>

                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 text-sm">
                    ⚠️ Alterações em memória e armazenamento requerem reiniciar o daemon para ter efeito.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Data Tab */}
          {activeTab === "data" && (
            <div className="space-y-6">
              <div className="bg-surface rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-semibold mb-4">💾 Gerenciamento de Dados</h3>
                
                <div className="space-y-4">
                  {/* Export */}
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">📤 Exportar Dados</h4>
                        <p className="text-sm text-secondary">
                          Baixe todos os seus dados locais em formato JSON
                        </p>
                      </div>
                      <button
                        onClick={handleExportData}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
                      >
                        Exportar
                      </button>
                    </div>
                  </div>

                  {/* Clear Cache */}
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">🧹 Limpar Cache</h4>
                        <p className="text-sm text-secondary">
                          Remove dados temporários e libera memória
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          await fetch("http://localhost:8420/system/clear-cache", { method: "POST" });
                          refresh();
                        }}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Path Info */}
              {systemConfig?.paths && (
                <div className="bg-surface rounded-xl p-6 border border-gray-800">
                  <h3 className="text-lg font-semibold mb-4">📁 Locais de Armazenamento</h3>
                  <div className="space-y-2 text-sm font-mono">
                    <div>
                      <span className="text-secondary">Diretório de dados:</span>
                      <code className="ml-2 bg-gray-800 px-2 py-1 rounded">{systemConfig.paths.dataDir}</code>
                    </div>
                    <div>
                      <span className="text-secondary">Banco de dados:</span>
                      <code className="ml-2 bg-gray-800 px-2 py-1 rounded">{systemConfig.paths.database}</code>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* About Tab */}
          {activeTab === "about" && (
            <div className="space-y-6">
              <div className="bg-surface rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-semibold mb-4">ℹ️ Sobre o Sistema</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">🧊</span>
                    <div>
                      <h4 className="text-xl font-bold">Protocolo Iceberg</h4>
                      <p className="text-secondary">Versão 1.0.0 • Modo Local</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-700">
                    <p className="text-secondary mb-4">
                      O Protocolo Iceberg é uma plataforma descentralizada para preservar e compartilhar 
                      conhecimento, resistente à censura e baseada em consenso comunitário.
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-secondary">Licença:</span>
                        <span className="ml-2">AGPL-3.0</span>
                      </div>
                      <div>
                        <span className="text-secondary">Autor:</span>
                        <span className="ml-2">MrJc01</span>
                      </div>
                      <div>
                        <span className="text-secondary">Tecnologias:</span>
                        <span className="ml-2">Node.js, Next.js, SQLite</span>
                      </div>
                      <div>
                        <span className="text-secondary">Repositório:</span>
                        <a 
                          href="https://github.com/MrJc01/crom-protocolo-iceberg" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 text-primary hover:underline"
                        >
                          GitHub
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="bg-surface rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-semibold mb-4">🎯 Funcionalidades do Modo Local</h3>
                <ul className="space-y-2">
                  {[
                    "Acesso completo às configurações do sistema",
                    "Monitoramento detalhado de recursos (RAM, CPU, disco)",
                    "Exportação e importação de dados",
                    "Configuração de limites personalizados",
                    "Gerenciamento de armazenamento local",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-green-400">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </DefaultLayout>
  );
}
