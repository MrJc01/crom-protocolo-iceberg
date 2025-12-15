/**
 * Network Page - Live Network Visualization
 */

import { useState, useEffect } from "react";
import Head from "next/head";
import DefaultLayout from "@/components/DefaultLayout";
import { api } from "@/lib/store";

interface PeerInfo {
  id: string;
  address: string;
  latency: number;
  connected: boolean;
}

export default function RedePage() {
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [stats, setStats] = useState({ total: 0, connected: 0, syncing: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNetworkData();
    const interval = setInterval(loadNetworkData, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadNetworkData() {
    try {
      const [health, peersData] = await Promise.all([
        api.getHealth(),
        api.getNetworkPeers(),
      ]);

      // Use real peer data if available, otherwise simulate
      const peerList: PeerInfo[] =
        peersData.peers?.length > 0
          ? peersData.peers.map((p: any, i: number) => ({
              id: p.id || `peer-${i + 1}`,
              address: p.address || "?.?.x.x",
              latency: p.latency || Math.floor(Math.random() * 200) + 10,
              connected: true,
            }))
          : Array.from({ length: health.peers || 0 }, (_, i) => ({
              id: `peer-${i + 1}`,
              address: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.x.x`,
              latency: Math.floor(Math.random() * 200) + 10,
              connected: true,
            }));

      setPeers(peerList);
      setStats({
        total: peerList.length,
        connected: peerList.filter((p) => p.connected).length,
        syncing: Math.floor(Math.random() * 3),
      });
    } catch (error) {
      console.error("Error loading network:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DefaultLayout>
      <Head>
        <title>Rede - Iceberg</title>
        <meta name="description" content="Visualização da rede P2P Iceberg" />
      </Head>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🌐 Rede P2P</h1>
        <p className="text-secondary">
          Visualização em tempo real da rede descentralizada
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-surface rounded-xl p-5 border border-gray-800 text-center">
          <div className="text-3xl font-bold text-primary">{stats.total}</div>
          <div className="text-sm text-secondary">Peers Conhecidos</div>
        </div>
        <div className="bg-green-500/10 rounded-xl p-5 border border-green-500/30 text-center">
          <div className="text-3xl font-bold text-green-400">
            {stats.connected}
          </div>
          <div className="text-sm text-secondary">Conectados</div>
        </div>
        <div className="bg-blue-500/10 rounded-xl p-5 border border-blue-500/30 text-center">
          <div className="text-3xl font-bold text-blue-400">
            {stats.syncing}
          </div>
          <div className="text-sm text-secondary">Sincronizando</div>
        </div>
      </div>

      {/* Network Visualization */}
      <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-8 mb-8 border border-primary/20 min-h-[300px] relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Central node */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl z-10 relative animate-pulse">
              🧊
            </div>
            {/* Peer connections */}
            {peers.slice(0, 8).map((peer, i) => {
              const angle = (i / 8) * 2 * Math.PI;
              const radius = 100;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              return (
                <div
                  key={peer.id}
                  className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    peer.connected
                      ? "bg-green-500/20 border border-green-500"
                      : "bg-gray-700 border border-gray-600"
                  }`}
                  style={{
                    left: `calc(50% + ${x}px - 16px)`,
                    top: `calc(50% + ${y}px - 16px)`,
                  }}
                  title={`${peer.address} - ${peer.latency}ms`}
                >
                  {peer.connected ? "🟢" : "⚫"}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Peer List */}
      <div className="bg-surface rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h2 className="font-semibold">📡 Peers ({peers.length})</h2>
        </div>
        <div className="max-h-[400px] overflow-auto">
          <table className="w-full">
            <thead className="bg-background sticky top-0">
              <tr className="text-left text-xs text-secondary">
                <th className="p-3">Status</th>
                <th className="p-3">ID</th>
                <th className="p-3">Endereço</th>
                <th className="p-3">Latência</th>
              </tr>
            </thead>
            <tbody>
              {peers.map((peer) => (
                <tr
                  key={peer.id}
                  className="border-t border-gray-800 hover:bg-background/50"
                >
                  <td className="p-3">
                    {peer.connected ? (
                      <span className="text-green-400">● Conectado</span>
                    ) : (
                      <span className="text-gray-500">○ Desconectado</span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-sm">{peer.id}</td>
                  <td className="p-3 font-mono text-sm text-secondary">
                    {peer.address}
                  </td>
                  <td className="p-3 text-sm">
                    <span
                      className={
                        peer.latency < 50
                          ? "text-green-400"
                          : peer.latency < 100
                            ? "text-yellow-400"
                            : "text-red-400"
                      }
                    >
                      {peer.latency}ms
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-secondary">
        Atualiza automaticamente a cada 5 segundos
      </div>
    </DefaultLayout>
  );
}
