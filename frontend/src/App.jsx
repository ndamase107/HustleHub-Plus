
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BrowserRouter, Routes, Route, Link, Navigate, useNavigate
} from "react-router-dom";
import {
  BriefcaseBusiness, LogOut, PlusCircle, Wallet, CheckCircle2,
  CreditCard, Search, ArrowRight, Menu, X, LayoutDashboard,
  ClipboardList, Layers3, TrendingUp, Clock3, Trash2, Pencil,
  RefreshCw, CircleDollarSign
} from "lucide-react";
import "./App.css";

const money = value =>
  `R${Number(value || 0).toLocaleString("en-ZA")}`;

const getId = value =>
  typeof value === "object" && value
    ? String(value._id || value.id || "")
    : String(value || "");

const getList = (result, key) =>
  Array.isArray(result) ? result :
  Array.isArray(result?.[key]) ? result[key] :
  Array.isArray(result?.data?.[key]) ? result.data[key] :
  Array.isArray(result?.data) ? result.data : [];

const categories = [
  "All", "Web Development", "Graphic Design",
  "Marketing", "Writing", "Video Editing", "Business"
];

function emoji(category = "") {
  const s = category.toLowerCase();
  if (s.includes("web") || s.includes("develop")) return "💻";
  if (s.includes("design") || s.includes("graphic")) return "🎨";
  if (s.includes("market")) return "📣";
  if (s.includes("writ")) return "✍️";
  if (s.includes("video")) return "🎬";
  if (s.includes("business")) return "💼";
  return "✨";
}

function freelancerName(gig) {
  return typeof gig.freelancer === "object"
    ? gig.freelancer?.name || "Freelancer"
    : "Freelancer";
}

async function api(path, method = "GET", data) {
  const token = sessionStorage.getItem("hh_token");

  const response = await fetch(`/api${path}`, {
    method,
    headers: {
      ...(data !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {})
    },
    ...(data !== undefined
      ? { body: JSON.stringify(data) }
      : {})
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message || result.error ||
      `Request failed (${response.status})`
    );
  }

  return result;
}

/* APPLICATION */

