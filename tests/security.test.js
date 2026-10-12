
const request = require("supertest");
const app = require("../app");

describe("HustleHub+ Security Tests", () => {

  test("Should reject access without a JWT token", async () => {
    const response = await request(app)
      .get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("Should reject an invalid JWT token", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("Should prevent unauthenticated gig creation", async () => {
    const response = await request(app)
      .post("/api/gigs")
      .send({
        title: "Test Gig",
        description: "Unauthorized test",
        category: "Design",
        price: 850
      });

    expect(response.status).toBe(401);
  });

  test("Should prevent unauthenticated payments", async () => {
    const response = await request(app)
      .post("/api/transactions/pay/507f1f77bcf86cd799439011");

    expect(response.status).toBe(401);
  });

});
