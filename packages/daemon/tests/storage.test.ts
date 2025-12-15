/**
 * Storage Unit Tests
 * 
 * Run with: npx tsx tests/storage.test.ts
 */

import { Storage, Post, Vote, Comment, Report, ChatMessage } from "../src/storage";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Test directory
const TEST_DIR = path.join(os.tmpdir(), "iceberg-test-" + Date.now());

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    testsPassed++;
    console.log(`✅ ${message}`);
  } else {
    testsFailed++;
    console.log(`❌ ${message}`);
  }
}

function assertEq(actual: any, expected: any, message: string) {
  const equal = JSON.stringify(actual) === JSON.stringify(expected);
  assert(equal, `${message} (expected ${expected}, got ${actual})`);
}

// Cleanup
function cleanup() {
  try {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  } catch (e) {
    // Ignore
  }
}

// ==========================================
// TESTS
// ==========================================

async function runTests() {
  console.log("\n🧪 STORAGE UNIT TESTS\n" + "=".repeat(50) + "\n");

  // Setup
  cleanup();
  const storage = new Storage(TEST_DIR);

  // IDENTITY TESTS
  console.log("\n📝 Identity Tests");
  
  assert(storage.getIdentity() === null, "Initial identity is null");
  
  const testIdentity = {
    publicKey: "ed25519_test_pubkey_123",
    secretKey: "secret_key_hex",
    createdAt: Date.now(),
  };
  storage.saveIdentity(testIdentity);
  
  const savedIdentity = storage.getIdentity();
  assertEq(savedIdentity?.publicKey, testIdentity.publicKey, "Identity publicKey matches");
  
  storage.deleteIdentity();
  assert(storage.getIdentity() === null, "Identity deleted successfully");
  
  // Restore for other tests
  storage.saveIdentity(testIdentity);

  // POST TESTS
  console.log("\n📝 Post Tests");
  
  const testPost = {
    cid: "post_cid_123",
    title: "Test Post Title",
    body: "Test post body content",
    author: testIdentity.publicKey,
    region: "BR-SP-SAO_PAULO",
    level: 0,
    createdAt: Date.now(),
  };
  
  const createdPost = storage.createPost(testPost);
  assert(createdPost.cid === testPost.cid, "Post created with correct CID");
  assert(createdPost.updatedAt > 0, "Post has updatedAt timestamp");
  
  const retrievedPost = storage.getPost(testPost.cid);
  assert(retrievedPost !== null, "Post can be retrieved");
  assertEq(retrievedPost?.title, testPost.title, "Post title matches");
  
  const { posts, total } = storage.listPosts({});
  assert(total === 1, "Total posts is 1");
  assert(posts.length === 1, "Posts array has 1 item");
  
  storage.updatePostLevel(testPost.cid, 1);
  const updatedPost = storage.getPost(testPost.cid);
  assertEq(updatedPost?.level, 1, "Post level updated to 1");
  
  // Filter tests
  const { posts: filtered } = storage.listPosts({ region: "BR-SP-SAO_PAULO" });
  assert(filtered.length === 1, "Region filter works");
  
  const { posts: noMatch } = storage.listPosts({ region: "BR-RJ-RIO" });
  assert(noMatch.length === 0, "Region filter excludes non-matching");

  // VOTE TESTS
  console.log("\n📝 Vote Tests");
  
  const testVote: Vote = {
    id: "vote_123",
    postCid: testPost.cid,
    voter: testIdentity.publicKey,
    type: "up",
    weight: 1.0,
    createdAt: Date.now(),
  };
  
  storage.castVote(testVote);
  const retrievedVote = storage.getVote(testPost.cid, testIdentity.publicKey);
  assert(retrievedVote !== null, "Vote can be retrieved");
  assertEq(retrievedVote?.type, "up", "Vote type is correct");
  
  const counts = storage.getVoteCounts(testPost.cid);
  assertEq(counts.up, 1, "Upvote count is 1");
  assertEq(counts.down, 0, "Downvote count is 0");
  assertEq(counts.score, 1, "Score is 1");

  // COMMENT TESTS
  console.log("\n📝 Comment Tests");
  
  const testComment: Comment = {
    cid: "comment_123",
    postCid: testPost.cid,
    parentCid: null,
    body: "Test comment body",
    author: testIdentity.publicKey,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  storage.createComment(testComment);
  const retrievedComment = storage.getComment(testComment.cid);
  assert(retrievedComment !== null, "Comment can be retrieved");
  assertEq(retrievedComment?.body, testComment.body, "Comment body matches");
  
  const comments = storage.listComments(testPost.cid);
  assert(comments.length === 1, "List comments returns 1");
  
  const commentCount = storage.countComments(testPost.cid);
  assertEq(commentCount, 1, "Comment count is 1");
  
  // Reply test
  const reply: Comment = {
    cid: "reply_123",
    postCid: testPost.cid,
    parentCid: testComment.cid,
    body: "Reply to comment",
    author: testIdentity.publicKey,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  storage.createComment(reply);
  
  const replies = storage.getCommentReplies(testComment.cid);
  assert(replies.length === 1, "Reply found");

  // REPORT TESTS
  console.log("\n📝 Report Tests");
  
  const testReport: Report = {
    id: "report_123",
    targetCid: testPost.cid,
    targetType: "post",
    reporter: testIdentity.publicKey,
    reason: "spam",
    status: "pending",
    createdAt: Date.now(),
    resolvedAt: null,
  };
  
  storage.createReport(testReport);
  const retrievedReport = storage.getReport(testReport.id);
  assert(retrievedReport !== null, "Report can be retrieved");
  
  const { reports } = storage.listReports({ status: "pending" });
  assert(reports.length === 1, "Pending reports = 1");
  
  storage.updateReportStatus(testReport.id, "resolved");
  const resolvedReport = storage.getReport(testReport.id);
  assertEq(resolvedReport?.status, "resolved", "Report status updated");
  assert(resolvedReport?.resolvedAt !== null, "Report has resolvedAt");

  // CHAT TESTS
  console.log("\n📝 Chat Tests");
  
  const testMessage: ChatMessage = {
    id: "msg_123",
    fromPubKey: testIdentity.publicKey,
    toPubKey: "other_user_pubkey",
    content: "Hello!",
    createdAt: Date.now(),
    read: false,
  };
  
  storage.saveMessage(testMessage);
  const conversation = storage.getConversation(testIdentity.publicKey, "other_user_pubkey", 10);
  assert(conversation.length === 1, "Message in conversation");
  
  const conversations = storage.getConversations(testIdentity.publicKey);
  assert(conversations.length === 1, "1 conversation found");

  // CLEANUP
  console.log("\n📝 Cleanup");
  storage.deleteComment(reply.cid);
  storage.deleteComment(testComment.cid);
  storage.deletePost(testPost.cid);
  
  assert(storage.getPost(testPost.cid) === null, "Post deleted");
  assert(storage.getComment(testComment.cid) === null, "Comment deleted");
  
  storage.close();
  cleanup();

  // SUMMARY
  console.log("\n" + "=".repeat(50));
  console.log(`\n📊 RESULTS: ${testsPassed} passed, ${testsFailed} failed`);
  
  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests().catch(console.error);
