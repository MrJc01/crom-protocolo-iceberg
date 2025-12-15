/**
 * AI Content Moderation Module
 * 
 * Integração com Gemini API para verificação de conteúdo
 * Pode ser usada antes de publicar posts/comentários
 * 
 * Nota: Requer GEMINI_API_KEY no ambiente
 */

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

interface ModerationResult {
  safe: boolean;
  flagged: boolean;
  categories: string[];
  reason?: string;
  confidence: number;
}

const PROHIBITED_CATEGORIES = [
  "violence",
  "hate_speech",
  "harassment",
  "illegal_content",
  "explicit_sexual",
  "child_exploitation",
  "terrorism",
  "self_harm",
];

/**
 * Verifica conteúdo usando Gemini API
 */
export async function moderateContent(content: string): Promise<ModerationResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Modo offline: permitir tudo se não tiver API key
  if (!apiKey) {
    console.warn("[Moderation] GEMINI_API_KEY não configurada - modo offline");
    return {
      safe: true,
      flagged: false,
      categories: [],
      confidence: 0,
    };
  }

  try {
    const prompt = `Você é um sistema de moderação de conteúdo. Analise o texto a seguir e determine se ele viola alguma das seguintes categorias proibidas:

Categorias proibidas:
- violence: Incitação à violência física
- hate_speech: Discurso de ódio contra grupos
- harassment: Assédio ou ameaças a indivíduos
- illegal_content: Conteúdo ilegal (drogas, armas ilegais)
- explicit_sexual: Conteúdo sexual explícito
- child_exploitation: Qualquer conteúdo envolvendo menores
- terrorism: Propaganda terrorista
- self_harm: Incentivo à automutilação

Texto para análise:
"""
${content.slice(0, 2000)}
"""

Responda APENAS em formato JSON:
{
  "safe": boolean,
  "flagged_categories": string[],
  "reason": string ou null,
  "confidence": number entre 0 e 1
}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 500,
        },
      }),
    });

    if (!response.ok) {
      console.error("[Moderation] Erro na API:", response.status);
      return {
        safe: true, // Fail open
        flagged: false,
        categories: [],
        confidence: 0,
      };
    }

    const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[Moderation] Resposta não é JSON:", text);
      return { safe: true, flagged: false, categories: [], confidence: 0 };
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      safe: result.safe !== false,
      flagged: !result.safe || (result.flagged_categories?.length > 0),
      categories: result.flagged_categories || [],
      reason: result.reason,
      confidence: result.confidence || 0.5,
    };
  } catch (error) {
    console.error("[Moderation] Erro:", error);
    // Fail open - permitir em caso de erro
    return {
      safe: true,
      flagged: false,
      categories: [],
      confidence: 0,
    };
  }
}

/**
 * Verifica conteúdo de forma simples usando regex patterns
 * Fallback quando API não está disponível
 */
export function basicContentCheck(content: string): ModerationResult {
  const lowerContent = content.toLowerCase();
  const flaggedPatterns: { category: string; patterns: string[] }[] = [
    {
      category: "hate_speech",
      patterns: ["morte aos", "exterminar", "inferioridade racial"],
    },
    {
      category: "violence",
      patterns: ["matar", "assassinar", "explodir"],
    },
    {
      category: "illegal_content",
      patterns: ["comprar armas", "onde comprar droga", "venda de"],
    },
  ];

  const flagged: string[] = [];

  for (const { category, patterns } of flaggedPatterns) {
    for (const pattern of patterns) {
      if (lowerContent.includes(pattern)) {
        flagged.push(category);
        break;
      }
    }
  }

  return {
    safe: flagged.length === 0,
    flagged: flagged.length > 0,
    categories: flagged,
    reason: flagged.length > 0 ? "Conteúdo potencialmente proibido detectado" : undefined,
    confidence: 0.3, // Low confidence for basic check
  };
}

/**
 * Combina verificação AI + basic para melhor precisão
 */
export async function checkContent(content: string): Promise<ModerationResult> {
  // Primeiro faz check básico (rápido)
  const basicResult = basicContentCheck(content);
  
  // Se basic flagged com algo sério, retorna logo
  if (basicResult.categories.includes("child_exploitation") ||
      basicResult.categories.includes("terrorism")) {
    return basicResult;
  }

  // Se tiver API key, usa AI para verificação mais precisa
  if (process.env.GEMINI_API_KEY) {
    return await moderateContent(content);
  }

  return basicResult;
}
