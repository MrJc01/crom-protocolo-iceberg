/**
 * Storage Local - SQLite
 *
 * Armazenamento local de posts, votos e identidade.
 * Baseado na documentação: docs/02_ARQUITETURA_DO_SISTEMA.md
 */

import Database from "better-sqlite3";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";

const DEFAULT_DATA_DIR = path.join(os.homedir(), ".iceberg");

export interface Post {
  cid: string;
  title: string;
  body: string;
  author: string;
  region: string;
  category?: string;
  level: number;
  createdAt: number;
  updatedAt: number;
}

export interface Vote {
  id: string;
  postCid: string;
  voter: string;
  type: "up" | "down" | "report";
  weight: number;
  createdAt: number;
}

export interface Identity {
  publicKey: string;
  secretKey: string; // hex encoded
  createdAt: number;
}

export class Storage {
  private db: Database.Database;

  constructor(dataDir?: string) {
    const dir = dataDir || DEFAULT_DATA_DIR;

    // Criar diretório se não existir
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const dbPath = path.join(dir, "iceberg.db");
    this.db = new Database(dbPath);

    // Habilitar WAL mode para melhor performance
    this.db.pragma("journal_mode = WAL");

    // Criar tabelas
    this.initSchema();
  }

  private initSchema(): void {
    // Tabela de identidade (apenas uma identidade local)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS identity (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        publicKey TEXT NOT NULL,
        secretKey TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      )
    `);

    // Tabela de posts
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        cid TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        author TEXT NOT NULL,
        region TEXT NOT NULL,
        category TEXT,
        level INTEGER DEFAULT 0,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      )
    `);

    // Índices para posts
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_posts_region ON posts(region);
      CREATE INDEX IF NOT EXISTS idx_posts_level ON posts(level);
      CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author);
      CREATE INDEX IF NOT EXISTS idx_posts_createdAt ON posts(createdAt);
    `);

    // Tabela de votos
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS votes (
        id TEXT PRIMARY KEY,
        postCid TEXT NOT NULL,
        voter TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('up', 'down', 'report')),
        weight REAL DEFAULT 1.0,
        createdAt INTEGER NOT NULL,
        UNIQUE(postCid, voter)
      )
    `);

    // Índice para votos
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_votes_postCid ON votes(postCid);
    `);
  }

  // ==========================================
  // IDENTIDADE
  // ==========================================

  getIdentity(): Identity | null {
    const row = this.db
      .prepare("SELECT * FROM identity WHERE id = 1")
      .get() as any;
    return row || null;
  }

  saveIdentity(identity: Identity): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO identity (id, publicKey, secretKey, createdAt) 
         VALUES (1, ?, ?, ?)`
      )
      .run(identity.publicKey, identity.secretKey, identity.createdAt);
  }

  deleteIdentity(): void {
    this.db.prepare("DELETE FROM identity WHERE id = 1").run();
  }

  // ==========================================
  // POSTS
  // ==========================================

  createPost(post: Omit<Post, "updatedAt">): Post {
    const now = Date.now();
    const fullPost: Post = { ...post, updatedAt: now };

    this.db
      .prepare(
        `INSERT INTO posts (cid, title, body, author, region, category, level, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        fullPost.cid,
        fullPost.title,
        fullPost.body,
        fullPost.author,
        fullPost.region,
        fullPost.category || null,
        fullPost.level,
        fullPost.createdAt,
        fullPost.updatedAt
      );

    return fullPost;
  }

  getPost(cid: string): Post | null {
    const row = this.db
      .prepare("SELECT * FROM posts WHERE cid = ?")
      .get(cid) as any;
    return row || null;
  }

  listPosts(options: {
    region?: string;
    level?: number;
    author?: string;
    limit?: number;
    offset?: number;
  }): { posts: Post[]; total: number } {
    let whereClause = "1=1";
    const params: any[] = [];

    if (options.region) {
      whereClause += " AND region = ?";
      params.push(options.region);
    }

    if (options.level !== undefined) {
      whereClause += " AND level >= ?";
      params.push(options.level);
    }

    if (options.author) {
      whereClause += " AND author = ?";
      params.push(options.author);
    }

    // Contar total
    const total = (
      this.db
        .prepare(`SELECT COUNT(*) as count FROM posts WHERE ${whereClause}`)
        .get(...params) as any
    ).count;

    // Buscar com paginação
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const posts = this.db
      .prepare(
        `SELECT * FROM posts WHERE ${whereClause} 
         ORDER BY createdAt DESC 
         LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset) as Post[];

    return { posts, total };
  }

  updatePostLevel(cid: string, level: number): void {
    this.db
      .prepare("UPDATE posts SET level = ?, updatedAt = ? WHERE cid = ?")
      .run(level, Date.now(), cid);
  }

  deletePost(cid: string): void {
    this.db.prepare("DELETE FROM posts WHERE cid = ?").run(cid);
  }

  // ==========================================
  // VOTOS
  // ==========================================

  castVote(vote: Vote): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO votes (id, postCid, voter, type, weight, createdAt)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(vote.id, vote.postCid, vote.voter, vote.type, vote.weight, vote.createdAt);
  }

  getVote(postCid: string, voter: string): Vote | null {
    const row = this.db
      .prepare("SELECT * FROM votes WHERE postCid = ? AND voter = ?")
      .get(postCid, voter) as any;
    return row || null;
  }

  getVoteCounts(postCid: string): { up: number; down: number; reports: number; score: number } {
    const rows = this.db
      .prepare(
        `SELECT type, SUM(weight) as total FROM votes 
         WHERE postCid = ? GROUP BY type`
      )
      .all(postCid) as any[];

    const counts = { up: 0, down: 0, reports: 0, score: 0 };

    for (const row of rows) {
      if (row.type === "up") counts.up = row.total;
      else if (row.type === "down") counts.down = row.total;
      else if (row.type === "report") counts.reports = row.total;
    }

    counts.score = counts.up - counts.down;
    return counts;
  }

  // ==========================================
  // UTILITÁRIOS
  // ==========================================

  close(): void {
    this.db.close();
  }
}
