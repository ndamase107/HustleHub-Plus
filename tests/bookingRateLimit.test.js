
const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("../models/User", () => ({
  findById: jest.fn()
}));

jest.mock("../controllers/bookingController", () => ({
  myBookings: jest.fn((req, res) => res.sendStatus(200)),
  createBooking: jest.fn((req, res) => res.status(201).json({
    success: true
  })),
  acceptBooking: jest.fn((req, res) => res.sendStatus(200)),
  completeBooking: jest.fn((req, res) => res.sendStatus(200)),
  cancelBooking: jest.fn((req, res) => res.sendStatus(200))
}));

const User = require("../models/User");
const app = require("../app");

describe("HustleHub+ Booking Rate Limiting", () => {
  test("Blocks booking requests after the limit is reached", async () => {
    User.findById.mockResolvedValue({
      _id: "client123",
      role: "Client"
    });

    const token = jwt.sign(
      { id: "client123" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const responses = [];

    for (let i = 0; i < 11; i++) {
      const response = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ gigId: "507f1f77bcf86cd799439011" });

      responses.push(response);
    }

    expect(responses.slice(0, 10).every(
      response => response.status === 201
    )).toBe(true);

    expect(responses[10].status).toBe(429);
    expect(responses[10].body.success).toBe(false);
  });
});
