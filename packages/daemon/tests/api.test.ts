/**
 * Iceberg Daemon API Test Suite
 * 
 * Run with: npx tsx tests/api.test.ts
 */

const BASE_URL = "http://localhost:8420";

interface TestResult {
  name: string;
  passed: boolean;
  time: number;
  error?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, passed: true, time: Date.now() - start });
    console.log(`✅ ${name} (${Date.now() - start}ms)`);
  } catch (error: any) {
    results.push({ name, passed: false, time: Date.now() - start, error: error.message });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

async function api(method: string, path: string, body?: any) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
}

// ==========================================
// TESTS
// ==========================================

async function runTests() {
  console.log("\n🧪 ICEBERG DAEMON API TESTS\n" + "=".repeat(50) + "\n");

  // 1. Health Check
  await test("GET /health - Returns OK", async () => {
    const { status, data } = await api("GET", "/health");
    if (status !== 200) throw new Error(`Status ${status}`);
    if (data.status !== "ok") throw new Error("Status not ok");
  });

  // 2. Identity - Get or Create
  await test("GET /identity - Returns identity or 404", async () => {
    const { status, data } = await api("GET", "/identity");
    if (status !== 200 && status !== 404) throw new Error(`Unexpected status ${status}`);
  });

  await test("POST /identity - Creates identity", async () => {
    const { status, data } = await api("POST", "/identity", { force: false });
    if (status !== 200 && status !== 201) throw new Error(`Status ${status}`);
    if (!data.publicKey) throw new Error("No publicKey returned");
  });

  // 3. Posts
  await test("GET /posts - Returns post list", async () => {
    const { status, data } = await api("GET", "/posts");
    if (status !== 200) throw new Error(`Status ${status}`);
    if (!Array.isArray(data.posts)) throw new Error("Posts not array");
  });

  await test("GET /posts?limit=5 - Respects limit param", async () => {
    const { status, data } = await api("GET", "/posts?limit=5");
    if (status !== 200) throw new Error(`Status ${status}`);
    if (data.posts.length > 5) throw new Error("Limit not respected");
  });

  // Create a test post
  let testPostCid = "";
  await test("POST /posts - Creates new post", async () => {
    const { status, data } = await api("POST", "/posts", {
      title: "Test Post " + Date.now(),
      body: "This is a test post body for automated testing.",
      region: "BR-SP-SAO_PAULO",
    });
    if (status !== 201) throw new Error(`Status ${status}`);
    if (!data.cid) throw new Error("No CID returned");
    testPostCid = data.cid;
  });

  await test("GET /posts/:cid - Returns specific post", async () => {
    if (!testPostCid) throw new Error("No test post CID");
    const { status, data } = await api("GET", `/posts/${testPostCid}`);
    if (status !== 200) throw new Error(`Status ${status}`);
    if (data.cid !== testPostCid) throw new Error("Wrong post returned");
  });

  // 4. Votes
  await test("GET /votes/:cid - Returns vote counts", async () => {
    if (!testPostCid) throw new Error("No test post CID");
    const { status, data } = await api("GET", `/votes/${testPostCid}`);
    if (status !== 200) throw new Error(`Status ${status}`);
    if (typeof data.up !== "number") throw new Error("Invalid vote format");
  });

  await test("POST /votes/:cid - Casts upvote", async () => {
    if (!testPostCid) throw new Error("No test post CID");
    const { status, data } = await api("POST", `/votes/${testPostCid}`, { type: "up" });
    if (status !== 200 && status !== 201) throw new Error(`Status ${status}`);
  });

  // 5. Comments
  await test("GET /posts/:cid/comments - Returns comments", async () => {
    if (!testPostCid) throw new Error("No test post CID");
    const { status, data } = await api("GET", `/posts/${testPostCid}/comments`);
    if (status !== 200) throw new Error(`Status ${status}`);
    if (!Array.isArray(data.comments)) throw new Error("Comments not array");
  });

  let testCommentCid = "";
  await test("POST /posts/:cid/comments - Creates comment", async () => {
    if (!testPostCid) throw new Error("No test post CID");
    const { status, data } = await api("POST", `/posts/${testPostCid}/comments`, {
      body: "Test comment " + Date.now(),
    });
    if (status !== 201) throw new Error(`Status ${status}`);
    if (!data.cid) throw new Error("No comment CID");
    testCommentCid = data.cid;
  });

  // 6. Reports
  await test("POST /reports - Creates report", async () => {
    if (!testPostCid) throw new Error("No test post CID");
    const { status, data } = await api("POST", "/reports", {
      targetCid: testPostCid,
      targetType: "post",
      reason: "spam",
    });
    if (status !== 201) throw new Error(`Status ${status}`);
    if (!data.id) throw new Error("No report ID");
  });

  await test("GET /reports - Returns reports list", async () => {
    const { status, data } = await api("GET", "/reports");
    if (status !== 200) throw new Error(`Status ${status}`);
    if (!Array.isArray(data.reports)) throw new Error("Reports not array");
  });

  // 7. Chat
  await test("GET /chat/conversations - Returns conversations", async () => {
    const { status, data } = await api("GET", "/chat/conversations");
    if (status !== 200) throw new Error(`Status ${status}`);
    if (!Array.isArray(data.conversations)) throw new Error("Conversations not array");
  });

  // 8. Post Edit (if level < 2)
  await test("PUT /posts/:cid - Updates post", async () => {
    if (!testPostCid) throw new Error("No test post CID");
    const { status, data } = await api("PUT", `/posts/${testPostCid}`, {
      title: "Updated Test Post " + Date.now(),
    });
    // May fail if not owner
    if (status !== 200 && status !== 403) throw new Error(`Status ${status}`);
  });

  // Cleanup - delete test post (if owner)
  await test("DELETE /posts/:cid - Deletes post", async () => {
    if (!testPostCid) throw new Error("No test post CID");
    const { status } = await api("DELETE", `/posts/${testPostCid}`);
    // May fail if level >= 3
    if (status !== 200 && status !== 403) throw new Error(`Status ${status}`);
  });

  // Summary
  console.log("\n" + "=".repeat(50));
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`\n📊 RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`⏱️  Total time: ${results.reduce((a, b) => a + b.time, 0)}ms`);

  if (failed > 0) {
    console.log("\n❌ FAILED TESTS:");
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }

  return { passed, failed, results };
}

runTests().catch(console.error);
