
const request = require("supertest");

jest.mock("../controllers/authController", () => ({
  register: jest.fn((req, res) =>
    res.status(201).json({ success: true })
  ),
  login: jest.fn((req, res) =>
    res.status(401).json({
      success: false,
      message: "Invalid credentials"
    })
  ),
  getProfile: jest.fn((req, res) =>
    res.status(200).json({ success: true })
  )
}));

const app = require("../app");

describe("HustleHub+ Helmet and Login Security", () => {
  test("Helmet provides CSP and security headers", async () => {
    const response = await request(app)
      .get("/api/auth/me");

    expect(response.headers["content-security-policy"])
      .toBeDefined();

    expect(response.headers["x-content-type-options"])
      .toBe("nosniff");

    expect(response.headers["strict-transport-security"])
      .toBeDefined();

    expect(response.headers["x-frame-options"])
      .toBeDefined();
  });

  test("Login rate limiter blocks excessive attempts", async () => {
    const responses = [];

    for (let i = 0; i < 21; i++) {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "ratelimit-test@example.com",
          password: "TestPassword123!"
        });

      responses.push(response);
    }

    expect(
      responses.slice(0, 20).every(
        response => response.status === 401
      )
    ).toBe(true);

    expect(responses[20].status).toBe(429);
    expect(responses[20].body.success).toBe(false);
  });
});
