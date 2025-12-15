import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import DefaultLayout from "@/components/DefaultLayout";
import { api, useStore } from "@/lib/store";
import HashtagParser, { extractHashtags } from "@/components/HashtagParser";
import { CITIES, CATEGORIES, LIMITS } from "@/lib/config";

// Build regions from centralized config
const REGIONS = CITIES.map(c => ({ value: c.code, label: `${c.name}, ${c.state}` }));

export default function PublicarPage() {
  const router = useRouter();
  const { identity } = useStore();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [region, setRegion] = useState(REGIONS[0].value);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Preview and tabs
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [showPreview, setShowPreview] = useState(false);
  
  // Confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [autoArchiveEnabled, setAutoArchiveEnabled] = useState(false);
  const [autoArchiveDays, setAutoArchiveDays] = useState(30);
  const [btcBounty, setBtcBounty] = useState("");

  // Character count from config
  const titleMax = LIMITS.title_max_chars;
  const bodyMax = LIMITS.body_max_chars;

  // Extract hashtags for preview
  const detectedHashtags = extractHashtags(body);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Show confirmation modal first
    setShowConfirmModal(true);
  }

  async function confirmPublish() {
    setShowConfirmModal(false);
    setLoading(true);
    setError(null);

    try {
      const postData: any = { title, body, region, category };

      if (scheduleEnabled && scheduledDate && scheduledTime) {
        const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).getTime();
        if (scheduledAt > Date.now()) {
          postData.scheduledAt = scheduledAt;
        }
      }

      if (autoArchiveEnabled && autoArchiveDays > 0) {
        postData.autoArchiveAfterDays = autoArchiveDays;
      }

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
        <div className="text-center py-16 bg-gradient-to-br from-surface to-background rounded-2xl border border-gray-800">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold mt-4">Login Necessário</h1>
          <p className="text-secondary mt-2 mb-6 max-w-md mx-auto">
            Você precisa de uma identidade criptográfica para publicar denúncias na rede Iceberg.
          </p>
          <a 
            href="/login" 
            className="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:opacity-90 transition-opacity inline-block"
          >
            Criar Identidade
          </a>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout maxWidth="xl">
      <Head>
        <title>Publicar · Iceberg</title>
      </Head>

      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          ✏️ Novo Ice
        </h1>
        <p className="text-secondary mt-2">
          Compartilhe conhecimento com a comunidade
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-400 animate-pulse">
              ⚠️ {error}
            </div>
          )}

          {/* Title */}
          <div className="bg-surface/50 backdrop-blur-sm rounded-xl p-5 border border-gray-800 hover:border-primary/30 transition-colors">
            <label className="block text-sm font-medium text-secondary mb-3">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={titleMax}
              placeholder="Título claro e direto sobre a denúncia..."
              className="w-full bg-background/50 border border-gray-700 rounded-xl px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
            />
            <div className="flex justify-end mt-2">
              <span className={`text-xs ${title.length > titleMax * 0.9 ? "text-yellow-500" : "text-secondary"}`}>
                {title.length}/{titleMax}
              </span>
            </div>
          </div>

          {/* Category Selector */}
          <div className="bg-surface/50 backdrop-blur-sm rounded-xl p-5 border border-gray-800">
            <label className="block text-sm font-medium text-secondary mb-3">
              📁 Categoria
            </label>
            <div className="grid grid-cols-5 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`
                    flex flex-col items-center justify-center p-3 rounded-xl transition-all
                    ${category === cat.id 
                      ? "bg-primary/20 border-2 border-primary scale-105" 
                      : "bg-background/50 border border-gray-700 hover:border-primary/50"
                    }
                  `}
                  title={cat.label}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs mt-1 text-secondary truncate w-full text-center">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Body Editor */}
          <div className="bg-surface/50 backdrop-blur-sm rounded-xl p-5 border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-secondary">
                📝 Conteúdo (Markdown)
              </label>
              <div className="flex bg-background/50 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("write")}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    activeTab === "write" ? "bg-primary text-white" : "text-secondary hover:text-white"
                  }`}
                >
                  Escrever
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    activeTab === "preview" ? "bg-primary text-white" : "text-secondary hover:text-white"
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>
            
            {activeTab === "write" ? (
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                rows={14}
                maxLength={bodyMax}
                placeholder="Descreva os fatos de forma clara e objetiva...

Use #hashtags para categorizar seu conteúdo.
Use **negrito** e *itálico* para ênfase.
Use [texto](url) para links."
                className="w-full bg-background/50 border border-gray-700 rounded-xl px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none font-mono text-sm transition-all"
              />
            ) : (
              <div className="min-h-[356px] bg-background/50 border border-gray-700 rounded-xl px-4 py-3 prose prose-invert prose-sm max-w-none overflow-auto">
                {body ? (
                  <HashtagParser text={body} />
                ) : (
                  <p className="text-secondary italic">Preview do conteúdo aparecerá aqui...</p>
                )}
              </div>
            )}
            
            <div className="flex items-center justify-between mt-2">
              {detectedHashtags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-secondary">Tags:</span>
                  {detectedHashtags.slice(0, 5).map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                      #{tag}
                    </span>
                  ))}
                  {detectedHashtags.length > 5 && (
                    <span className="text-xs text-secondary">+{detectedHashtags.length - 5}</span>
                  )}
                </div>
              )}
              <span className={`text-xs ${body.length > bodyMax * 0.9 ? "text-yellow-500" : "text-secondary"}`}>
                {body.length.toLocaleString()}/{bodyMax.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Region */}
          <div className="bg-surface/50 backdrop-blur-sm rounded-xl p-5 border border-gray-800">
            <label className="block text-sm font-medium text-secondary mb-3">
              📍 Região
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-background/50 border border-gray-700 rounded-xl px-4 py-3 focus:border-primary focus:outline-none"
            >
              {REGIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Advanced Options */}
          <div className="bg-surface/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-background/30 transition-colors"
            >
              <span className="text-sm font-medium">⚙️ Opções Avançadas</span>
              <span className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`}>▼</span>
            </button>
            
            {showAdvanced && (
              <div className="px-5 pb-5 space-y-4 border-t border-gray-800">
                {/* Scheduling */}
                <div className="pt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleEnabled}
                      onChange={(e) => setScheduleEnabled(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-600 text-primary focus:ring-primary"
                    />
                    <span>⏰ Agendar publicação</span>
                  </label>
                  
                  {scheduleEnabled && (
                    <div className="mt-3 flex gap-3 ml-8">
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="flex-1 bg-background border border-gray-700 rounded-lg px-3 py-2 text-sm"
                      />
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="bg-background border border-gray-700 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Auto-archive */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoArchiveEnabled}
                      onChange={(e) => setAutoArchiveEnabled(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-600 text-primary focus:ring-primary"
                    />
                    <span>📦 Arquivar após inatividade</span>
                  </label>
                  
                  {autoArchiveEnabled && (
                    <div className="mt-3 flex items-center gap-2 ml-8">
                      <input
                        type="number"
                        value={autoArchiveDays}
                        onChange={(e) => setAutoArchiveDays(parseInt(e.target.value) || 30)}
                        min={7}
                        max={365}
                        className="w-20 bg-background border border-gray-700 rounded-lg px-3 py-2 text-sm"
                      />
                      <span className="text-sm text-secondary">dias sem atividade</span>
                    </div>
                  )}
                </div>

                {/* BTC Bounty */}
                <div>
                  <label className="block text-sm text-secondary mb-2">₿ Bounty Bitcoin</label>
                  <input
                    type="text"
                    value={btcBounty}
                    onChange={(e) => setBtcBounty(e.target.value)}
                    placeholder="Ex: 0.001 BTC ou endereço bc1..."
                    className="w-full bg-background border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                  <p className="text-xs text-secondary mt-1">
                    Incentive verificações com recompensa em Bitcoin
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !title || !body}
            className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.01] active:scale-[0.99]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span> Publicando...
              </span>
            ) : scheduleEnabled ? (
              "📅 Agendar Ice"
            ) : (
              "🚀 Publicar Ice"
            )}
          </button>
        </form>

        {/* Preview Column (Desktop) */}
        <div className="hidden lg:block">
          <div className="sticky top-4 bg-surface/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              👁️ Preview
            </h3>
            
            <div className="bg-background rounded-xl p-5 border border-gray-700">
              {title ? (
                <h2 className="text-xl font-bold mb-3">{title}</h2>
              ) : (
                <h2 className="text-xl text-gray-500 italic">Título aparecerá aqui...</h2>
              )}
              
              <div className="flex items-center gap-3 text-sm text-secondary mb-4">
                {category && (
                  <span className="px-2 py-1 bg-primary/20 rounded-full">
                    {CATEGORIES.find(c => c.id === category)?.icon} {CATEGORIES.find(c => c.id === category)?.label}
                  </span>
                )}
                <span>📍 {REGIONS.find(r => r.value === region)?.label}</span>
              </div>
              
              <div className="prose prose-invert prose-sm max-w-none">
                {body ? (
                  <HashtagParser text={body.slice(0, 500) + (body.length > 500 ? "..." : "")} />
                ) : (
                  <p className="text-gray-500 italic">O conteúdo do post aparecerá aqui...</p>
                )}
              </div>

              {detectedHashtags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-700">
                  {detectedHashtags.map(tag => (
                    <span key={tag} className="text-sm px-3 py-1 bg-primary/10 text-primary rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-sm text-blue-300">
              <p className="font-medium mb-2">📌 Como funciona:</p>
              <ul className="space-y-1 text-xs">
                <li>• Posts começam no Nível 0 (Wild)</li>
                <li>• A comunidade valida e promove conteúdo</li>
                <li>• Níveis mais altos = mais confiável</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl max-w-md w-full p-6 border border-gray-700 animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold mb-2">Confirmação Importante</h2>
              <p className="text-secondary">
                Uma vez publicado, seu conteúdo será <strong className="text-white">permanente e imutável</strong>.
              </p>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 text-sm">
              <p className="text-yellow-300 font-medium mb-2">🔒 Protocolo Iceberg:</p>
              <ul className="text-yellow-200/80 space-y-1 text-xs">
                <li>• Posts NÃO podem ser editados após publicação</li>
                <li>• Posts NÃO podem ser removidos pelo autor</li>
                <li>• Conteúdo só é ocultado por denúncias em massa</li>
                <li>• Sua identidade está vinculada a este post</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmPublish}
                className="flex-1 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
              >
                Sim, Publicar
              </button>
            </div>
          </div>
        </div>
      )}
    </DefaultLayout>
  );
}
