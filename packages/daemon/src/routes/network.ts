/**
 * P2P Network API Routes
 * 
 * REST API for P2P network management
 */

import { Router, Request, Response } from "express";
import { Storage } from "../storage";
import { logger } from "../logger";
import { getLibp2pNode } from "../libp2p";
import { getIPFSStorage } from "../ipfs";
import { getNetworkSyncManager } from "../sync";

const router = Router();

// GET /network/status - Get full network status
router.get("/status", (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const syncManager = getNetworkSyncManager(storage);
    const status = syncManager.getNetworkStatus();

    res.json(status);
  } catch (error: any) {
    logger.error({ error: error.message }, "Network status failed");
    res.status(500).json({ error: error.message });
  }
});

// POST /network/start - Start P2P network
router.post("/start", async (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const syncManager = getNetworkSyncManager(storage);

    await syncManager.start();

    res.json({ 
      success: true, 
      message: "Network started",
      status: syncManager.getNetworkStatus(),
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Network start failed");
    res.status(500).json({ error: error.message });
  }
});

// POST /network/stop - Stop P2P network
router.post("/stop", async (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const syncManager = getNetworkSyncManager(storage);

    await syncManager.stop();

    res.json({ success: true, message: "Network stopped" });
  } catch (error: any) {
    logger.error({ error: error.message }, "Network stop failed");
    res.status(500).json({ error: error.message });
  }
});

// POST /network/sync - Trigger manual sync
router.post("/sync", async (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const syncManager = getNetworkSyncManager(storage);

    const result = await syncManager.syncNow();

    res.json({
      success: true,
      ...result,
      stats: syncManager.getStats(),
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Network sync failed");
    res.status(500).json({ error: error.message });
  }
});

// GET /network/peers - List connected peers
router.get("/peers", (req: Request, res: Response) => {
  try {
    const node = getLibp2pNode();
    const peers = node.getPeers();

    res.json({
      count: peers.length,
      peers: peers.map(p => ({
        id: p.id.slice(0, 16) + "...",
        lastSeen: p.lastSeen,
        reputation: p.reputation,
        region: p.region,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /network/dial - Connect to a peer
router.post("/dial", async (req: Request, res: Response) => {
  try {
    const { multiaddr } = req.body;

    if (!multiaddr) {
      return res.status(400).json({ error: "multiaddr is required" });
    }

    const node = getLibp2pNode();
    const peer = await node.dial(multiaddr);

    if (peer) {
      res.json({ 
        success: true, 
        peer: {
          id: peer.id,
          multiaddrs: peer.multiaddrs,
        },
      });
    } else {
      res.status(400).json({ error: "Failed to connect" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /network/ipfs/stats - IPFS storage stats
router.get("/ipfs/stats", (req: Request, res: Response) => {
  try {
    const ipfs = getIPFSStorage();
    res.json(ipfs.getStats());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /network/ipfs/add - Add content to IPFS
router.post("/ipfs/add", async (req: Request, res: Response) => {
  try {
    const { content, pin } = req.body;

    if (!content) {
      return res.status(400).json({ error: "content is required" });
    }

    const ipfs = getIPFSStorage();
    const cid = await ipfs.add(JSON.stringify(content), { pin });

    res.json({ cid, size: JSON.stringify(content).length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /network/ipfs/:cid - Get content from IPFS
router.get("/ipfs/:cid", async (req: Request, res: Response) => {
  try {
    const { cid } = req.params;
    const ipfs = getIPFSStorage();

    const content = await ipfs.getJSON(cid);

    if (content) {
      res.json(content);
    } else {
      res.status(404).json({ error: "Content not found" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /network/ipfs/:cid/pin - Pin content
router.post("/ipfs/:cid/pin", (req: Request, res: Response) => {
  try {
    const { cid } = req.params;
    const ipfs = getIPFSStorage();

    const success = ipfs.pin(cid);

    if (success) {
      res.json({ success: true, cid });
    } else {
      res.status(404).json({ error: "Content not found" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /network/ipfs/:cid/pin - Unpin content
router.delete("/ipfs/:cid/pin", (req: Request, res: Response) => {
  try {
    const { cid } = req.params;
    const ipfs = getIPFSStorage();

    const success = ipfs.unpin(cid);

    if (success) {
      res.json({ success: true, cid });
    } else {
      res.status(404).json({ error: "Content not found or not pinned" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const networkRouter = router;
export default networkRouter;
