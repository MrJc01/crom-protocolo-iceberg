/**
 * System Mode Tests
 * 
 * Tests for the system mode functionality including:
 * - Mode detection
 * - Route protection
 * - System metrics collection
 * - Configuration endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const DAEMON_URL = 'http://localhost:8420';

// Helper to make requests
async function request(path: string, options?: RequestInit) {
  const res = await fetch(`${DAEMON_URL}${path}`, options);
  return { status: res.status, data: await res.json() };
}

describe('System Mode', () => {
  describe('GET /system/mode', () => {
    it('should return current system mode', async () => {
      const { status, data } = await request('/system/mode');
      
      expect(status).toBe(200);
      expect(data).toHaveProperty('mode');
      expect(['local', 'online']).toContain(data.mode);
      expect(data).toHaveProperty('isLocal');
      expect(data).toHaveProperty('canConfigure');
      expect(typeof data.isLocal).toBe('boolean');
      expect(typeof data.canConfigure).toBe('boolean');
    });

    it('should have consistent mode values', async () => {
      const { data } = await request('/system/mode');
      
      if (data.mode === 'local') {
        expect(data.isLocal).toBe(true);
        expect(data.canConfigure).toBe(true);
      } else {
        expect(data.isLocal).toBe(false);
        expect(data.canConfigure).toBe(false);
      }
    });
  });

  describe('GET /system/info', () => {
    it('should return system information', async () => {
      const { status, data } = await request('/system/info');
      
      expect(status).toBe(200);
      expect(data).toHaveProperty('mode');
      expect(data).toHaveProperty('canConfigure');
      expect(data).toHaveProperty('memory');
      expect(data).toHaveProperty('cpu');
      expect(data).toHaveProperty('storage');
      expect(data).toHaveProperty('uptime');
    });

    it('should have valid memory info', async () => {
      const { data } = await request('/system/info');
      
      expect(data.memory).toHaveProperty('total');
      expect(data.memory).toHaveProperty('used');
      expect(data.memory).toHaveProperty('available');
      expect(data.memory).toHaveProperty('limit');
      expect(data.memory).toHaveProperty('percentage');
      expect(typeof data.memory.percentage).toBe('number');
      expect(data.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(data.memory.percentage).toBeLessThanOrEqual(100);
    });

    it('should have valid CPU info', async () => {
      const { data } = await request('/system/info');
      
      expect(data.cpu).toHaveProperty('cores');
      expect(data.cpu).toHaveProperty('usage');
      expect(typeof data.cpu.cores).toBe('number');
      expect(data.cpu.cores).toBeGreaterThan(0);
    });

    it('should have valid storage info', async () => {
      const { data } = await request('/system/info');
      
      expect(data.storage).toHaveProperty('total');
      expect(data.storage).toHaveProperty('used');
      expect(data.storage).toHaveProperty('limit');
      expect(data.storage).toHaveProperty('dbSize');
    });

    it('should have formatted values', async () => {
      const { data } = await request('/system/info');
      
      expect(data).toHaveProperty('formatted');
      expect(data.formatted).toHaveProperty('memory');
      expect(data.formatted).toHaveProperty('storage');
      expect(typeof data.formatted.memory.used).toBe('string');
    });

    it('should have data counts', async () => {
      const { data } = await request('/system/info');
      
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('posts');
      expect(data.data).toHaveProperty('comments');
      expect(data.data).toHaveProperty('votes');
    });
  });

  describe('GET /system/limits', () => {
    it('should return resource limits', async () => {
      const { status, data } = await request('/system/limits');
      
      expect(status).toBe(200);
      expect(data).toHaveProperty('mode');
      expect(data).toHaveProperty('limits');
      expect(data).toHaveProperty('canModify');
    });

    it('should have all limit properties', async () => {
      const { data } = await request('/system/limits');
      
      expect(data.limits).toHaveProperty('maxMemoryMB');
      expect(data.limits).toHaveProperty('maxStorageGB');
      expect(data.limits).toHaveProperty('maxPeers');
      expect(typeof data.limits.maxMemoryMB).toBe('number');
      expect(data.limits.maxMemoryMB).toBeGreaterThan(0);
    });
  });

  describe('GET /system/features', () => {
    it('should return available features', async () => {
      const { status, data } = await request('/system/features');
      
      expect(status).toBe(200);
      expect(data).toHaveProperty('mode');
      expect(data).toHaveProperty('features');
      expect(Array.isArray(data.features)).toBe(true);
    });

    it('should mark features with availability', async () => {
      const { data } = await request('/system/features');
      
      for (const feature of data.features) {
        expect(feature).toHaveProperty('id');
        expect(feature).toHaveProperty('name');
        expect(feature).toHaveProperty('localOnly');
        expect(feature).toHaveProperty('available');
      }
    });
  });

  describe('GET /health (enhanced)', () => {
    it('should include mode information', async () => {
      const { status, data } = await request('/health');
      
      expect(status).toBe(200);
      expect(data).toHaveProperty('mode');
      expect(data).toHaveProperty('isLocal');
      expect(data).toHaveProperty('canConfigure');
    });

    it('should include real memory metrics', async () => {
      const { data } = await request('/health');
      
      expect(data).toHaveProperty('memory');
      expect(data).toHaveProperty('memoryTotal');
      expect(data).toHaveProperty('memoryLimit');
      expect(data).toHaveProperty('memoryPercent');
    });

    it('should include CPU metrics', async () => {
      const { data } = await request('/health');
      
      expect(data).toHaveProperty('cpu');
      expect(data).toHaveProperty('cpuCores');
      expect(data.cpuCores).toBeGreaterThan(0);
    });
  });
});

describe('Route Protection', () => {
  describe('GET /system/config', () => {
    it('should respond based on mode', async () => {
      const { status, data } = await request('/system/config');
      
      // In online mode: 403, in local mode: 200
      if (status === 200) {
        // Local mode - should have config data
        expect(data).toHaveProperty('mode');
        expect(data.mode).toBe('local');
        expect(data).toHaveProperty('limits');
        expect(data).toHaveProperty('paths');
        expect(data).toHaveProperty('features');
      } else {
        // Online mode - should be forbidden
        expect(status).toBe(403);
        expect(data).toHaveProperty('error');
        expect(data.mode).toBe('online');
      }
    });
  });

  describe('PUT /system/config', () => {
    it('should only work in local mode', async () => {
      const { status, data } = await request('/system/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxMemoryMB: 1024 }),
      });
      
      if (status === 200) {
        // Local mode - should succeed
        expect(data).toHaveProperty('success');
        expect(data.success).toBe(true);
      } else {
        // Online mode - should be forbidden
        expect(status).toBe(403);
        expect(data).toHaveProperty('error');
      }
    });

    it('should validate input values', async () => {
      const modeResponse = await request('/system/mode');
      if (modeResponse.data.mode !== 'local') {
        // Skip this test in online mode
        return;
      }

      // Test invalid memory value
      const { status, data } = await request('/system/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxMemoryMB: -100 }),
      });
      
      expect(status).toBe(400);
      expect(data).toHaveProperty('error');
    });
  });

  describe('POST /system/export', () => {
    it('should only work in local mode', async () => {
      const { status, data } = await request('/system/export', {
        method: 'POST',
      });
      
      if (status === 200) {
        // Local mode - should return export data
        expect(data).toHaveProperty('success');
        expect(data.success).toBe(true);
        expect(data).toHaveProperty('data');
        expect(data.data).toHaveProperty('exportedAt');
        expect(data.data).toHaveProperty('posts');
      } else {
        // Online mode - should be forbidden
        expect(status).toBe(403);
      }
    });
  });
});

describe('System Metrics Accuracy', () => {
  it('should report consistent memory usage across endpoints', async () => {
    const healthResponse = await request('/health');
    const infoResponse = await request('/system/info');
    
    // Both should report similar memory usage
    expect(healthResponse.data.memoryPercent).toBe(infoResponse.data.memory.percentage);
  });

  it('should have uptime increasing', async () => {
    const first = await request('/system/info');
    await new Promise(resolve => setTimeout(resolve, 1100));
    const second = await request('/system/info');
    
    expect(second.data.uptime).toBeGreaterThanOrEqual(first.data.uptime);
  });

  it('should report valid CPU core count', async () => {
    const { data } = await request('/system/info');
    
    // Should have at least 1 CPU core
    expect(data.cpu.cores).toBeGreaterThanOrEqual(1);
    // And probably not more than 256
    expect(data.cpu.cores).toBeLessThanOrEqual(256);
  });
});
