/**
 * System Mode Configuration
 * 
 * Controls whether the system runs in LOCAL (desktop app) or ONLINE (shared web) mode.
 * LOCAL mode allows full system configuration access.
 * ONLINE mode restricts access to configuration pages.
 */

import * as os from "os";
import * as fs from "fs";
import * as path from "path";

// System mode types
export type SystemMode = 'local' | 'online';

// Detect system mode from environment
export const systemMode: SystemMode = 
  (process.env.ICEBERG_MODE as SystemMode) || 'online';

// Helper functions
export const isLocalMode = (): boolean => systemMode === 'local';
export const isOnlineMode = (): boolean => systemMode === 'online';

// System limits configuration
export interface SystemLimits {
  maxMemoryMB: number;
  maxStorageGB: number;
  maxPeers: number;
  maxPostsPerDay: number;
  maxChatMessages: number;
}

export const systemLimits: Record<SystemMode, SystemLimits> = {
  local: {
    maxMemoryMB: parseInt(process.env.ICEBERG_MAX_MEMORY || '2048'),
    maxStorageGB: parseInt(process.env.ICEBERG_MAX_STORAGE || '10'),
    maxPeers: parseInt(process.env.ICEBERG_MAX_PEERS || '100'),
    maxPostsPerDay: parseInt(process.env.ICEBERG_MAX_POSTS || '50'),
    maxChatMessages: parseInt(process.env.ICEBERG_MAX_CHAT || '1000'),
  },
  online: {
    maxMemoryMB: 512,
    maxStorageGB: 5,
    maxPeers: 50,
    maxPostsPerDay: 10,
    maxChatMessages: 100,
  }
};

// Get current limits based on mode
export const getCurrentLimits = (): SystemLimits => systemLimits[systemMode];

// Memory information interface
export interface MemoryInfo {
  total: number;      // Total system RAM in bytes
  used: number;       // RAM used by this process
  available: number;  // Available RAM
  limit: number;      // Configured limit in bytes
  percentage: number; // Percentage used
}

// CPU information interface
export interface CpuInfo {
  cores: number;
  model: string;
  usage: number;      // Percentage (0-100)
  loadAvg: number[];  // 1, 5, 15 minute load averages
}

// Storage information interface
export interface StorageInfo {
  total: number;      // Total disk space in bytes
  used: number;       // Used space
  available: number;  // Available space
  limit: number;      // Configured limit in bytes
  dbSize: number;     // Database file size
  dataDir: string;    // Data directory path
}

// Complete system info interface
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
  hostname: string;
  timestamp: number;
}

// Track CPU usage over time
let lastCpuUsage = process.cpuUsage();
let lastCpuTime = Date.now();

/**
 * Get real memory information
 */
export function getMemoryInfo(): MemoryInfo {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const processMemory = process.memoryUsage();
  const limitMB = getCurrentLimits().maxMemoryMB;
  const limitBytes = limitMB * 1024 * 1024;
  
  return {
    total: totalMem,
    used: processMemory.heapUsed,
    available: freeMem,
    limit: limitBytes,
    percentage: Math.round((processMemory.heapUsed / limitBytes) * 100),
  };
}

/**
 * Get real CPU information
 */
export function getCpuInfo(): CpuInfo {
  const cpus = os.cpus();
  const now = Date.now();
  const currentCpuUsage = process.cpuUsage(lastCpuUsage);
  
  // Calculate CPU percentage
  const elapsedMs = now - lastCpuTime;
  const elapsedMicros = elapsedMs * 1000;
  const userPercent = (currentCpuUsage.user / elapsedMicros) * 100;
  const systemPercent = (currentCpuUsage.system / elapsedMicros) * 100;
  const totalPercent = Math.min(100, userPercent + systemPercent);
  
  // Update for next call
  lastCpuUsage = process.cpuUsage();
  lastCpuTime = now;
  
  return {
    cores: cpus.length,
    model: cpus[0]?.model || 'Unknown',
    usage: Math.round(totalPercent * 10) / 10,
    loadAvg: os.loadavg(),
  };
}

/**
 * Get storage information
 */
export function getStorageInfo(dataDir?: string): StorageInfo {
  const defaultDataDir = path.join(os.homedir(), ".iceberg");
  const dir = dataDir || defaultDataDir;
  const limitGB = getCurrentLimits().maxStorageGB;
  const limitBytes = limitGB * 1024 * 1024 * 1024;
  
  // Get database file size
  let dbSize = 0;
  const dbPath = path.join(dir, "iceberg.db");
  try {
    const stats = fs.statSync(dbPath);
    dbSize = stats.size;
  } catch {
    // Database doesn't exist yet
  }
  
  // Get data directory size (simplified - just counts immediate files)
  let usedSize = 0;
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      try {
        const stats = fs.statSync(path.join(dir, file));
        if (stats.isFile()) {
          usedSize += stats.size;
        }
      } catch {
        // Ignore errors for individual files
      }
    }
  } catch {
    // Directory doesn't exist
  }
  
  // Get disk space (platform-specific, simplified here)
  // In a real implementation, would use a library like 'diskusage'
  const totalDisk = 100 * 1024 * 1024 * 1024; // Placeholder: 100GB
  const availableDisk = 50 * 1024 * 1024 * 1024; // Placeholder: 50GB
  
  return {
    total: totalDisk,
    used: usedSize,
    available: availableDisk,
    limit: limitBytes,
    dbSize,
    dataDir: dir,
  };
}

/**
 * Get complete system information
 */
export function getSystemInfo(dataDir?: string): SystemInfo {
  return {
    mode: systemMode,
    canConfigure: isLocalMode(),
    memory: getMemoryInfo(),
    cpu: getCpuInfo(),
    storage: getStorageInfo(dataDir),
    uptime: Math.floor(process.uptime()),
    nodeVersion: process.version,
    platform: os.platform(),
    arch: os.arch(),
    hostname: os.hostname(),
    timestamp: Date.now(),
  };
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if a feature is available in current mode
 */
export function isFeatureAvailable(feature: string): boolean {
  const localOnlyFeatures = [
    'system-config',
    'data-export',
    'peer-management',
    'storage-management',
    'limit-configuration',
  ];
  
  if (localOnlyFeatures.includes(feature)) {
    return isLocalMode();
  }
  
  return true;
}

// Export a summary for logging
export function getModeSummary(): string {
  const limits = getCurrentLimits();
  return `Mode: ${systemMode.toUpperCase()} | RAM: ${limits.maxMemoryMB}MB | Storage: ${limits.maxStorageGB}GB | Peers: ${limits.maxPeers}`;
}
