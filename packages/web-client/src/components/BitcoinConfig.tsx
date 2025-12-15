/**
 * Bitcoin Wallet Configuration Component
 */

import { useState, useEffect } from "react";
import { api, useStore } from "@/lib/store";

interface BitcoinConfigProps {
  onSave?: () => void;
}

export default function BitcoinConfig({ onSave }: BitcoinConfigProps) {
  const { identity } = useStore();
  const [btcAddress, setBtcAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (identity?.btcAddress) {
      setBtcAddress(identity.btcAddress);
    }
  }, [identity]);

  // Validate Bitcoin address (basic check)
  function isValidBtcAddress(address: string): boolean {
    // Basic validation for mainnet/testnet addresses
    if (!address) return true; // Empty is ok
    
    // Legacy (1...), SegWit (3...), Native SegWit (bc1...)
    const patterns = [
      /^1[a-km-zA-HJ-NP-Z1-9]{25,34}$/, // Legacy
      /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/, // SegWit
      /^bc1[a-z0-9]{39,59}$/,           // Native SegWit (bech32)
    ];
    
    return patterns.some(p => p.test(address));
  }

  async function handleSave() {
    if (!btcAddress) {
      setError("");
      return;
    }

    if (!isValidBtcAddress(btcAddress)) {
      setError("Endereço Bitcoin inválido");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await api.setBtcAddress(btcAddress);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onSave?.();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-surface rounded-xl p-5 border border-gray-800">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">₿</span>
        <h3 className="font-medium">Carteira Bitcoin</h3>
      </div>

      <p className="text-sm text-secondary mb-4">
        Configure seu endereço Bitcoin para receber recompensas de bounties e verificações.
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-secondary mb-1">Endereço Bitcoin</label>
          <input
            type="text"
            value={btcAddress}
            onChange={(e) => setBtcAddress(e.target.value)}
            placeholder="bc1q... ou 1... ou 3..."
            className="w-full bg-background border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none"
          />
        </div>

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
            saved
              ? "bg-green-500/20 text-green-400"
              : "bg-primary/20 text-primary hover:bg-primary/30"
          }`}
        >
          {saving ? "Salvando..." : saved ? "✓ Salvo!" : "Salvar Endereço"}
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          💡 Dica: Use uma carteira que você controla (não exchange). 
          Receba BTC de bounties quando suas verificações forem aceitas.
        </p>
      </div>
    </div>
  );
}
