
const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("../models/User", () => ({
  findById: jest.fn()
}));

jest.mock("../models/Booking", () => ({
  findOneAndUpdate: jest.fn(),
  findOne: jest.fn()
}));

jest.mock("../models/Transaction", () => ({
  findOne: jest.fn(),
  create: jest.fn()
}));

const User = require("../models/User");
const Booking = require("../models/Booking");
const Transaction = require("../models/Transaction");
const app = require("../app");

const bookingId = "507f1f77bcf86cd799439011";

function createToken(id) {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { algorithm: "HS256", expiresIn: "1h" }
  );
}

describe("HustleHub+ Booking and Payment Security", () => {

  beforeEach(() => {
    jest.resetAllMocks();

    User.findById.mockImplementation(async (id) => ({
      _id: { toString: () => id },
      role: id === "client123" ? "Client" : "Freelancer"
    }));
  });

  test("Prevents a freelancer from accepting another freelancer's booking", async () => {
    Booking.findOneAndUpdate.mockResolvedValue(null);

    const response = await request(app)
      .patch(`/api/bookings/${bookingId}/accept`)
      .set("Authorization", `Bearer ${createToken("freelancer123")}`);

    expect(response.status).toBe(409);

    expect(Booking.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: bookingId,
        freelancer: "freelancer123",
        status: "Pending"
      },
      { $set: { status: "Accepted" } },
      { new: true }
    );
  });

  test("Prevents a client from cancelling another client's booking", async () => {
    Booking.findOneAndUpdate.mockResolvedValue(null);

    const response = await request(app)
      .patch(`/api/bookings/${bookingId}/cancel`)
      .set("Authorization", `Bearer ${createToken("client123")}`);

    expect(response.status).toBe(409);

    expect(Booking.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: bookingId,
        client: "client123",
        status: "Pending"
      },
      { $set: { status: "Cancelled" } },
      { new: true }
    );
  });

  test("Prevents completion of a booking without payment", async () => {
    Transaction.findOne.mockResolvedValue(null);

    const response = await request(app)
      .patch(`/api/bookings/${bookingId}/complete`)
      .set("Authorization", `Bearer ${createToken("freelancer123")}`);

    expect(response.status).toBe(409);

    expect(Transaction.findOne).toHaveBeenCalledWith({
      booking: bookingId,
      status: "Paid"
    });

    expect(Booking.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test("Prevents payment for a booking that is not accepted or owned by the client", async () => {
    Booking.findOne.mockResolvedValue(null);

    const response = await request(app)
      .post(`/api/transactions/pay/${bookingId}`)
      .set("Authorization", `Bearer ${createToken("client123")}`);

    expect(response.status).toBe(409);

    expect(Booking.findOne).toHaveBeenCalledWith({
      _id: bookingId,
      client: "client123",
      status: "Accepted"
    });

    expect(Transaction.create).not.toHaveBeenCalled();
  });

  test("Rejects duplicate payments", async () => {
    Booking.findOne.mockResolvedValue({
      _id: bookingId,
      client: "client123",
      freelancer: "freelancer123",
      amount: 850
    });

    Transaction.create.mockRejectedValue({ code: 11000 });

    const response = await request(app)
      .post(`/api/transactions/pay/${bookingId}`)
      .set("Authorization", `Bearer ${createToken("client123")}`);

    expect(response.status).toBe(409);
    expect(Transaction.create).toHaveBeenCalledTimes(1);
  });

});
