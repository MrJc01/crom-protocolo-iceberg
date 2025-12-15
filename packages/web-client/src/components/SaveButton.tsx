/**
 * SaveButton - Botão para salvar/remover posts dos favoritos
 */

import { useState, useEffect } from "react";
import { api } from "@/lib/store";

interface SaveButtonProps {
  postCid: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  onSaveChange?: (saved: boolean) => void;
}

export default function SaveButton({ 
  postCid, 
  size = "md", 
  showLabel = false,
  onSaveChange 
}: SaveButtonProps) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Verificar status inicial
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const result = await api.isPostSaved(postCid);
        setSaved(result.saved);
      } catch (error) {
        console.error("Erro ao verificar status de salvo:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkStatus();
  }, [postCid]);
  
  const handleToggle = async () => {
    setLoading(true);
    try {
      if (saved) {
        await api.unsavePost(postCid);
        setSaved(false);
        onSaveChange?.(false);
      } else {
        await api.savePost(postCid);
        setSaved(true);
        onSaveChange?.(true);
      }
    } catch (error) {
      console.error("Erro ao alterar status de salvo:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const sizeClasses = {
    sm: "p-1 text-sm",
    md: "p-2 text-base",
    lg: "p-3 text-lg"
  };
  
  const iconSize = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };
  
  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`
        ${sizeClasses[size]}
        flex items-center gap-2 rounded-lg
        transition-all duration-200
        ${saved 
          ? "text-primary bg-primary/10 hover:bg-primary/20" 
          : "text-secondary hover:text-primary hover:bg-surface-light"
        }
        ${loading ? "opacity-50 cursor-wait" : "cursor-pointer"}
      `}
      title={saved ? "Remover dos salvos" : "Salvar post"}
    >
      {saved ? (
        // Bookmark preenchido
        <svg 
          className={iconSize[size]} 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
        </svg>
      ) : (
        // Bookmark vazio
        <svg 
          className={iconSize[size]} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
          />
        </svg>
      )}
      {showLabel && (
        <span className="text-sm">
          {saved ? "Salvo" : "Salvar"}
        </span>
      )}
    </button>
  );
}
