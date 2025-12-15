import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import DefaultLayout from "@/components/DefaultLayout";
import { api, useStore } from "@/lib/store";

const REGIONS = [
  { value: "BR-SP-SAO_PAULO", label: "São Paulo, SP" },
  { value: "BR-RJ-RIO_DE_JANEIRO", label: "Rio de Janeiro, RJ" },
  { value: "BR-MG-BELO_HORIZONTE", label: "Belo Horizonte, MG" },
  { value: "BR-RS-PORTO_ALEGRE", label: "Porto Alegre, RS" },
  { value: "BR-PR-CURITIBA", label: "Curitiba, PR" },
  { value: "BR-BA-SALVADOR", label: "Salvador, BA" },
  { value: "BR-DF-BRASILIA", label: "Brasília, DF" },
];

export default function PublicarPage() {
  const router = useRouter();
  const { identity } = useStore();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [region, setRegion] = useState(REGIONS[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New features
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [autoArchiveEnabled, setAutoArchiveEnabled] = useState(false);
  const [autoArchiveDays, setAutoArchiveDays] = useState(30);
  const [btcBounty, setBtcBounty] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Build post data
      const postData: any = { title, body, region };

      // Add scheduled time if enabled
      if (scheduleEnabled && scheduledDate && scheduledTime) {
        const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).getTime();
        if (scheduledAt > Date.now()) {
          postData.scheduledAt = scheduledAt;
        }
      }

      // Add auto-archive if enabled
      if (autoArchiveEnabled && autoArchiveDays > 0) {
        postData.autoArchiveAfterDays = autoArchiveDays;
      }

      // Add BTC bounty if provided
      if (btcBounty.trim()) {
        postData.btcBounty = btcBounty.trim();
      }

      const result = await api.createPost(postData);
      if (result.cid) {
        router.push(`/post/${result.cid}`);
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao publicar");
    } finally {
      setLoading(false);
    }
  }

  if (!identity) {
    return (
      <DefaultLayout maxWidth="sm">
        <Head>
          <title>Publicar · Iceberg</title>
        </Head>
        <div className="text-center py-12 bg-surface rounded-lg">
          <span className="text-4xl">🔐</span>
          <h1 className="text-xl font-bold mt-4">Login Necessário</h1>
          <p className="text-secondary mt-2 mb-4">
            Você precisa de uma identidade para publicar.
          </p>
          <a href="/login" className="px-6 py-2 bg-primary text-white rounded-lg inline-block">
            Criar Identidade
          </a>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout maxWidth="md">
      <Head>
        <title>Publicar · Iceberg</title>
      </Head>

      <h1 className="text-2xl font-bold mb-6">✏️ Publicar novo conteúdo</h1>

      <form onSubmit={handleSubmit} className="bg-surface rounded-lg p-6">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm text-secondary mb-2">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            placeholder="Título claro e direto"
            className="w-full bg-background border border-gray-700 rounded-lg px-4 py-3 focus:border-primary focus:outline-none"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm text-secondary mb-2">Conteúdo (Markdown)</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={12}
            placeholder="Descreva os fatos de forma clara e objetiva..."
            className="w-full bg-background border border-gray-700 rounded-lg px-4 py-3 focus:border-primary focus:outline-none resize-none font-mono text-sm"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm text-secondary mb-2">📍 Região</label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full bg-background border border-gray-700 rounded-lg px-4 py-3 focus:border-primary focus:outline-none"
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* Advanced Options Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-primary hover:underline mb-4"
        >
          {showAdvanced ? "▼ Ocultar opções avançadas" : "▶ Mostrar opções avançadas"}
        </button>

        {showAdvanced && (
          <div className="border border-gray-700 rounded-lg p-4 mb-4 space-y-4">
            {/* Scheduling */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduleEnabled}
                  onChange={(e) => setScheduleEnabled(e.target.checked)}
                  className="rounded border-gray-600"
                />
                <span className="text-sm">⏰ Agendar publicação</span>
              </label>
              
              {scheduleEnabled && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="flex-1 bg-background border border-gray-700 rounded px-3 py-2 text-sm"
                  />
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="bg-background border border-gray-700 rounded px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>

            {/* Auto-archive */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoArchiveEnabled}
                  onChange={(e) => setAutoArchiveEnabled(e.target.checked)}
                  className="rounded border-gray-600"
                />
                <span className="text-sm">📦 Arquivar automaticamente após inatividade</span>
              </label>
              
              {autoArchiveEnabled && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    value={autoArchiveDays}
                    onChange={(e) => setAutoArchiveDays(parseInt(e.target.value) || 30)}
                    min={7}
                    max={365}
                    className="w-20 bg-background border border-gray-700 rounded px-3 py-2 text-sm"
                  />
                  <span className="text-sm text-secondary">dias sem atividade</span>
                </div>
              )}
            </div>

            {/* BTC Bounty */}
            <div>
              <label className="block text-sm text-secondary mb-2">₿ Bounty Bitcoin (opcional)</label>
              <input
                type="text"
                value={btcBounty}
                onChange={(e) => setBtcBounty(e.target.value)}
                placeholder="Ex: 0.001 BTC ou endereço bc1..."
                className="w-full bg-background border border-gray-700 rounded px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
              <p className="text-xs text-secondary mt-1">
                Adicione um bounty para incentivar verificações e compartilhamento.
              </p>
            </div>
          </div>
        )}

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-6 text-sm text-blue-300">
          📌 Posts começam no Nível 0 (Wild) e sobem conforme recebem validação da comunidade.
        </div>

        <button
          type="submit"
          disabled={loading || !title || !body}
          className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/80 disabled:opacity-50"
        >
          {loading ? "⏳ Publicando..." : scheduleEnabled ? "📅 Agendar Post" : "🚀 Publicar"}
        </button>
      </form>
    </DefaultLayout>
  );
}
