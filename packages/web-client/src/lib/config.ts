/**
 * Configurações Centralizadas do Iceberg
 * 
 * Este módulo carrega as configurações do arquivo config/iceberg_config.json
 * Use este módulo em vez de hardcoded values para facilitar modificações
 */

import configData from '../../../../config/iceberg_config.json';

// Types
export interface City {
  code: string;
  name: string;
  state: string;
  population: number;
}

export interface Category {
  id: string;
  label: string;
  icon: string;
}

export interface Level {
  value: number;
  label: string;
  color: string;
  icon: string;
  description: string;
}

export interface PromotionRule {
  description: string;
  min_votes: number;
  vote_ratio_percent: number;
  min_seeds_local?: number;
  min_seeds_global?: number;
  max_report_ratio_percent: number;
  min_time_hours?: number;
  min_time_days?: number;
}

export interface TimeIntervals {
  moderation_check_hours: number;
  metrics_snapshot_days: number;
  scheduled_posts_check_minutes: number;
  chat_polling_seconds: number;
  consensus_update_minutes: number;
}

export interface Limits {
  title_max_chars: number;
  body_max_chars: number;
  comment_max_chars: number;
  posts_per_day: number;
  comments_per_hour: number;
  votes_per_minute: number;
  saved_posts_max: number;
  chat_message_max_chars: number;
}

export interface IcebergConfig {
  version: string;
  cities: { list: City[] };
  categories: { list: Category[] };
  levels: { list: Level[] };
  moderation: {
    check_interval_hours: number;
    snapshot_interval_days: number;
    report_threshold_percent: number;
    auto_hide_after_reports: number;
    inactivity_archive_days: number;
    end_post_inactivity_days: number;
  };
  time_intervals: TimeIntervals;
  promotion_rules: {
    level_0_to_1: PromotionRule;
    level_1_to_2: PromotionRule;
    level_2_to_3: PromotionRule;
  };
  demotion_rules: {
    report_threshold_percent: number;
    blacklist_days: number;
    protection_with_high_seeds: boolean;
    protection_threshold_seeds: number;
  };
  limits: Limits;
  bounty: {
    enabled: boolean;
    min_amount_btc: number;
    expiration_hours: number;
  };
  community_rules: {
    prohibited_content: string[];
    allowed_content: string[];
    behavior_guidelines: string[];
  };
  ai_moderation: {
    enabled: boolean;
    provider: string;
    auto_flag_threshold: number;
    auto_hide_threshold: number;
    categories_to_check: string[];
  };
}

// Export config
export const config = configData as IcebergConfig;

// Convenience exports
export const CITIES = config.cities.list;
export const CATEGORIES = config.categories.list;
export const LEVELS = config.levels.list;
export const LIMITS = config.limits;
export const TIME_INTERVALS = config.time_intervals;
export const PROMOTION_RULES = config.promotion_rules;
export const MODERATION = config.moderation;

// Helper functions
export function getCityByCode(code: string): City | undefined {
  return CITIES.find(c => c.code === code);
}

export function getCityName(code: string): string {
  const city = getCityByCode(code);
  return city ? `${city.name}, ${city.state}` : code.split("-").pop()?.replace(/_/g, " ") || code;
}

export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find(c => c.id === id);
}

export function getLevelInfo(level: number): Level | undefined {
  return LEVELS.find(l => l.value === level);
}

export default config;