function AppContent() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem("hh_token")) {
      setLoading(false);
      return;
    }

    api("/auth/me")
      .then(result => setUser(result.user || result.data?.user))
      .catch(() => sessionStorage.removeItem("hh_token"))
      .finally(() => setLoading(false));
  }, []);

  function logout() {
    sessionStorage.removeItem("hh_token");
    setUser(null);
    navigate("/");
  }

  if (loading) {
    return <div className="loading">Loading HustleHub+...</div>;
  }

  return (
    <>
      <header className="navbar">
        <div className="container nav-inner">
          <Link to="/" className="brand">
            <span className="brand-icon">
              <BriefcaseBusiness size={23} />
            </span>
            HustleHub<span className="purple">+</span>
          </Link>

          <button
            className="mobile-menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>

          <nav className={menuOpen ? "nav-open" : ""}>
            <Link to="/" onClick={() => setMenuOpen(false)}>
              Explore Services
            </Link>

            {user ? (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <span className="nav-name">{user.name}</span>
                <button className="btn primary" onClick={logout}>
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login">Log In</Link>
                <Link to="/register" className="btn primary">
                  Join HustleHub+ <ArrowRight size={16} />
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {notice && (
        <div className="notice">
          <span>{notice}</span>
          <button onClick={() => setNotice("")}>
            <X size={18} />
          </button>
        </div>
      )}

      <Routes>
        <Route
          path="/"
          element={<Home user={user} notify={setNotice} />}
        />
        <Route
          path="/login"
          element={
            user ? <Navigate to="/dashboard" /> :
            <Auth
              mode="login"
              setUser={setUser}
              notify={setNotice}
            />
          }
        />
        <Route
          path="/register"
          element={
            user ? <Navigate to="/dashboard" /> :
            <Auth
              mode="register"
              setUser={setUser}
              notify={setNotice}
            />
          }
        />
        <Route
          path="/dashboard"
          element={
            user
              ? <Dashboard user={user} notify={setNotice} />
              : <Navigate to="/login" />
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <footer className="footer">
        <div className="container footer-inner">
          <strong>HustleHub<span className="purple">+</span></strong>
          <span>© 2026 HustleHub+ · Freelance Marketplace</span>
        </div>
      </footer>
    </>
  );
}

/* HOMEPAGE */

function Home({ user, notify }) {
  const navigate = useNavigate();

  const [gigs, setGigs] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/gigs")
      .then(result => setGigs(getList(result, "gigs")))
      .catch(error => notify(error.message))
      .finally(() => setLoading(false));
  }, [notify]);

  const filtered = gigs.filter(gig => {
    const text = [
      gig.title, gig.description, gig.category,
      freelancerName(gig)
    ].join(" ").toLowerCase();

    return text.includes(search.toLowerCase()) &&
      (category === "All" ||
        (gig.category || "").toLowerCase() ===
        category.toLowerCase());
  });

  const freelancers = Array.from(
    new Map(
      gigs
        .filter(gig =>
          gig.freelancer &&
          typeof gig.freelancer === "object"
        )
        .map(gig => [
          getId(gig.freelancer),
          {
            name: freelancerName(gig),
            category: gig.category
          }
        ])
    ).values()
  ).slice(0, 3);

  async function book(gig) {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role !== "Client") {
      notify("Only clients can book services.");
      return;
    }

    setBusy(getId(gig));

    try {
      await api("/bookings", "POST", {
        gigId: getId(gig)
      });

      notify("Booking created successfully!");
      navigate("/dashboard");
    } catch (error) {
      notify(error.message);
    } finally {
      setBusy("");
    }
  }

  function selectCategory(value) {
    setCategory(value);
    document.getElementById("services")?.scrollIntoView({
      behavior: "smooth"
    });
  }

  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="hero-label">
              ✦ THE FREELANCE MARKETPLACE
            </span>

            <h1>
              Big ideas need
              <br />
              <span>great talent.</span>
            </h1>

            <p>
              From websites and graphic design to marketing
              and creative services, discover freelancers
              ready to bring your next project to life.
            </p>

            <div className="hero-search">
              <Search size={20} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search services or freelancers..."
              />
              <button
                onClick={() =>
                  document.getElementById("services")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Search <ArrowRight size={16} />
              </button>
            </div>

            <div className="hero-perks">
              <span>✓ Discover services</span>
              <span>✓ Connect with talent</span>
              <span>✓ Book with ease</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-card">
              <small>✦ CREATIVE POSSIBILITIES</small>
              <div className="visual-star">✳</div>
              <h2>
                Your vision.
                <br />
                Our community.
              </h2>
              <p>Discover · Collaborate · Create</p>
            </div>
            <span className="floating floating-one">
              🎨 Creative services
            </span>
            <span className="floating floating-two">
              💻 Digital solutions
            </span>
          </div>
        </div>
      </section>

      <section className="container home-section">
        <div className="section-title">
          <span>FIND YOUR PERFECT MATCH</span>
          <h2>Explore by category</h2>
          <p>Find the right skills for your next project.</p>
        </div>

        <div className="category-grid">
          {categories.map(item => (
            <button
              key={item}
              className={
                "category-card " +
                (category === item ? "selected" : "")
              }
              onClick={() => selectCategory(item)}
            >
              <span className="category-emoji">
                {emoji(item)}
              </span>
              <strong>{item}</strong>
              <small>↗</small>
            </button>
          ))}
        </div>
      </section>

      <section id="services" className="container home-section">
        <div className="section-heading">
          <div className="section-title">
            <span>THE MARKETPLACE</span>
            <h2>Discover freelance services</h2>
            <p>
              Explore services published by freelancers.
            </p>
          </div>

          <span className="count-pill">
            {filtered.length} Services
          </span>
        </div>

        {(category !== "All" || search) && (
          <button
            className="clear-filter"
            onClick={() => {
              setCategory("All");
              setSearch("");
            }}
          >
            Clear filters ×
          </button>
        )}

        {loading ? (
          <div className="empty">Loading services...</div>
        ) : filtered.length === 0 ? (
          <div className="empty">No matching services found.</div>
        ) : (
          <div className="service-grid">
            {filtered.map((gig, index) => (
              <article className="service-card" key={getId(gig)}>
                <div className={`service-art art-${index % 4}`}>
                  <span className="art-tag">{gig.category}</span>
                  <span className="art-emoji">
                    {emoji(gig.category)}
                  </span>
                </div>

                <div className="service-content">
                  <span className="eyebrow">
                    {gig.category}
                  </span>
                  <h3>{gig.title}</h3>
                  <p>{gig.description}</p>

                  <div className="seller">
                    <span className="avatar">
                      {freelancerName(gig).charAt(0)}
                    </span>
                    <div>
                      <small>Offered by</small>
                      <strong>{freelancerName(gig)}</strong>
                    </div>
                  </div>

                  <div className="service-footer">
                    <div>
                      <small>Starting at</small>
                      <strong>{money(gig.price)}</strong>
                    </div>

                    <button
                      className="btn primary"
                      disabled={busy === getId(gig)}
                      onClick={() => book(gig)}
                    >
                      {busy === getId(gig)
                        ? "Booking..."
                        : "Book Now"}
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="featured">
        <div className="container">
          <div className="section-title">
            <span>THE PEOPLE BEHIND THE SKILLS</span>
            <h2>Meet our freelancers</h2>
            <p>Discover professionals on HustleHub+.</p>
          </div>

          <div className="freelancer-grid">
            {freelancers.map((freelancer, index) => (
              <div className="freelancer-card" key={index}>
                <span className="large-avatar">
                  {freelancer.name.charAt(0)}
                </span>
                <div>
                  <h3>{freelancer.name}</h3>
                  <p>{freelancer.category}</p>
                  <small>Available on HustleHub+</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container cta-section">
        <div className="cta">
          <div>
            <small>YOUR NEXT OPPORTUNITY AWAITS</small>
            <h2>
              Have a skill? Make it your next opportunity.
            </h2>
            <p>
              Join HustleHub+ and start offering your services.
            </p>
          </div>

          <Link
            className="btn light"
            to={user ? "/dashboard" : "/register"}
          >
            {user ? "Go to Dashboard" : "Get Started Today"}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}

/* LOGIN AND REGISTRATION */

function Auth({ mode, setUser, notify }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Client"
  });

  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);

    try {
      if (mode === "register") {
        await api("/auth/register", "POST", form);
        notify("Registration successful! Please log in.");
        navigate("/login");
      } else {
        const result = await api("/auth/login", "POST", {
          email: form.email,
          password: form.password
        });

        if (!result.token) {
          throw new Error("No authentication token received.");
        }

        sessionStorage.setItem("hh_token", result.token);

        try {
          const profile = await api("/auth/me");
          const account =
            profile.user || profile.data?.user;

          if (!account) {
            throw new Error("Unable to load your profile.");
          }

          setUser(account);
          navigate("/dashboard");
        } catch (error) {
          sessionStorage.removeItem("hh_token");
          throw error;
        }
      }
    } catch (error) {
      notify(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-icon">
          <BriefcaseBusiness size={26} />
        </div>

        <h1>
          {mode === "login"
            ? "Welcome back"
            : "Join HustleHub+"}
        </h1>

        <p>
          {mode === "login"
            ? "Sign in to your workspace."
            : "Create your account to get started."}
        </p>

        {mode === "register" && (
          <>
            <label>Full Name</label>
            <input
              required
              value={form.name}
              onChange={e =>
                setForm({ ...form, name: e.target.value })
              }
              placeholder="Your full name"
            />

            <label>Account Type</label>
            <select
              value={form.role}
              onChange={e =>
                setForm({ ...form, role: e.target.value })
              }
            >
              <option value="Client">Client</option>
              <option value="Freelancer">Freelancer</option>
            </select>
          </>
        )}

        <label>Email Address</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={e =>
            setForm({ ...form, email: e.target.value })
          }
          placeholder="you@example.com"
        />

        <label>Password</label>
        <input
          type="password"
          required
          value={form.password}
          onChange={e =>
            setForm({ ...form, password: e.target.value })
          }
          placeholder="Enter your password"
        />

        <button className="btn primary full" disabled={busy}>
          {busy
            ? "Please wait..."
            : mode === "login"
              ? "Sign In"
              : "Create Account"}
        </button>

        <p className="auth-switch">
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <Link to="/register">Register</Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link to="/login">Log In</Link>
            </>
          )}
        </p>
      </form>
    </main>
  );
}

/* DASHBOARD */

function Dashboard({ user, notify }) {
  const isFreelancer = user.role === "Freelancer";

  const [tab, setTab] = useState("overview");
  const [bookings, setBookings] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState("");

  const blankForm = {
    title: "",
    description: "",
    category: "Web Development",
    price: ""
  };

  const [form, setForm] = useState(blankForm);

  const refresh = useCallback(async () => {
    const requests = [
      api("/bookings/mine"),
      api("/transactions/mine")
    ];

    if (isFreelancer) {
      requests.push(
        api("/gigs"),
        api("/transactions/earnings")
      );
    }

    const results = await Promise.allSettled(requests);

    if (results[0].status === "fulfilled") {
      setBookings(getList(results[0].value, "bookings"));
    } else {
      notify(results[0].reason.message);
    }

    if (results[1].status === "fulfilled") {
      setTransactions(
        getList(results[1].value, "transactions")
      );
    }

    if (isFreelancer) {
      if (results[2].status === "fulfilled") {
        const all = getList(results[2].value, "gigs");

        setGigs(
          all.filter(gig =>
            getId(gig.freelancer) === getId(user)
          )
        );
      }

      if (results[3].status === "fulfilled") {
        setEarnings(results[3].value);
      }
    }

    setLoading(false);
  }, [isFreelancer, user._id, user.id, notify]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stats = useMemo(() => ({
    total: bookings.length,
    pending: bookings.filter(b => b.status === "Pending").length,
    active: bookings.filter(b => b.status === "Accepted").length,
    completed: bookings.filter(b => b.status === "Completed").length
  }), [bookings]);

  const spending = transactions.reduce(
    (total, t) =>
      total +
      (String(t.status).toLowerCase() === "paid"
        ? Number(t.amount || 0)
        : 0),
    0
  );

  async function perform(path, method = "PATCH", data) {
    setBusy(true);

    try {
      await api(path, method, data);
      notify("Action completed successfully.");
      await refresh();
    } catch (error) {
      notify(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveGig(e) {
    e.preventDefault();
    setBusy(true);

    try {
      const payload = {
        ...form,
        price: Number(form.price)
      };

      await api(
        editId ? `/gigs/${editId}` : "/gigs",
        editId ? "PATCH" : "POST",
        payload
      );

      notify(
        editId
          ? "Service updated successfully!"
          : "Service published successfully!"
      );

      setEditId("");
      setForm(blankForm);
      await refresh();
      setTab("services");
    } catch (error) {
      notify(error.message);
    } finally {
      setBusy(false);
    }
  }

  function editGig(gig) {
    setEditId(getId(gig));
    setForm({
      title: gig.title || "",
      description: gig.description || "",
      category: gig.category || "Web Development",
      price: String(gig.price ?? "")
    });
    setTab("create");
  }

  async function deleteGig(gig) {
    if (!window.confirm(`Delete "${gig.title}"?`)) return;
    await perform(`/gigs/${getId(gig)}`, "DELETE");
  }

  const tabs = isFreelancer
    ? [
        { id: "overview", name: "Overview", icon: LayoutDashboard },
        { id: "bookings", name: "Bookings", icon: ClipboardList },
        { id: "services", name: "My Services", icon: Layers3 },
        { id: "create", name: "Publish Service", icon: PlusCircle },
        { id: "payments", name: "Earnings & Payments", icon: Wallet }
      ]
    : [
        { id: "overview", name: "Overview", icon: LayoutDashboard },
        { id: "bookings", name: "My Bookings", icon: ClipboardList },
        { id: "payments", name: "Payment History", icon: CreditCard }
      ];

  const title = tabs.find(item => item.id === tab)?.name;

  return (
    <main className="dashboard-bg">
      <div className="container dashboard-layout">

        {/* SIDEBAR */}

        <aside className="sidebar">
          <span className="sidebar-label">WORKSPACE</span>

          <div className="sidebar-profile">
            <span className="profile-avatar">
              {(user.name || "U").charAt(0)}
            </span>

            <div>
              <strong>{user.name}</strong>
              <small>{user.role} Account</small>
            </div>
          </div>

          <span className="sidebar-label">NAVIGATION</span>

          <nav className="sidebar-nav">
            {tabs.map(item => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  className={
                    "sidebar-link " +
                    (tab === item.id ? "active" : "")
                  }
                  onClick={() => setTab(item.id)}
                >
                  <Icon size={19} />
                  {item.name}
                </button>
              );
            })}
          </nav>

          <div className="sidebar-help">
            <strong>HustleHub+ Workspace</strong>
            <p>
              Manage all your freelance activity
              in one place.
            </p>
          </div>
        </aside>

        {/* MAIN DASHBOARD */}

        <div className="dashboard-main">
          <div className="dashboard-top">
            <div>
              <span className="eyebrow">
                {isFreelancer
                  ? "FREELANCER WORKSPACE"
                  : "CLIENT WORKSPACE"}
              </span>

              <h1>
                {tab === "overview"
                  ? `Welcome back, ${user.name?.split(" ")[0]}!`
                  : title}
              </h1>

              <p>
                {tab === "overview"
                  ? "Here's what's happening with your account."
                  : `Manage your ${title.toLowerCase()} here.`}
              </p>
            </div>

            <button
              className="btn outline"
              onClick={refresh}
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="dash-panel">
              Loading dashboard...
            </div>
          ) : (
            <>

              {/* OVERVIEW */}

              {tab === "overview" && (
                <>
                  <div className="stats-grid">
                    <Stat
                      icon={ClipboardList}
                      label="Total Bookings"
                      value={stats.total}
                    />
                    <Stat
                      icon={Clock3}
                      label="Pending Bookings"
                      value={stats.pending}
                    />
                    <Stat
                      icon={BriefcaseBusiness}
                      label="Active Jobs"
                      value={stats.active}
                    />
                    <Stat
                      icon={CheckCircle2}
                      label="Completed Jobs"
                      value={stats.completed}
                    />
                  </div>

                  <div className="overview-grid">
                    <section className="dash-panel">
                      <div className="panel-heading">
                        <div>
                          <h2>Recent Bookings</h2>
                          <p>Your latest booking activity</p>
                        </div>

                        <button
                          className="text-btn"
                          onClick={() => setTab("bookings")}
                        >
                          View all <ArrowRight size={16} />
                        </button>
                      </div>

                      <BookingList
                        bookings={bookings.slice(0, 4)}
                        isFreelancer={isFreelancer}
                        busy={busy}
                        perform={perform}
                        compact
                      />
                    </section>

                    <section className="dash-panel summary-panel">
                      <h2>
                        {isFreelancer
                          ? "Earnings Overview"
                          : "Spending Overview"}
                      </h2>

                      <p>Simulated payment records</p>

                      <div className="summary-icon">
                        {isFreelancer
                          ? <TrendingUp size={26} />
                          : <CircleDollarSign size={26} />}
                      </div>

                      <strong className="summary-money">
                        {money(
                          isFreelancer
                            ? earnings?.totalEarnings
                            : spending
                        )}
                      </strong>

                      <span className="simulation-note">
                        Simulation only — no real money transferred.
                      </span>

                      <button
                        className="btn outline full"
                        onClick={() => setTab("payments")}
                      >
                        View Payment Details
                        <ArrowRight size={16} />
                      </button>
                    </section>
                  </div>

                  <section className="dash-panel quick-panel">
                    <div>
                      <h2>
                        {isFreelancer
                          ? "Ready to offer another service?"
                          : "Find your next freelancer"}
                      </h2>

                      <p>
                        {isFreelancer
                          ? "Publish a new service to attract clients."
                          : "Explore the marketplace and book a service."}
                      </p>
                    </div>

                    {isFreelancer ? (
                      <button
                        className="btn primary"
                        onClick={() => {
                          setEditId("");
                          setForm(blankForm);
                          setTab("create");
                        }}
                      >
                        <PlusCircle size={17} />
                        Publish Service
                      </button>
                    ) : (
                      <Link className="btn primary" to="/">
                        Explore Services
                        <ArrowRight size={16} />
                      </Link>
                    )}
                  </section>
                </>
              )}

              {/* BOOKINGS */}

              {tab === "bookings" && (
                <section className="dash-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>All Bookings</h2>
                      <p>
                        {stats.total} total · {stats.pending} pending ·
                        {" "}{stats.active} active ·
                        {" "}{stats.completed} completed
                      </p>
                    </div>
                  </div>

                  <BookingList
                    bookings={bookings}
                    isFreelancer={isFreelancer}
                    busy={busy}
                    perform={perform}
                  />
                </section>
              )}

              {/* MY SERVICES */}

              {tab === "services" && isFreelancer && (
                <section className="dash-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>My Published Services</h2>
                      <p>Manage your marketplace listings.</p>
                    </div>

                    <button
                      className="btn primary"
                      onClick={() => {
                        setEditId("");
                        setForm(blankForm);
                        setTab("create");
                      }}
                    >
                      <PlusCircle size={16} />
                      New Service
                    </button>
                  </div>

                  {gigs.length === 0 ? (
                    <Empty
                      title="No services found"
                      description="Publish a service to get started."
                    />
                  ) : (
                    <div className="managed-services">
                      {gigs.map(gig => (
                        <div
                          className="managed-service"
                          key={getId(gig)}
                        >
                          <span className="managed-emoji">
                            {emoji(gig.category)}
                          </span>

                          <div className="managed-details">
                            <h3>{gig.title}</h3>
                            <p>
                              {gig.category} · {money(gig.price)}
                            </p>
                          </div>

                          <div className="managed-actions">
                            <button
                              className="btn outline"
                              onClick={() => editGig(gig)}
                            >
                              <Pencil size={15} />
                              Edit
                            </button>

                            <button
                              className="btn danger"
                              disabled={busy}
                              onClick={() => deleteGig(gig)}
                            >
                              <Trash2 size={15} />
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* CREATE OR EDIT SERVICE */}

              {tab === "create" && isFreelancer && (
                <section className="dash-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>
                        {editId
                          ? "Edit Service"
                          : "Publish a New Service"}
                      </h2>
                      <p>
                        Tell clients what your service offers.
                      </p>
                    </div>
                  </div>

                  <form className="service-form" onSubmit={saveGig}>
                    <label>
                      Service Title
                      <input
                        required
                        value={form.title}
                        onChange={e =>
                          setForm({
                            ...form,
                            title: e.target.value
                          })
                        }
                        placeholder="e.g. Professional Logo Design"
                      />
                    </label>

                    <div className="form-row">
                      <label>
                        Category
                        <select
                          value={form.category}
                          onChange={e =>
                            setForm({
                              ...form,
                              category: e.target.value
                            })
                          }
                        >
                          {categories
                            .filter(c => c !== "All")
                            .map(c => (
                              <option key={c}>{c}</option>
                            ))}
                        </select>
                      </label>

                      <label>
                        Price (ZAR)
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          required
                          value={form.price}
                          onChange={e =>
                            setForm({
                              ...form,
                              price: e.target.value
                            })
                          }
                          placeholder="850"
                        />
                      </label>
                    </div>

                    <label>
                      Service Description
                      <textarea
                        rows={6}
                        required
                        value={form.description}
                        onChange={e =>
                          setForm({
                            ...form,
                            description: e.target.value
                          })
                        }
                        placeholder="Describe what the client will receive..."
                      />
                    </label>

                    <div className="form-actions">
                      <button
                        className="btn primary"
                        disabled={busy}
                      >
                        <PlusCircle size={17} />
                        {busy
                          ? "Saving..."
                          : editId
                            ? "Save Changes"
                            : "Publish Service"}
                      </button>

                      {editId && (
                        <button
                          type="button"
                          className="btn outline"
                          onClick={() => {
                            setEditId("");
                            setForm(blankForm);
                          }}
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>
                  </form>
                </section>
              )}

              {/* PAYMENT HISTORY */}

              {tab === "payments" && (
                <section className="dash-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>
                        {isFreelancer
                          ? "Earnings & Transactions"
                          : "Payment History"}
                      </h2>
                      <p>
                        View your simulated transaction records.
                      </p>
                    </div>
                  </div>

                  <div className="payment-summary">
                    <Wallet size={25} />

                    <div>
                      <small>
                        {isFreelancer
                          ? "Simulated Earnings"
                          : "Total Simulated Spending"}
                      </small>

                      <strong>
                        {money(
                          isFreelancer
                            ? earnings?.totalEarnings
                            : spending
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="simulation-banner">
                    These are test payments. No actual funds
                    are charged or transferred.
                  </div>

                  {transactions.length === 0 ? (
                    <Empty
                      title="No transactions yet"
                      description="Your payment history will appear here."
                    />
                  ) : (
                    <div className="transactions">
                      {transactions.map((t, index) => (
                        <div
                          className="transaction"
                          key={getId(t) || index}
                        >
                          <span className="transaction-icon">
                            <CreditCard size={20} />
                          </span>

                          <div className="transaction-info">
                            <strong>
                              Transaction {getId(t).slice(-7)}
                            </strong>
                            <small>
                              {t.createdAt
                                ? new Date(t.createdAt)
                                    .toLocaleDateString("en-ZA")
                                : "Simulated transaction"}
                            </small>
                          </div>

                          <span className="status-badge">
                            {t.status || "Recorded"}
                          </span>

                          <strong>{money(t.amount)}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

/* STATISTICS CARD */

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="stat-card">
      <span className="stat-icon">
        <Icon size={23} />
      </span>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

/* EMPTY STATE */

function Empty({ title, description }) {
  return (
    <div className="empty-dashboard">
      <ClipboardList size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

/* BOOKING MANAGEMENT */

function BookingList({
  bookings,
  isFreelancer,
  busy,
  perform,
  compact = false
}) {
  if (bookings.length === 0) {
    return (
      <Empty
        title="No bookings yet"
        description={
          isFreelancer
            ? "Client bookings will appear here."
            : "Explore the marketplace to book a service."
        }
      />
    );
  }

  return (
    <div className="booking-list">
      {bookings.map(booking => (
        <div className="booking-item" key={getId(booking)}>
          <div className="booking-info">
            <span className="booking-icon">
              <BriefcaseBusiness size={20} />
            </span>

            <div>
              <h3>
                {booking.gig?.title || "Service Booking"}
              </h3>

              <p>
                {money(
                  booking.amount ?? booking.gig?.price
                )}
                {booking.createdAt
                  ? ` · ${new Date(
                      booking.createdAt
                    ).toLocaleDateString("en-ZA")}`
                  : ""}
              </p>
            </div>
          </div>

          <div className="booking-actions">
            <span
              className={
                "status-badge status-" +
                String(
                  booking.status || "Pending"
                ).toLowerCase()
              }
            >
              {booking.status}
            </span>

            {!compact && (
              <>
                {isFreelancer &&
                  booking.status === "Pending" && (
                    <button
                      className="btn primary"
                      disabled={busy}
                      onClick={() =>
                        perform(
                          `/bookings/${getId(booking)}/accept`
                        )
                      }
                    >
                      Accept
                    </button>
                  )}

                {isFreelancer &&
                  booking.status === "Accepted" && (
                    <button
                      className="btn primary"
                      disabled={busy}
                      onClick={() =>
                        perform(
                          `/bookings/${getId(booking)}/complete`
                        )
                      }
                    >
                      Complete Job
                    </button>
                  )}

                {!isFreelancer &&
                  booking.status === "Pending" && (
                    <button
                      className="btn outline"
                      disabled={busy}
                      onClick={() =>
                        perform(
                          `/bookings/${getId(booking)}/cancel`
                        )
                      }
                    >
                      Cancel
                    </button>
                  )}

                {!isFreelancer &&
                  booking.status === "Accepted" && (
                    <button
                      className="btn primary"
                      disabled={busy}
                      onClick={() =>
                        perform(
                          `/transactions/pay/${getId(booking)}`,
                          "POST"
                        )
                      }
                    >
                      <CreditCard size={16} />
                      Simulate Payment
                    </button>
                  )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
