/**
 * Gemini AI Content Moderation
 * 
 * Integração com Gemini API para verificação de conteúdo
 * antes da publicação (opcional, ativado via GEMINI_API_KEY)
 */

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export interface ModerationResult {
  safe: boolean;
  reason?: string;
  categories?: {
    hate: boolean;
    violence: boolean;
    sexual: boolean;
    spam: boolean;
    misinformation: boolean;
  };
  confidence: number;
}

/**
 * Analisa conteúdo com Gemini AI para moderação
 * @param content - Texto a ser analisado
 * @returns Resultado da moderação
 */
export async function moderateContent(content: string): Promise<ModerationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    // Se não tiver API key, considera seguro (fallback offline)
    return {
      safe: true,
      confidence: 0,
      categories: {
        hate: false,
        violence: false,
        sexual: false,
        spam: false,
        misinformation: false
      }
    };
  }
  
  const prompt = `Você é um moderador de conteúdo para uma plataforma de jornalismo cidadão.
Analise o seguinte texto e determine se ele viola as regras da comunidade.

Regras da comunidade:
- Proibido discurso de ódio ou discriminação
- Proibido conteúdo violento explícito
- Proibido conteúdo sexual explícito
- Proibido spam ou propaganda enganosa
- Proibido desinformação deliberada

Texto a analisar:
"""
${content}
"""

Responda APENAS em JSON no seguinte formato:
{
  "safe": true/false,
  "reason": "motivo se não for seguro, ou null",
  "categories": {
    "hate": true/false,
    "violence": true/false,
    "sexual": true/false,
    "spam": true/false,
    "misinformation": true/false
  },
  "confidence": 0.0-1.0
}`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 500
        }
      })
    });
    
    if (!response.ok) {
      console.error("Gemini API error:", response.status, response.statusText);
      // Em caso de erro, retorna seguro para não bloquear
      return {
        safe: true,
        confidence: 0,
        reason: "Falha ao conectar com serviço de moderação"
      };
    }
    
    const data = await response.json();
    
    // Extrair texto da resposta
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      return { safe: true, confidence: 0 };
    }
    
    // Tentar parsear JSON da resposta
    try {
      // Limpar markdown se presente
      const jsonText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const result = JSON.parse(jsonText);
      return {
        safe: result.safe,
        reason: result.reason,
        categories: result.categories,
        confidence: result.confidence || 0.5
      };
    } catch (parseError) {
      // Se não conseguir parsear, verificar por keywords
      const isSafe = !text.toLowerCase().includes('"safe": false');
      return {
        safe: isSafe,
        confidence: 0.3,
        reason: isSafe ? undefined : "Conteúdo potencialmente inapropriado detectado"
      };
    }
  } catch (error) {
    console.error("Erro ao moderar conteúdo:", error);
    // Em caso de erro de rede, não bloqueia
    return { safe: true, confidence: 0 };
  }
}

/**
 * Verifica se moderação está habilitada
 */
export function isModerationEnabled(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

/**
 * Middleware para Express que modera conteúdo de posts
 */
export function moderationMiddleware() {
  return async (req: any, res: any, next: any) => {
    // Só modera se tiver API key
    if (!isModerationEnabled()) {
      return next();
    }
    
    const { title, body } = req.body;
    
    if (!title && !body) {
      return next();
    }
    
    const content = `${title || ""}\n${body || ""}`.trim();
    
    // Não moderar conteúdo muito curto
    if (content.length < 20) {
      return next();
    }
    
    try {
      const result = await moderateContent(content);
      
      // Anexar resultado à request
      req.moderation = result;
      
      // Se não for seguro e confidence alta, bloquear
      if (!result.safe && result.confidence >= 0.8) {
        return res.status(400).json({
          error: "Conteúdo viola regras da comunidade",
          reason: result.reason,
          categories: result.categories,
          confidence: result.confidence
        });
      }
      
      // Se não for seguro mas confidence baixa, avisar mas permitir
      if (!result.safe) {
        req.moderationWarning = result.reason;
      }
      
      next();
    } catch (error) {
      // Falha silenciosa - não bloqueia usuário por erro de API
      console.error("Moderation middleware error:", error);
      next();
    }
  };
}
