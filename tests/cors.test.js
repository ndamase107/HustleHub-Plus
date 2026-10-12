
const request = require("supertest");
const app = require("../app");

describe("HustleHub+ CORS Security Tests", () => {

  test("Allows React frontend on port 5174", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Origin", "http://localhost:5174");

    expect(response.status).toBe(401);

    expect(response.headers["access-control-allow-origin"])
      .toBe("http://localhost:5174");
  });

  test("Allows React frontend on port 5173", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Origin", "http://localhost:5173");

    expect(response.status).toBe(401);

    expect(response.headers["access-control-allow-origin"])
      .toBe("http://localhost:5173");
  });

  test("Does not grant CORS permission to unknown origins", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Origin", "https://untrusted.example");

    expect(response.status).toBe(401);

    expect(response.headers["access-control-allow-origin"])
      .toBeUndefined();
  });

  test("Allows approved frontend preflight requests", async () => {
    const response = await request(app)
      .options("/api/bookings")
      .set("Origin", "http://localhost:5174")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "authorization,content-type");

    expect(response.status).toBe(204);

    expect(response.headers["access-control-allow-origin"])
      .toBe("http://localhost:5174");

    expect(response.headers["access-control-allow-methods"])
      .toContain("POST");
  });

});
