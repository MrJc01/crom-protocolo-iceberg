/**
 * QR Code Identity Sync Component
 * Export/import identity via QR code
 */

import { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";

// Simple QR code generator (canvas-based)
function generateQRCode(data: string, size: number): string {
  // For production, use a proper QR library like 'qrcode'
  // This is a placeholder that creates a data URL
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  
  if (ctx) {
    // Simple placeholder pattern
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#000000";
    
    // Create simple pattern based on data
    const cellSize = 4;
    const hash = data.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    
    for (let y = 0; y < size / cellSize; y++) {
      for (let x = 0; x < size / cellSize; x++) {
        if ((hash + x * y) % 3 === 0) {
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }
  }
  
  return canvas.toDataURL();
}

interface QRSyncProps {
  mode: "export" | "import";
  onClose?: () => void;
}

export default function QRSync({ mode, onClose }: QRSyncProps) {
  const { identity } = useStore();
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [importKey, setImportKey] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode === "export" && identity) {
      // Generate QR code with public key
      const exportData = JSON.stringify({
        type: "iceberg-identity",
        publicKey: identity.publicKey,
        version: 1,
      });
      setQrDataUrl(generateQRCode(exportData, 200));
    }
  }, [mode, identity]);

  const handleImport = () => {
    if (!importKey.trim()) {
      setError("Cole a chave ou escaneie o QR code");
      return;
    }
    
    try {
      // For now, just validate format
      if (!importKey.startsWith("ed25519:")) {
        setError("Formato de chave inválido");
        return;
      }
      
      // TODO: Implement actual key import
      alert("Funcionalidade de importação em desenvolvimento");
    } catch {
      setError("Erro ao importar chave");
    }
  };

  return (
    <div className="bg-surface rounded-xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {mode === "export" ? "📤 Exportar Identidade" : "📥 Importar Identidade"}
        </h3>
        {onClose && (
          <button onClick={onClose} className="text-secondary hover:text-on-surface">
            ✕
          </button>
        )}
      </div>

      {mode === "export" ? (
        <div className="text-center">
          {qrDataUrl && (
            <div className="inline-block p-4 bg-white rounded-xl mb-4">
              <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
            </div>
          )}
          
          <p className="text-sm text-secondary mb-3">
            Escaneie este QR code em outro dispositivo para sincronizar.
          </p>
          
          <div className="bg-background rounded-lg p-3">
            <p className="text-xs text-secondary mb-1">Ou copie sua chave pública:</p>
            <code className="text-xs font-mono break-all text-primary">
              {identity?.publicKey}
            </code>
          </div>
          
          <button
            onClick={() => {
              navigator.clipboard.writeText(identity?.publicKey || "");
              alert("Chave copiada!");
            }}
            className="mt-3 px-4 py-2 bg-primary/20 text-primary rounded-lg text-sm hover:bg-primary/30"
          >
            📋 Copiar Chave
          </button>
          
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-xs text-yellow-400">
              ⚠️ Nunca compartilhe sua chave privada ou mnemônico!
            </p>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm text-secondary mb-4">
            Cole a chave pública do outro dispositivo para vincular.
          </p>
          
          <textarea
            value={importKey}
            onChange={(e) => setImportKey(e.target.value)}
            placeholder="ed25519:..."
            className="w-full h-24 bg-background border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none resize-none"
          />
          
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          
          <button
            onClick={handleImport}
            className="w-full mt-3 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/80"
          >
            Importar
          </button>
        </div>
      )}
    </div>
  );
}
