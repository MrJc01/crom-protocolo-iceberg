/**
 * useSystemMode - Hook for System Mode Detection
 * 
 * Detects if the system is running in LOCAL (app desktop) or ONLINE (shared web) mode.
 * Provides access to system information and configuration capabilities.
 */

import { useState, useEffect, useCallback } from "react";

const DAEMON_URL = "http://localhost:8420";

export type SystemMode = "local" | "online";

export interface MemoryInfo {
  total: number;
  used: number;
  available: number;
  limit: number;
  percentage: number;
}

export interface CpuInfo {
  cores: number;
  model: string;
  usage: number;
  loadAvg: number[];
}

export interface StorageInfo {
  total: number;
  used: number;
  available: number;
  limit: number;
  dbSize: number;
  dataDir?: string;
}

export interface SystemInfo {
  mode: SystemMode;
  canConfigure: boolean;
  memory: MemoryInfo;
  cpu: CpuInfo;
  storage: StorageInfo;
  uptime: number;
  nodeVersion: string;
  platform: string;
  arch: string;
  hostname?: string;
  timestamp: number;
  data?: {
    posts: number;
    comments: number;
    votes: number;
  };
  formatted?: {
    memory: {
      total: string;
      used: string;
      available: string;
      limit: string;
    };
    storage: {
      total: string;
      used: string;
      available: string;
      limit: string;
      dbSize: string;
    };
  };
}

export interface SystemLimits {
  maxMemoryMB: number;
  maxStorageGB: number;
  maxPeers: number;
  maxPostsPerDay: number;
  maxChatMessages: number;
  formatted?: {
    maxMemory: string;
    maxStorage: string;
  };
}

export interface SystemConfig {
  mode: SystemMode;
  limits: SystemLimits;
  paths?: {
    dataDir: string;
    database: string;
  };
  environment?: Record<string, string>;
  features?: Record<string, boolean>;
}

interface UseSystemModeReturn {
  mode: SystemMode;
  isLocal: boolean;
  isOnline: boolean;
  canConfigure: boolean;
  systemInfo: SystemInfo | null;
  systemConfig: SystemConfig | null;
  limits: SystemLimits | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshConfig: () => Promise<void>;
  updateConfig: (config: Partial<SystemLimits>) => Promise<{ success: boolean; message?: string }>;
}

export function useSystemMode(): UseSystemModeReturn {
  const [mode, setMode] = useState<SystemMode>("online");
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [limits, setLimits] = useState<SystemLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemMode = useCallback(async () => {
    try {
      const res = await fetch(`${DAEMON_URL}/system/mode`);
      if (res.ok) {
        const data = await res.json();
        setMode(data.mode || "online");
        return data.mode;
      }
      return "online";
    } catch {
      return "online";
    }
  }, []);

  const fetchSystemInfo = useCallback(async () => {
    try {
      const res = await fetch(`${DAEMON_URL}/system/info`);
      if (res.ok) {
        const data = await res.json();
        setSystemInfo(data);
        setMode(data.mode || "online");
      }
    } catch (err) {
      setError("Erro ao carregar informações do sistema");
    }
  }, []);

  const fetchLimits = useCallback(async () => {
    try {
      const res = await fetch(`${DAEMON_URL}/system/limits`);
      if (res.ok) {
        const data = await res.json();
        setLimits(data.limits);
      }
    } catch {
      // Ignore limits fetch error
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`${DAEMON_URL}/system/config`);
      if (res.ok) {
        const data = await res.json();
        setSystemConfig(data);
      }
    } catch {
      // Config might not be available in online mode
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchSystemMode(),
        fetchSystemInfo(),
        fetchLimits(),
      ]);
    } catch (err) {
      setError("Erro ao atualizar dados do sistema");
    } finally {
      setLoading(false);
    }
  }, [fetchSystemMode, fetchSystemInfo, fetchLimits]);

  const refreshConfig = useCallback(async () => {
    await fetchConfig();
  }, [fetchConfig]);

  const updateConfig = useCallback(async (config: Partial<SystemLimits>): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`${DAEMON_URL}/system/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (res.ok) {
        await refresh();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || "Erro ao atualizar configuração" };
    } catch {
      return { success: false, message: "Erro de conexão com o daemon" };
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
    if (mode === "local") {
      fetchConfig();
    }
  }, []);

  // Additional effect to fetch config when mode changes to local
  useEffect(() => {
    if (mode === "local" && !systemConfig) {
      fetchConfig();
    }
  }, [mode, systemConfig, fetchConfig]);

  return {
    mode,
    isLocal: mode === "local",
    isOnline: mode === "online",
    canConfigure: mode === "local",
    systemInfo,
    systemConfig,
    limits,
    loading,
    error,
    refresh,
    refreshConfig,
    updateConfig,
  };
}

// Helper hook for quick mode check
export function useIsLocalMode(): boolean {
  const { isLocal } = useSystemMode();
  return isLocal;
}

// Utility function to format uptime
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

// Utility function to format bytes
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default useSystemMode;
