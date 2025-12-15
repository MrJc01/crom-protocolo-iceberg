/**
 * Keyboard Navigation Hook
 * 
 * Provides keyboard shortcuts for the application
 */

import { useEffect, useCallback } from "react";
import { useRouter } from "next/router";

interface KeyboardShortcuts {
  [key: string]: {
    description: string;
    action: () => void;
  };
}

export function useKeyboardNavigation() {
  const router = useRouter();

  const shortcuts: KeyboardShortcuts = {
    "g h": { description: "Ir para Home", action: () => router.push("/") },
    "g r": { description: "Ir para Recentes", action: () => router.push("/recentes") },
    "g p": { description: "Ir para Publicar", action: () => router.push("/publicar") },
    "g m": { description: "Ir para Meus Posts", action: () => router.push("/meus-posts") },
    "g s": { description: "Ir para Buscar", action: () => router.push("/buscar") },
    "?": { description: "Mostrar atalhos", action: () => {} },
  };

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      // Build key sequence
      const key = event.key.toLowerCase();

      // Check for two-key sequences (g + letter)
      if (key === "g") {
        // Wait for next key
        const handleNextKey = (e: KeyboardEvent) => {
          const nextKey = e.key.toLowerCase();
          const sequence = `g ${nextKey}`;
          
          if (shortcuts[sequence]) {
            e.preventDefault();
            shortcuts[sequence].action();
          }
          
          document.removeEventListener("keydown", handleNextKey);
        };
        
        document.addEventListener("keydown", handleNextKey, { once: true });
        
        // Timeout to clear listener
        setTimeout(() => {
          document.removeEventListener("keydown", handleNextKey);
        }, 500);
        
        return;
      }

      // Single key shortcuts
      if (shortcuts[key]) {
        event.preventDefault();
        shortcuts[key].action();
      }
    },
    [router]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return shortcuts;
}

export default useKeyboardNavigation;
