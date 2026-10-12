
const request = require("supertest");
const app = require("../app");

describe("HustleHub+ Input Validation Security Tests", () => {

  test("Rejects registration with an invalid email", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test User",
        email: "invalid-email",
        password: "SecurePass123!",
        role: "Client"
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("Rejects registration with a weak password", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "123",
        role: "Client"
      });

    expect(response.status).toBe(400);
  });

  test("Rejects registration with an unauthorized role", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "SecurePass123!",
        role: "Admin"
      });

    expect(response.status).toBe(400);
  });

  test("Rejects login with an invalid email", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "not-an-email",
        password: "SecurePass123!"
      });

    expect(response.status).toBe(400);
  });

  test("Rejects registration with a missing password", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test User",
        email: "test@example.com",
        role: "Client"
      });

    expect(response.status).toBe(400);
  });

});
