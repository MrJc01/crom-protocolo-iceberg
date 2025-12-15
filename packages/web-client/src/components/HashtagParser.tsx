/**
 * HashtagParser - Transforma hashtags em links clicáveis
 */

import Link from "next/link";
import React from "react";

interface HashtagParserProps {
  text: string;
  className?: string;
}

/**
 * Componente que renderiza texto com hashtags clicáveis
 */
export default function HashtagParser({ text, className = "" }: HashtagParserProps) {
  // Regex para encontrar hashtags
  const hashtagRegex = /#(\w+)/g;
  
  // Dividir texto e hashtagsf
  const parts: (string | React.ReactNode)[] = [];
  let lastIndex = 0;
  let match;
  
  const textCopy = text;
  while ((match = hashtagRegex.exec(textCopy)) !== null) {
    // Adicionar texto antes da hashtag
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
    // Adicionar link da hashtag
    const tag = match[1];
    parts.push(
      <Link
        key={`${tag}-${match.index}`}
        href={`/hashtag/${tag}`}
        className="text-primary hover:text-primary-light transition-colors font-medium"
      >
        #{tag}
      </Link>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Adicionar texto restante
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return <span className={className}>{parts}</span>;
}

/**
 * Função utilitária para extrair hashtags de um texto
 */
export function extractHashtags(text: string): string[] {
  const regex = /#(\w+)/g;
  const matches = text.match(regex) || [];
  return Array.from(new Set(matches.map(m => m.slice(1).toLowerCase())));
}

/**
 * Componente para exibir lista de hashtags com badges
 */
export function HashtagBadges({ tags, size = "sm" }: { tags: string[]; size?: "sm" | "md" }) {
  const sizeClasses = size === "sm" 
    ? "text-xs px-2 py-0.5" 
    : "text-sm px-3 py-1";
  
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map(tag => (
        <Link
          key={tag}
          href={`/hashtag/${tag}`}
          className={`${sizeClasses} bg-primary/20 text-primary rounded-full hover:bg-primary/30 transition-colors`}
        >
          #{tag}
        </Link>
      ))}
    </div>
  );
}
