/**
 * Status Page - System Status and Metrics
 * Enhanced with mode detection and real system metrics
 */

import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import DefaultLayout from "@/components/DefaultLayout";
import { api } from "@/lib/store";

interface StatusData {
  daemon: { 
    status: string; 
    uptime: number; 
    version: string;
    mode: string;
    isLocal: boolean;
    canConfigure: boolean;
  };
  network: { peers: number; connected: boolean };
  storage: { ices: number; comments: number; votes: number };
  memory: { 
    used: string; 
    total: string; 
    limit: string; 
    percent: number;
  };
  cpu: { 
    usage: string; 
    cores: number; 
  };
}

export default function StatusPage() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  async function loadStatus() {
    try {
      const data = await api.getHealth();
      setStatus({
        daemon: { 
          status: data.status || "online", 
          uptime: data.uptime || 0,
          version: data.version || "1.0.0",
          mode: data.mode || "online",
          isLocal: data.isLocal || false,
          canConfigure: data.canConfigure || false,
        },
        network: { 
          peers: data.peers || 0, 
          connected: data.status === "ok" 
        },
        storage: { 
          ices: data.postsCount || 0, 
          comments: data.commentsCount || 0, 
          votes: data.votesCount || 0 
        },
        memory: {
          used: data.memory || "N/A",
          total: data.memoryTotal || "N/A",
          limit: data.memoryLimit || "N/A",
          percent: data.memoryPercent || 0,
        },
        cpu: { 
          usage: data.cpu || "N/A",
          cores: data.cpuCores || 0,
        },
      });
      setLastUpdate(new Date());
    } catch (error) {
      setStatus({
        daemon: { status: "offline", uptime: 0, version: "?", mode: "online", isLocal: false, canConfigure: false },
        network: { peers: 0, connected: false },
        storage: { ices: 0, comments: 0, votes: 0 },
        memory: { used: "N/A", total: "N/A", limit: "N/A", percent: 0 },
        cpu: { usage: "N/A", cores: 0 },
      });
    } finally {
      setLoading(false);
    }
  }

  function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }

  const isOnline = status?.daemon.status === "online" || status?.daemon.status === "ok";
  const isLocalMode = status?.daemon.isLocal;
  const modeLabel = isLocalMode ? "LOCAL (App Desktop)" : "ONLINE (Compartilhado)";
  const modeColor = isLocalMode ? "text-green-400" : "text-yellow-400";

  return (
    <DefaultLayout>
      <Head>
        <title>Status - Iceberg</title>
        <meta name="description" content="Status do sistema Iceberg" />
      </Head>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">📊 Status do Sistema</h1>
            <p className="text-secondary">
              Monitoramento em tempo real • Atualiza a cada 10s
            </p>
          </div>
          {status?.daemon.canConfigure && (
            <Link
              href="/app"
              className="px-4 py-2 bg-primary text-black rounded-lg font-medium hover:bg-opacity-90 flex items-center gap-2"
            >
              ⚙️ Configurar Sistema
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        </div>
      ) : (
        <>
          {/* Mode Banner */}
          <div className={`mb-6 p-4 rounded-xl border ${
            isLocalMode 
              ? "bg-green-500/10 border-green-500/30" 
              : "bg-yellow-500/10 border-yellow-500/30"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{isLocalMode ? "🖥️" : "🌐"}</span>
                <div>
                  <div className={`font-semibold ${modeColor}`}>{modeLabel}</div>
                  <div className="text-sm text-secondary">
                    {isLocalMode 
                      ? "Acesso completo às configurações do sistema"
                      : "Modo compartilhado - configurações restritas"
                    }
                  </div>
                </div>
              </div>
              {isLocalMode && (
                <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                  ✓ Configuração Habilitada
                </span>
              )}
            </div>
          </div>

          {/* Main Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className={`rounded-xl p-5 border ${isOnline ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                <span className="text-sm text-secondary">Daemon</span>
              </div>
              <div className={`text-2xl font-bold ${isOnline ? "text-green-400" : "text-red-400"}`}>
                {isOnline ? "Online" : "Offline"}
              </div>
            </div>

            <div className="bg-surface rounded-xl p-5 border border-gray-800">
              <div className="text-sm text-secondary mb-2">Versão</div>
              <div className="text-2xl font-bold font-mono">{status?.daemon.version}</div>
            </div>

            <div className="bg-surface rounded-xl p-5 border border-gray-800">
              <div className="text-sm text-secondary mb-2">Uptime</div>
              <div className="text-2xl font-bold">{formatUptime(status?.daemon.uptime || 0)}</div>
            </div>

            <div className="bg-surface rounded-xl p-5 border border-gray-800">
              <div className="text-sm text-secondary mb-2">Peers</div>
              <div className="text-2xl font-bold text-primary">{status?.network.peers}</div>
            </div>
          </div>

          {/* Resources */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Memory */}
            <div className="bg-surface rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">💾 Memória</h2>
                <span className={`text-xl font-bold ${
                  status!.memory.percent > 80 ? "text-red-400" : 
                  status!.memory.percent > 60 ? "text-yellow-400" : "text-green-400"
                }`}>
                  {status?.memory.percent}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    status!.memory.percent > 80 ? "bg-red-500" : 
                    status!.memory.percent > 60 ? "bg-yellow-500" : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(100, status?.memory.percent || 0)}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <div className="text-secondary">Em uso</div>
                  <div className="font-mono">{status?.memory.used}</div>
                </div>
                <div>
                  <div className="text-secondary">Limite</div>
                  <div className="font-mono">{status?.memory.limit}</div>
                </div>
                <div>
                  <div className="text-secondary">Total</div>
                  <div className="font-mono">{status?.memory.total}</div>
                </div>
              </div>
            </div>

            {/* CPU */}
            <div className="bg-surface rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">🖥️ CPU</h2>
                <span className="text-xl font-bold text-blue-400">
                  {status?.cpu.usage}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-secondary text-sm">Uso</div>
                  <div className="text-2xl font-bold">{status?.cpu.usage}</div>
                </div>
                <div>
                  <div className="text-secondary text-sm">Núcleos</div>
                  <div className="text-2xl font-bold">{status?.cpu.cores}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Storage Stats */}
          <div className="bg-surface rounded-xl p-6 border border-gray-800 mb-8">
            <h2 className="text-lg font-semibold mb-4">📝 Dados Armazenados</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{status?.storage.ices.toLocaleString()}</div>
                <div className="text-sm text-secondary">Ices</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary">{status?.storage.comments.toLocaleString()}</div>
                <div className="text-sm text-secondary">Comentários</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">{status?.storage.votes.toLocaleString()}</div>
                <div className="text-sm text-secondary">Votos</div>
              </div>
            </div>
          </div>

          {/* Last Update */}
          {lastUpdate && (
            <div className="text-center text-sm text-secondary">
              Última atualização: {lastUpdate.toLocaleTimeString("pt-BR")}
            </div>
          )}
        </>
      )}
    </DefaultLayout>
  );
}

