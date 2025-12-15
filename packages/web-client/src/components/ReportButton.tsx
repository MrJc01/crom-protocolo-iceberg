import { useState } from 'react';
import { api, useStore } from '@/lib/store';

interface ReportButtonProps {
  targetCid: string;
  targetType: 'post' | 'comment';
  onReport?: () => void;
}

const REPORT_REASONS = [
  { value: 'spam', label: '🚫 Spam/Publicidade' },
  { value: 'offensive', label: '😡 Conteúdo ofensivo' },
  { value: 'misinformation', label: '❌ Informação falsa' },
  { value: 'illegal', label: '⚠️ Conteúdo ilegal' },
  { value: 'harassment', label: '👊 Assédio/Ameaças' },
  { value: 'other', label: '📝 Outro motivo' },
];

export default function ReportButton({ targetCid, targetType, onReport }: ReportButtonProps) {
  const { identity } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const finalReason = reason === 'other' ? customReason : reason;
    if (!finalReason.trim()) {
      setError('Selecione um motivo');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.createReport(targetCid, targetType, finalReason);
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        onReport?.();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar denúncia');
    } finally {
      setLoading(false);
    }
  }

  if (!identity) {
    return (
      <button
        onClick={() => window.location.href = '/login'}
        className="text-xs text-secondary hover:text-red-400 flex items-center gap-1"
      >
        ⚠️ Denunciar
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs text-secondary hover:text-red-400 flex items-center gap-1"
      >
        ⚠️ Denunciar
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-64 bg-surface border border-gray-700 rounded-lg shadow-xl z-50">
          <div className="p-3">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-sm">Denunciar {targetType === 'post' ? 'post' : 'comentário'}</h4>
              <button
                onClick={() => setIsOpen(false)}
                className="text-secondary hover:text-on-surface"
              >
                ✕
              </button>
            </div>

            {success ? (
              <div className="text-center py-4">
                <span className="text-3xl mb-2 block">✅</span>
                <p className="text-green-400 text-sm">Denúncia enviada!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="space-y-2 mb-3">
                  {REPORT_REASONS.map((r) => (
                    <label
                      key={r.value}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                        reason === r.value ? 'bg-primary/20 text-primary' : 'hover:bg-gray-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={(e) => setReason(e.target.value)}
                        className="hidden"
                      />
                      <span className="text-sm">{r.label}</span>
                    </label>
                  ))}
                </div>

                {reason === 'other' && (
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Descreva o motivo..."
                    rows={2}
                    className="w-full bg-background border border-gray-700 rounded px-3 py-2 text-sm mb-3 focus:border-primary focus:outline-none resize-none"
                  />
                )}

                {error && (
                  <p className="text-red-400 text-xs mb-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !reason}
                  className="w-full py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded text-sm hover:bg-red-500/30 disabled:opacity-50"
                >
                  {loading ? 'Enviando...' : 'Enviar denúncia'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
