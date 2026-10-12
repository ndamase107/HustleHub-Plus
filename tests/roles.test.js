
const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("../models/User", () => ({
  findById: jest.fn()
}));

const User = require("../models/User");
const app = require("../app");

function createToken(id) {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { algorithm: "HS256", expiresIn: "1h" }
  );
}

describe("HustleHub+ Role-Based Access Tests", () => {

  beforeEach(() => {
    jest.clearAllMocks();

    User.findById.mockImplementation(async (id) => ({
      _id: { toString: () => id },
      role: id === "client123" ? "Client" : "Freelancer"
    }));
  });

  test("Client cannot publish a freelancer gig", async () => {
    const token = createToken("client123");

    const response = await request(app)
      .post("/api/gigs")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Logo Design",
        description: "Professional logo design",
        category: "Design",
        price: 850
      });

    expect(response.status).toBe(403);
  });

  test("Freelancer cannot create a client booking", async () => {
    const token = createToken("freelancer123");

    const response = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        gigId: "507f1f77bcf86cd799439011"
      });

    expect(response.status).toBe(403);
  });

  test("Client cannot accept a booking", async () => {
    const token = createToken("client123");

    const response = await request(app)
      .patch("/api/bookings/507f1f77bcf86cd799439011/accept")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  test("Freelancer cannot make a client payment", async () => {
    const token = createToken("freelancer123");

    const response = await request(app)
      .post("/api/transactions/pay/507f1f77bcf86cd799439011")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

});
