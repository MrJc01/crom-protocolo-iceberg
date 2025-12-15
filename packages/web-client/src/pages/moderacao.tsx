import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import DefaultLayout from "@/components/DefaultLayout";
import { api, useStore } from "@/lib/store";

interface Report {
  id: string;
  targetCid: string;
  targetType: "post" | "comment";
  reporter: string;
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  createdAt: number;
  resolvedAt: number | null;
}

export default function ModeracaoPage() {
  const { identity } = useStore();
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<string>("pending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [filter]);

  async function loadReports() {
    setLoading(true);
    try {
      const data = await api.getReports(filter);
      setReports(data.reports || []);
    } catch (err) {
      console.error("Erro ao carregar denúncias:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(reportId: string, action: "resolved" | "dismissed") {
    try {
      const res = await fetch(`http://localhost:8420/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
      if (res.ok) {
        loadReports();
      }
    } catch (err) {
      console.error("Erro ao atualizar denúncia:", err);
    }
  }

  function formatDate(ts: number) {
    return new Date(ts).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getReasonLabel(reason: string) {
    const labels: Record<string, string> = {
      spam: "🗑️ Spam",
      harassment: "😠 Assédio",
      misinformation: "❌ Desinformação",
      illegal: "⚠️ Ilegal",
      other: "❓ Outro",
    };
    return labels[reason] || reason;
  }

  if (!identity) {
    return (
      <DefaultLayout maxWidth="sm">
        <Head>
          <title>Moderação · Iceberg</title>
        </Head>
        <div className="text-center py-12 bg-surface rounded-lg">
          <span className="text-4xl">🔐</span>
          <h1 className="text-xl font-bold mt-4">Login Necessário</h1>
          <a href="/login" className="px-6 py-2 bg-primary text-white rounded-lg inline-block mt-4">
            Entrar
          </a>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout maxWidth="lg">
      <Head>
        <title>Moderação · Iceberg</title>
      </Head>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🛡️ Painel de Moderação</h1>

        <div className="flex gap-2">
          {["pending", "resolved", "dismissed"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                filter === status
                  ? "bg-primary text-white"
                  : "bg-surface text-secondary hover:bg-background"
              }`}
            >
              {status === "pending" && "⏳ Pendentes"}
              {status === "resolved" && "✅ Resolvidas"}
              {status === "dismissed" && "❌ Ignoradas"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-lg">
          <span className="text-4xl">✨</span>
          <h2 className="text-lg font-semibold mt-4">Nenhuma denúncia {filter}</h2>
          <p className="text-secondary mt-2">Tudo limpo por aqui!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-surface rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getReasonLabel(report.reason)}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      report.targetType === "post" 
                        ? "bg-blue-500/20 text-blue-400" 
                        : "bg-purple-500/20 text-purple-400"
                    }`}>
                      {report.targetType === "post" ? "Post" : "Comentário"}
                    </span>
                  </div>

                  <p className="text-sm text-secondary mb-2">
                    Denunciado em {formatDate(report.createdAt)} por{" "}
                    <span className="font-mono">{report.reporter.slice(0, 12)}...</span>
                  </p>

                  <Link
                    href={`/post/${report.targetCid}`}
                    className="text-primary text-sm hover:underline"
                  >
                    Ver conteúdo →
                  </Link>
                </div>

                {report.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(report.id, "resolved")}
                      className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                    >
                      ✅ Resolver
                    </button>
                    <button
                      onClick={() => handleAction(report.id, "dismissed")}
                      className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                    >
                      ❌ Ignorar
                    </button>
                  </div>
                )}

                {report.status !== "pending" && (
                  <span className={`px-3 py-1.5 rounded text-sm ${
                    report.status === "resolved" 
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}>
                    {report.status === "resolved" ? "✅ Resolvida" : "❌ Ignorada"}
                    {report.resolvedAt && (
                      <span className="ml-2 text-xs opacity-70">
                        ({formatDate(report.resolvedAt)})
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DefaultLayout>
  );
}
