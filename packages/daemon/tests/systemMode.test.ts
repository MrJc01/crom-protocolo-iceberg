/**
 * System Mode Unit Tests
 * 
 * Tests the systemMode.ts module directly without HTTP.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock environment before importing the module
const originalEnv = process.env.ICEBERG_MODE;

describe('systemMode Module', () => {
  afterEach(() => {
    // Restore original environment
    if (originalEnv !== undefined) {
      process.env.ICEBERG_MODE = originalEnv;
    } else {
      delete process.env.ICEBERG_MODE;
    }
    vi.resetModules();
  });

  describe('Mode Detection', () => {
    it('should default to online mode when env not set', async () => {
      delete process.env.ICEBERG_MODE;
      vi.resetModules();
      
      const { systemMode, isLocalMode, isOnlineMode } = await import('../src/systemMode');
      
      expect(systemMode).toBe('online');
      expect(isLocalMode()).toBe(false);
      expect(isOnlineMode()).toBe(true);
    });

    it('should detect local mode from environment', async () => {
      process.env.ICEBERG_MODE = 'local';
      vi.resetModules();
      
      const { systemMode, isLocalMode, isOnlineMode } = await import('../src/systemMode');
      
      expect(systemMode).toBe('local');
      expect(isLocalMode()).toBe(true);
      expect(isOnlineMode()).toBe(false);
    });

    it('should detect online mode from environment', async () => {
      process.env.ICEBERG_MODE = 'online';
      vi.resetModules();
      
      const { systemMode, isLocalMode, isOnlineMode } = await import('../src/systemMode');
      
      expect(systemMode).toBe('online');
      expect(isLocalMode()).toBe(false);
      expect(isOnlineMode()).toBe(true);
    });
  });

  describe('System Limits', () => {
    it('should have different limits for local and online modes', async () => {
      const { systemLimits } = await import('../src/systemMode');
      
      expect(systemLimits.local.maxMemoryMB).toBeGreaterThan(systemLimits.online.maxMemoryMB);
      expect(systemLimits.local.maxStorageGB).toBeGreaterThan(systemLimits.online.maxStorageGB);
      expect(systemLimits.local.maxPeers).toBeGreaterThan(systemLimits.online.maxPeers);
    });

    it('should use environment variables for local limits', async () => {
      process.env.ICEBERG_MODE = 'local';
      process.env.ICEBERG_MAX_MEMORY = '4096';
      process.env.ICEBERG_MAX_STORAGE = '20';
      vi.resetModules();
      
      const { getCurrentLimits } = await import('../src/systemMode');
      const limits = getCurrentLimits();
      
      expect(limits.maxMemoryMB).toBe(4096);
      expect(limits.maxStorageGB).toBe(20);
      
      delete process.env.ICEBERG_MAX_MEMORY;
      delete process.env.ICEBERG_MAX_STORAGE;
    });
  });

  describe('Memory Info', () => {
    it('should return valid memory information', async () => {
      const { getMemoryInfo } = await import('../src/systemMode');
      const memInfo = getMemoryInfo();
      
      expect(memInfo).toHaveProperty('total');
      expect(memInfo).toHaveProperty('used');
      expect(memInfo).toHaveProperty('available');
      expect(memInfo).toHaveProperty('limit');
      expect(memInfo).toHaveProperty('percentage');
      
      expect(memInfo.total).toBeGreaterThan(0);
      expect(memInfo.used).toBeGreaterThanOrEqual(0);
      expect(memInfo.percentage).toBeGreaterThanOrEqual(0);
      expect(memInfo.percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('CPU Info', () => {
    it('should return valid CPU information', async () => {
      const { getCpuInfo } = await import('../src/systemMode');
      const cpuInfo = getCpuInfo();
      
      expect(cpuInfo).toHaveProperty('cores');
      expect(cpuInfo).toHaveProperty('model');
      expect(cpuInfo).toHaveProperty('usage');
      expect(cpuInfo).toHaveProperty('loadAvg');
      
      expect(cpuInfo.cores).toBeGreaterThan(0);
      expect(typeof cpuInfo.model).toBe('string');
      expect(Array.isArray(cpuInfo.loadAvg)).toBe(true);
    });
  });

  describe('Storage Info', () => {
    it('should return valid storage information', async () => {
      const { getStorageInfo } = await import('../src/systemMode');
      const storageInfo = getStorageInfo();
      
      expect(storageInfo).toHaveProperty('total');
      expect(storageInfo).toHaveProperty('used');
      expect(storageInfo).toHaveProperty('available');
      expect(storageInfo).toHaveProperty('limit');
      expect(storageInfo).toHaveProperty('dbSize');
      expect(storageInfo).toHaveProperty('dataDir');
      
      expect(typeof storageInfo.dataDir).toBe('string');
    });
  });

  describe('System Info', () => {
    it('should return comprehensive system information', async () => {
      const { getSystemInfo } = await import('../src/systemMode');
      const sysInfo = getSystemInfo();
      
      expect(sysInfo).toHaveProperty('mode');
      expect(sysInfo).toHaveProperty('canConfigure');
      expect(sysInfo).toHaveProperty('memory');
      expect(sysInfo).toHaveProperty('cpu');
      expect(sysInfo).toHaveProperty('storage');
      expect(sysInfo).toHaveProperty('uptime');
      expect(sysInfo).toHaveProperty('nodeVersion');
      expect(sysInfo).toHaveProperty('platform');
      expect(sysInfo).toHaveProperty('arch');
      expect(sysInfo).toHaveProperty('timestamp');
      
      expect(sysInfo.uptime).toBeGreaterThanOrEqual(0);
      expect(sysInfo.timestamp).toBeGreaterThan(0);
    });
  });

  describe('Format Bytes', () => {
    it('should format bytes correctly', async () => {
      const { formatBytes } = await import('../src/systemMode');
      
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatBytes(1536)).toBe('1.5 KB');
    });
  });

  describe('Feature Availability', () => {
    it('should mark local-only features as unavailable in online mode', async () => {
      process.env.ICEBERG_MODE = 'online';
      vi.resetModules();
      
      const { isFeatureAvailable } = await import('../src/systemMode');
      
      expect(isFeatureAvailable('system-config')).toBe(false);
      expect(isFeatureAvailable('data-export')).toBe(false);
      expect(isFeatureAvailable('posts')).toBe(true); // Not local-only
    });

    it('should mark all features as available in local mode', async () => {
      process.env.ICEBERG_MODE = 'local';
      vi.resetModules();
      
      const { isFeatureAvailable } = await import('../src/systemMode');
      
      expect(isFeatureAvailable('system-config')).toBe(true);
      expect(isFeatureAvailable('data-export')).toBe(true);
      expect(isFeatureAvailable('posts')).toBe(true);
    });
  });

  describe('Mode Summary', () => {
    it('should return a readable summary', async () => {
      const { getModeSummary } = await import('../src/systemMode');
      const summary = getModeSummary();
      
      expect(typeof summary).toBe('string');
      expect(summary).toContain('Mode:');
      expect(summary).toContain('RAM:');
      expect(summary).toContain('Storage:');
    });
  });
});
