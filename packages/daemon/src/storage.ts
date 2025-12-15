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

export interface Comment {
  cid: string;
  postCid: string;
  parentCid: string | null; // null if top-level, CID of parent comment if reply
  body: string;
  author: string;
  createdAt: number;
  updatedAt: number;
}

export interface Report {
  id: string;
  targetCid: string; // Post or Comment CID
  targetType: 'post' | 'comment';
  reporter: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: number;
  resolvedAt: number | null;
}

export interface ChatMessage {
  id: string;
  fromPubKey: string;
  toPubKey: string;
  content: string; // encrypted
  createdAt: number;
  read: boolean;
}

export interface Identity {
  publicKey: string;
  secretKey: string; // hex encoded
  createdAt: number;
  btcAddress?: string; // Bitcoin address for bounties
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

    // Tabela de comentários
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS comments (
        cid TEXT PRIMARY KEY,
        postCid TEXT NOT NULL,
        parentCid TEXT,
        body TEXT NOT NULL,
        author TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      )
    `);

    // Índices para comentários
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_comments_postCid ON comments(postCid);
      CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author);
      CREATE INDEX IF NOT EXISTS idx_comments_parentCid ON comments(parentCid);
    `);

    // Tabela de denúncias/reports
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        targetCid TEXT NOT NULL,
        targetType TEXT NOT NULL CHECK(targetType IN ('post', 'comment')),
        reporter TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'resolved', 'dismissed')),
        createdAt INTEGER NOT NULL,
        resolvedAt INTEGER,
        UNIQUE(targetCid, reporter)
      )
    `);

    // Índice para reports
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
      CREATE INDEX IF NOT EXISTS idx_reports_targetCid ON reports(targetCid);
    `);

    // Tabela de mensagens de chat P2P
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        fromPubKey TEXT NOT NULL,
        toPubKey TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        read INTEGER DEFAULT 0
      )
    `);

    // Índices para chat
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_chat_from ON chat_messages(fromPubKey);
      CREATE INDEX IF NOT EXISTS idx_chat_to ON chat_messages(toPubKey);
      CREATE INDEX IF NOT EXISTS idx_chat_createdAt ON chat_messages(createdAt);
    `);

    // Adicionar coluna btcAddress à identity se não existir
    try {
      this.db.exec(`ALTER TABLE identity ADD COLUMN btcAddress TEXT`);
    } catch (e) {
      // Coluna já existe, ignorar
    }

    // Adicionar campos de agendamento aos posts se não existirem
    try {
      this.db.exec(`ALTER TABLE posts ADD COLUMN scheduledAt INTEGER`);
      this.db.exec(`ALTER TABLE posts ADD COLUMN autoArchiveAfterDays INTEGER`);
      this.db.exec(`ALTER TABLE posts ADD COLUMN isVisible INTEGER DEFAULT 1`);
      this.db.exec(`ALTER TABLE posts ADD COLUMN btcBounty TEXT`);
    } catch (e) {
      // Colunas já existem, ignorar
    }

    // Tabela de hashtags
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS hashtags (
        tag TEXT PRIMARY KEY,
        postCount INTEGER DEFAULT 0,
        createdAt INTEGER NOT NULL
      )
    `);

    // Tabela de relacionamento post-hashtag
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS post_hashtags (
        postCid TEXT NOT NULL,
        tag TEXT NOT NULL,
        PRIMARY KEY (postCid, tag)
      )
    `);

    // Índice para hashtags
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_post_hashtags_tag ON post_hashtags(tag);
    `);

    // Tabela de posts salvos
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS saved_posts (
        identity TEXT NOT NULL,
        postCid TEXT NOT NULL,
        savedAt INTEGER NOT NULL,
        PRIMARY KEY (identity, postCid)
      )
    `);

    // Índice para posts salvos
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_saved_posts_identity ON saved_posts(identity);
    `);

    // Tabela de posts agendados
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS scheduled_posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        region TEXT NOT NULL,
        category TEXT,
        author TEXT NOT NULL,
        publishAt INTEGER NOT NULL,
        endPostAfterDays INTEGER,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'published', 'cancelled')),
        createdAt INTEGER NOT NULL
      )
    `);

    // Índice para posts agendados
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
      CREATE INDEX IF NOT EXISTS idx_scheduled_posts_publishAt ON scheduled_posts(publishAt);
    `);

    // Tabela de votos em comentários
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS comment_votes (
        id TEXT PRIMARY KEY,
        commentCid TEXT NOT NULL,
        voter TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('up', 'down')),
        weight REAL DEFAULT 1.0,
        createdAt INTEGER NOT NULL,
        UNIQUE(commentCid, voter)
      )
    `);

    // Índice para votos em comentários
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_comment_votes_commentCid ON comment_votes(commentCid);
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
  // COMENTÁRIOS
  // ==========================================

  createComment(comment: Comment): Comment {
    this.db
      .prepare(
        `INSERT INTO comments (cid, postCid, parentCid, body, author, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        comment.cid,
        comment.postCid,
        comment.parentCid,
        comment.body,
        comment.author,
        comment.createdAt,
        comment.updatedAt
      );
    return comment;
  }

  getComment(cid: string): Comment | null {
    const row = this.db
      .prepare("SELECT * FROM comments WHERE cid = ?")
      .get(cid) as any;
    return row || null;
  }

  listComments(postCid: string): Comment[] {
    return this.db
      .prepare("SELECT * FROM comments WHERE postCid = ? ORDER BY createdAt ASC")
      .all(postCid) as Comment[];
  }

  getCommentReplies(parentCid: string): Comment[] {
    return this.db
      .prepare("SELECT * FROM comments WHERE parentCid = ? ORDER BY createdAt ASC")
      .all(parentCid) as Comment[];
  }

  deleteComment(cid: string): void {
    this.db.prepare("DELETE FROM comments WHERE cid = ?").run(cid);
  }

  countComments(postCid: string): number {
    const result = this.db
      .prepare("SELECT COUNT(*) as count FROM comments WHERE postCid = ?")
      .get(postCid) as any;
    return result.count;
  }

  // Get all comments by a specific user
  getUserComments(author: string, limit = 50, offset = 0): { comments: Comment[]; total: number } {
    const total = (
      this.db
        .prepare("SELECT COUNT(*) as count FROM comments WHERE author = ?")
        .get(author) as any
    ).count;

    const comments = this.db
      .prepare(`
        SELECT c.*, p.title as postTitle FROM comments c
        LEFT JOIN posts p ON c.postCid = p.cid
        WHERE c.author = ?
        ORDER BY c.createdAt DESC
        LIMIT ? OFFSET ?
      `)
      .all(author, limit, offset) as any[];

    return { comments, total };
  }

  // Get all votes by a specific user
  getUserVotes(voter: string, limit = 50, offset = 0): { votes: any[]; total: number } {
    const total = (
      this.db
        .prepare("SELECT COUNT(*) as count FROM votes WHERE voter = ?")
        .get(voter) as any
    ).count;

    const votes = this.db
      .prepare(`
        SELECT v.*, p.title as postTitle FROM votes v
        LEFT JOIN posts p ON v.postCid = p.cid
        WHERE v.voter = ?
        ORDER BY v.createdAt DESC
        LIMIT ? OFFSET ?
      `)
      .all(voter, limit, offset) as any[];

    return { votes, total };
  }

  // ==========================================
  // DENÚNCIAS/REPORTS
  // ==========================================

  createReport(report: Report): Report {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO reports (id, targetCid, targetType, reporter, reason, status, createdAt, resolvedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        report.id,
        report.targetCid,
        report.targetType,
        report.reporter,
        report.reason,
        report.status,
        report.createdAt,
        report.resolvedAt
      );
    return report;
  }

  getReport(id: string): Report | null {
    const row = this.db
      .prepare("SELECT * FROM reports WHERE id = ?")
      .get(id) as any;
    return row || null;
  }

  listReports(options: { status?: string; limit?: number; offset?: number }): { reports: Report[]; total: number } {
    let whereClause = "1=1";
    const params: any[] = [];

    if (options.status) {
      whereClause += " AND status = ?";
      params.push(options.status);
    }

    const total = (
      this.db
        .prepare(`SELECT COUNT(*) as count FROM reports WHERE ${whereClause}`)
        .get(...params) as any
    ).count;

    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const reports = this.db
      .prepare(
        `SELECT * FROM reports WHERE ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset) as Report[];

    return { reports, total };
  }

  updateReportStatus(id: string, status: string): void {
    const resolvedAt = status !== 'pending' ? Date.now() : null;
    this.db
      .prepare("UPDATE reports SET status = ?, resolvedAt = ? WHERE id = ?")
      .run(status, resolvedAt, id);
  }

  getReportsByTarget(targetCid: string): Report[] {
    return this.db
      .prepare("SELECT * FROM reports WHERE targetCid = ?")
      .all(targetCid) as Report[];
  }

  // ==========================================
  // CHAT P2P
  // ==========================================

  saveMessage(message: ChatMessage): ChatMessage {
    this.db
      .prepare(
        `INSERT INTO chat_messages (id, fromPubKey, toPubKey, content, createdAt, read)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        message.id,
        message.fromPubKey,
        message.toPubKey,
        message.content,
        message.createdAt,
        message.read ? 1 : 0
      );
    return message;
  }

  getConversation(myPubKey: string, otherPubKey: string, limit = 100): ChatMessage[] {
    return this.db
      .prepare(
        `SELECT * FROM chat_messages 
         WHERE (fromPubKey = ? AND toPubKey = ?) OR (fromPubKey = ? AND toPubKey = ?)
         ORDER BY createdAt DESC LIMIT ?`
      )
      .all(myPubKey, otherPubKey, otherPubKey, myPubKey, limit) as ChatMessage[];
  }

  getConversations(myPubKey: string): { peer: string; lastMessage: ChatMessage; unread: number }[] {
    // Get unique peers
    const peers = this.db
      .prepare(
        `SELECT DISTINCT 
          CASE WHEN fromPubKey = ? THEN toPubKey ELSE fromPubKey END as peer
         FROM chat_messages
         WHERE fromPubKey = ? OR toPubKey = ?`
      )
      .all(myPubKey, myPubKey, myPubKey) as { peer: string }[];

    return peers.map(({ peer }) => {
      const lastMessage = this.db
        .prepare(
          `SELECT * FROM chat_messages 
           WHERE (fromPubKey = ? AND toPubKey = ?) OR (fromPubKey = ? AND toPubKey = ?)
           ORDER BY createdAt DESC LIMIT 1`
        )
        .get(myPubKey, peer, peer, myPubKey) as ChatMessage;

      const unreadResult = this.db
        .prepare(
          `SELECT COUNT(*) as count FROM chat_messages 
           WHERE fromPubKey = ? AND toPubKey = ? AND read = 0`
        )
        .get(peer, myPubKey) as { count: number };

      return { peer, lastMessage, unread: unreadResult.count };
    });
  }

  markMessagesAsRead(myPubKey: string, fromPubKey: string): void {
    this.db
      .prepare("UPDATE chat_messages SET read = 1 WHERE toPubKey = ? AND fromPubKey = ?")
      .run(myPubKey, fromPubKey);
  }

  // ==========================================
  // BITCOIN
  // ==========================================

  setBtcAddress(publicKey: string, btcAddress: string): void {
    this.db
      .prepare("UPDATE identity SET btcAddress = ? WHERE publicKey = ?")
      .run(btcAddress, publicKey);
  }

  // ==========================================
  // HASHTAGS
  // ==========================================

  extractAndSaveHashtags(postCid: string, body: string): string[] {
    const regex = /#(\w+)/g;
    const matches = body.match(regex) || [];
    const tags = [...new Set(matches.map(m => m.slice(1).toLowerCase()))];
    
    const now = Date.now();
    
    for (const tag of tags) {
      // Insert or update hashtag count
      this.db
        .prepare(`
          INSERT INTO hashtags (tag, postCount, createdAt) 
          VALUES (?, 1, ?)
          ON CONFLICT(tag) DO UPDATE SET postCount = postCount + 1
        `)
        .run(tag, now);
      
      // Link post to hashtag
      this.db
        .prepare(`INSERT OR IGNORE INTO post_hashtags (postCid, tag) VALUES (?, ?)`)
        .run(postCid, tag);
    }
    
    return tags;
  }

  getPostsByHashtag(tag: string, limit = 50, offset = 0): { posts: Post[]; total: number } {
    const normalizedTag = tag.toLowerCase();
    
    const total = (
      this.db
        .prepare(`SELECT COUNT(*) as count FROM post_hashtags WHERE tag = ?`)
        .get(normalizedTag) as any
    ).count;
    
    const posts = this.db
      .prepare(`
        SELECT p.* FROM posts p
        INNER JOIN post_hashtags ph ON p.cid = ph.postCid
        WHERE ph.tag = ?
        ORDER BY p.createdAt DESC
        LIMIT ? OFFSET ?
      `)
      .all(normalizedTag, limit, offset) as Post[];
    
    return { posts, total };
  }

  getTrendingHashtags(limit = 10): { tag: string; postCount: number }[] {
    return this.db
      .prepare(`SELECT tag, postCount FROM hashtags ORDER BY postCount DESC LIMIT ?`)
      .all(limit) as { tag: string; postCount: number }[];
  }

  getHashtagsForPost(postCid: string): string[] {
    const rows = this.db
      .prepare(`SELECT tag FROM post_hashtags WHERE postCid = ?`)
      .all(postCid) as { tag: string }[];
    return rows.map(r => r.tag);
  }

  // ==========================================
  // SAVED POSTS
  // ==========================================

  savePost(identity: string, postCid: string): void {
    this.db
      .prepare(`INSERT OR REPLACE INTO saved_posts (identity, postCid, savedAt) VALUES (?, ?, ?)`)
      .run(identity, postCid, Date.now());
  }

  unsavePost(identity: string, postCid: string): void {
    this.db
      .prepare(`DELETE FROM saved_posts WHERE identity = ? AND postCid = ?`)
      .run(identity, postCid);
  }

  isPostSaved(identity: string, postCid: string): boolean {
    const row = this.db
      .prepare(`SELECT 1 FROM saved_posts WHERE identity = ? AND postCid = ?`)
      .get(identity, postCid);
    return !!row;
  }

  getSavedPosts(identity: string, limit = 50, offset = 0): { posts: Post[]; total: number } {
    const total = (
      this.db
        .prepare(`SELECT COUNT(*) as count FROM saved_posts WHERE identity = ?`)
        .get(identity) as any
    ).count;
    
    const posts = this.db
      .prepare(`
        SELECT p.* FROM posts p
        INNER JOIN saved_posts sp ON p.cid = sp.postCid
        WHERE sp.identity = ?
        ORDER BY sp.savedAt DESC
        LIMIT ? OFFSET ?
      `)
      .all(identity, limit, offset) as Post[];
    
    return { posts, total };
  }

  // ==========================================
  // SCHEDULED POSTS
  // ==========================================

  createScheduledPost(post: {
    id: string;
    title: string;
    body: string;
    region: string;
    category?: string;
    author: string;
    publishAt: number;
    endPostAfterDays?: number;
  }): void {
    this.db
      .prepare(`
        INSERT INTO scheduled_posts (id, title, body, region, category, author, publishAt, endPostAfterDays, status, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
      `)
      .run(
        post.id,
        post.title,
        post.body,
        post.region,
        post.category || null,
        post.author,
        post.publishAt,
        post.endPostAfterDays || null,
        Date.now()
      );
  }

  getScheduledPosts(author: string): any[] {
    return this.db
      .prepare(`SELECT * FROM scheduled_posts WHERE author = ? AND status = 'pending' ORDER BY publishAt ASC`)
      .all(author);
  }

  getReadyToPublishPosts(): any[] {
    const now = Date.now();
    return this.db
      .prepare(`SELECT * FROM scheduled_posts WHERE status = 'pending' AND publishAt <= ?`)
      .all(now);
  }

  updateScheduledPostStatus(id: string, status: 'pending' | 'published' | 'cancelled'): void {
    this.db
      .prepare(`UPDATE scheduled_posts SET status = ? WHERE id = ?`)
      .run(status, id);
  }

  deleteScheduledPost(id: string): void {
    this.db
      .prepare(`DELETE FROM scheduled_posts WHERE id = ?`)
      .run(id);
  }

  // ==========================================
  // COMMENT VOTES
  // ==========================================

  castCommentVote(vote: { id: string; commentCid: string; voter: string; type: 'up' | 'down'; weight?: number }): void {
    this.db
      .prepare(`
        INSERT OR REPLACE INTO comment_votes (id, commentCid, voter, type, weight, createdAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(vote.id, vote.commentCid, vote.voter, vote.type, vote.weight || 1, Date.now());
  }

  getCommentVote(commentCid: string, voter: string): { type: 'up' | 'down' } | null {
    const row = this.db
      .prepare(`SELECT type FROM comment_votes WHERE commentCid = ? AND voter = ?`)
      .get(commentCid, voter) as any;
    return row || null;
  }

  getCommentVoteCounts(commentCid: string): { up: number; down: number; score: number } {
    const rows = this.db
      .prepare(`SELECT type, SUM(weight) as total FROM comment_votes WHERE commentCid = ? GROUP BY type`)
      .all(commentCid) as any[];
    
    const counts = { up: 0, down: 0, score: 0 };
    
    for (const row of rows) {
      if (row.type === 'up') counts.up = row.total;
      else if (row.type === 'down') counts.down = row.total;
    }
    
    counts.score = counts.up - counts.down;
    return counts;
  }

  // ==========================================
  // SNAPSHOTS (Background Tasks)
  // ==========================================

  // Create snapshots table if not exists
  private ensureSnapshotTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS moderation_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        postsChecked INTEGER NOT NULL,
        postsFlagged INTEGER NOT NULL,
        postsHidden INTEGER NOT NULL
      )
    `);
    
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS metrics_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        totalPosts INTEGER NOT NULL,
        totalVotesUp INTEGER NOT NULL,
        totalVotesDown INTEGER NOT NULL,
        totalReports INTEGER NOT NULL,
        totalComments INTEGER NOT NULL,
        totalSavedPosts INTEGER NOT NULL
      )
    `);
  }

  createModerationSnapshot(snapshot: {
    timestamp: number;
    postsChecked: number;
    postsFlagged: number;
    postsHidden: number;
  }): void {
    this.ensureSnapshotTables();
    this.db
      .prepare(`INSERT INTO moderation_snapshots (timestamp, postsChecked, postsFlagged, postsHidden) VALUES (?, ?, ?, ?)`)
      .run(snapshot.timestamp, snapshot.postsChecked, snapshot.postsFlagged, snapshot.postsHidden);
  }

  createMetricsSnapshot(snapshot: {
    timestamp: number;
    totalPosts: number;
    totalVotesUp: number;
    totalVotesDown: number;
    totalReports: number;
    totalComments: number;
    totalSavedPosts: number;
  }): void {
    this.ensureSnapshotTables();
    this.db
      .prepare(`INSERT INTO metrics_snapshots (timestamp, totalPosts, totalVotesUp, totalVotesDown, totalReports, totalComments, totalSavedPosts) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(snapshot.timestamp, snapshot.totalPosts, snapshot.totalVotesUp, snapshot.totalVotesDown, snapshot.totalReports, snapshot.totalComments, snapshot.totalSavedPosts);
  }

  getLatestMetricsSnapshot(): any | null {
    this.ensureSnapshotTables();
    return this.db
      .prepare(`SELECT * FROM metrics_snapshots ORDER BY timestamp DESC LIMIT 1`)
      .get() || null;
  }

  getTotalSavedPosts(): number {
    const result = this.db
      .prepare(`SELECT COUNT(*) as count FROM saved_posts`)
      .get() as any;
    return result.count || 0;
  }

  // ==========================================
  // UTILITÁRIOS
  // ==========================================

  close(): void {
    this.db.close();
  }
}
