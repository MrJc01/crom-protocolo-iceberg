/**
 * IBGE API Service
 * 
 * Integration with Brazilian Institute of Geography and Statistics
 * for geographic data and population thresholds in consensus
 */

import { logger } from "./logger";

const IBGE_BASE_URL = "https://servicodados.ibge.gov.br/api/v1";

export interface Municipio {
  id: number;
  nome: string;
  codigo: string;
  uf: string;
  populacao?: number;
  vizinhos?: string[];
}

export interface Estado {
  id: number;
  sigla: string;
  nome: string;
}

// Cache for API responses
const cache: Map<string, { data: any; expires: number }> = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function fetchWithCache<T>(url: string): Promise<T> {
  const cached = cache.get(url);
  if (cached && cached.expires > Date.now()) {
    return cached.data as T;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`IBGE API error: ${response.status}`);
    }
    const data = await response.json();
    cache.set(url, { data, expires: Date.now() + CACHE_TTL });
    return data as T;
  } catch (error) {
    logger.error({ error, url }, "IBGE API fetch failed");
    throw error;
  }
}

export const ibgeService = {
  /**
   * List all Brazilian states
   */
  async listEstados(): Promise<Estado[]> {
    return fetchWithCache<Estado[]>(`${IBGE_BASE_URL}/localidades/estados`);
  },

  /**
   * Get municipalities by state
   */
  async getMunicipiosByUF(uf: string): Promise<Municipio[]> {
    const data = await fetchWithCache<any[]>(
      `${IBGE_BASE_URL}/localidades/estados/${uf}/municipios`
    );
    return data.map((m) => ({
      id: m.id,
      nome: m.nome,
      codigo: m.id.toString(),
      uf: uf.toUpperCase(),
    }));
  },

  /**
   * Get municipality by ID
   */
  async getMunicipio(id: string): Promise<Municipio | null> {
    try {
      const data = await fetchWithCache<any>(
        `${IBGE_BASE_URL}/localidades/municipios/${id}`
      );
      return {
        id: data.id,
        nome: data.nome,
        codigo: data.id.toString(),
        uf: data.microrregiao?.mesorregiao?.UF?.sigla || "",
      };
    } catch {
      return null;
    }
  },

  /**
   * Search municipalities by name
   */
  async searchMunicipios(query: string, uf?: string): Promise<Municipio[]> {
    const estados = uf ? [uf] : ["SP", "RJ", "MG", "RS", "PR"]; // Top 5 states
    const results: Municipio[] = [];

    for (const estado of estados) {
      const municipios = await this.getMunicipiosByUF(estado);
      const matches = municipios.filter((m) =>
        m.nome.toLowerCase().includes(query.toLowerCase())
      );
      results.push(...matches);
    }

    return results.slice(0, 20); // Limit results
  },

  /**
   * Get population estimate for municipality
   * Note: IBGE provides this via a different API endpoint
   */
  async getPopulacao(municipioId: string): Promise<number> {
    // Default estimates for known cities
    const estimates: Record<string, number> = {
      "3550308": 12400000, // São Paulo
      "3304557": 6750000,  // Rio de Janeiro
      "3106200": 2530000,  // Belo Horizonte
      "4106902": 1960000,  // Curitiba
      "4314902": 1490000,  // Porto Alegre
    };

    if (estimates[municipioId]) {
      return estimates[municipioId];
    }

    // Default for unknown cities: 100k
    return 100000;
  },

  /**
   * Calculate consensus threshold based on population
   * Using logarithmic formula from docs/03_LOGICA_DE_CONSENSO.md
   */
  calculateThreshold(populacao: number, fatorDificuldade = 1.0): number {
    // threshold = log10(populacao) × fator × taxa_engajamento
    const base = Math.log10(Math.max(populacao, 100));
    const engajamento = 0.01; // 1% estimated engagement
    return Math.ceil(base * fatorDificuldade * populacao * engajamento);
  },

  /**
   * Parse region code (BR-SP-SAO_PAULO) to components
   */
  parseRegionCode(code: string): { country: string; state: string; city: string } {
    const parts = code.split("-");
    return {
      country: parts[0] || "BR",
      state: parts[1] || "",
      city: parts.slice(2).join("-") || "",
    };
  },

  /**
   * Build region code from components
   */
  buildRegionCode(state: string, city: string): string {
    const cityCode = city.toUpperCase().replace(/\s+/g, "_");
    return `BR-${state.toUpperCase()}-${cityCode}`;
  },

  /**
   * Get neighboring cities (simplified - same state)
   */
  async getNeighbors(municipioId: string, count = 5): Promise<Municipio[]> {
    const municipio = await this.getMunicipio(municipioId);
    if (!municipio) return [];

    const stateMunicipios = await this.getMunicipiosByUF(municipio.uf);
    // Return random sample (simplified - real impl would use geographic proximity)
    const shuffled = stateMunicipios
      .filter((m) => m.id.toString() !== municipioId)
      .sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  },
};

export default ibgeService;
