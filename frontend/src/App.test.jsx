
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

function mockResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data
  };
}

function openPage(path) {
  window.history.replaceState({}, "", path);
  return render(<App />);
}

beforeEach(() => {
  sessionStorage.clear();
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HustleHub+ frontend", () => {
  it("redirects unauthenticated users away from the dashboard", async () => {
    openPage("/dashboard");

    expect(
      await screen.findByRole("heading", { name: "Welcome back" })
    ).toBeInTheDocument();

    expect(window.location.pathname).toBe("/login");
  });

  it("shows registration fields and account roles", async () => {
    openPage("/register");

    expect(
      await screen.findByRole("heading", { name: "Join HustleHub+" })
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Your full name")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("option", { name: "Client" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("option", { name: "Freelancer" })
    ).toBeInTheDocument();
  });

  it("prevents login when required fields are empty", async () => {
    const user = userEvent.setup();

    openPage("/login");

    await user.click(
      await screen.findByRole("button", { name: "Sign In" })
    );

    expect(
      screen.getByPlaceholderText("you@example.com")
    ).toBeInvalid();

    expect(fetch).not.toHaveBeenCalled();
  });

  it("displays a message when login credentials are rejected", async () => {
    const user = userEvent.setup();

    fetch.mockResolvedValue(
      mockResponse({ message: "Invalid credentials" }, 401)
    );

    openPage("/login");

    await user.type(
      await screen.findByPlaceholderText("you@example.com"),
      "wrong@example.com"
    );

    await user.type(
      screen.getByPlaceholderText("Enter your password"),
      "WrongPassword123"
    );

    await user.click(
      screen.getByRole("button", { name: "Sign In" })
    );

    expect(
      await screen.findByText("Invalid credentials")
    ).toBeInTheDocument();

    expect(sessionStorage.getItem("hh_token")).toBeNull();
  });

  it("logs in successfully and opens the client dashboard", async () => {
    const user = userEvent.setup();

    fetch.mockImplementation(async (url) => {
      if (url.includes("/auth/login")) {
        return mockResponse({ token: "test-jwt-token" });
      }

      if (url.includes("/auth/me")) {
        return mockResponse({
          user: {
            _id: "client123",
            name: "Test Client",
            role: "Client"
          }
        });
      }

      if (url.includes("/bookings/mine")) {
        return mockResponse({ bookings: [] });
      }

      if (url.includes("/transactions/mine")) {
        return mockResponse({ transactions: [] });
      }

      throw new Error(`Unexpected API request: ${url}`);
    });

    openPage("/login");

    await user.type(
      await screen.findByPlaceholderText("you@example.com"),
      "client@example.com"
    );

    await user.type(
      screen.getByPlaceholderText("Enter your password"),
      "Password123"
    );

    await user.click(
      screen.getByRole("button", { name: "Sign In" })
    );

    expect(
      await screen.findByRole("heading", {
        name: "Welcome back, Test!"
      })
    ).toBeInTheDocument();

    expect(sessionStorage.getItem("hh_token")).toBe("test-jwt-token");

    await waitFor(() => {
      expect(window.location.pathname).toBe("/dashboard");
    });
  });
});