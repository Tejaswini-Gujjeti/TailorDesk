import Customers from "./components/Customers.jsx";
import Orders from "./components/Orders.jsx";
import Payments from "./components/Payments.jsx";
import Measurements from "./components/Measurements.jsx";
import Reports from "./components/Reports";
import { useEffect, useState } from "react";

import Login from "./Login.jsx";
import Register from "./Register.jsx";
import {
  getCustomers,
  getOrders,
  getPayments,
  getCurrentUser,
  logoutUser,
} from "./api";


import {
  LayoutDashboard,
  Users,
  Shirt,
  Ruler,
  Wallet,
  Menu,
  X,
  Scissors,
  Plus,
  IndianRupee,
  Clock3,
  CheckCircle2,
  Search,
  ArrowRight,
  ClipboardList,
} from "lucide-react";

import "./App.css";

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Customers", icon: Users },
  { name: "Orders", icon: Shirt },
  { name: "Measurements", icon: Ruler },
  { name: "Payments", icon: Wallet },
  { name: "Reports", icon: ClipboardList },
];


function getStoredData(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function money(amount) {
  return "₹" + Number(amount || 0).toLocaleString("en-IN");
}

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [customers, setCustomers] = useState([]);
const [orders, setOrders] = useState([]);
const [payments, setPayments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const user = await getCurrentUser();

        if (isMounted) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.error("Failed to check login session:", error);

        if (isMounted) {
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);


useEffect(() => {
  if (authLoading || !currentUser) return;

  let isMounted = true;

  async function loadDashboardData() {
    try {
      const [customersData, ordersData, paymentsData] =
        await Promise.all([
          getCustomers(),
          getOrders(),
          getPayments(),
        ]);

      if (!isMounted) return;

      setCustomers(
        Array.isArray(customersData)
          ? customersData
          : customersData.results || []
      );

      setOrders(
        Array.isArray(ordersData)
          ? ordersData
          : ordersData.results || []
      );

      setPayments(
        Array.isArray(paymentsData)
          ? paymentsData
          : paymentsData.results || []
      );
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  }

  loadDashboardData();

  window.addEventListener("focus", loadDashboardData);
  window.addEventListener("tailordesk-updated", loadDashboardData);

  return () => {
    isMounted = false;
    window.removeEventListener("focus", loadDashboardData);
    window.removeEventListener("tailordesk-updated", loadDashboardData);
  };
}, [activePage, authLoading, currentUser, refresh]);



  const activeOrders = orders.filter((order) =>
    ["Pending", "In Progress"].includes(order.status)
  );

  const readyOrders = orders.filter(
    (order) => order.status === "Ready" ||
      order.status === "Ready for Delivery"
  );

const totalPaid = payments.reduce(
  (total, payment) => total + Number(payment.amount || 0),
  0
);

const getOrderBalance = (order) => {
  const orderPayments = payments
    .filter((payment) => Number(payment.order) === Number(order.id))
    .reduce((total, payment) => total + Number(payment.amount || 0), 0);

  return Math.max(0, Number(order.charge || 0) - orderPayments);
};

const totalToCollect = orders.reduce(
  (total, order) => total + getOrderBalance(order),
  0
);

  const recentOrders = [...orders]
    .sort((a, b) =>
      String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
    )
    .filter((order) => {
      const text = [
        order.customerName,
        order.phone,
        order.garment,
        order.description,
      ].join(" ").toLowerCase();

      return text.includes(searchTerm.toLowerCase());
    })
    .slice(0, 5);

  function navigate(page) {
    setActivePage(page);
    setSidebarOpen(false);
    setSearchTerm("");
  }

  function renderPage() {


if (activePage === "Customers") {
  return <Customers />;
}
if (activePage === "Orders") {
  return <Orders />;
}
if (activePage === "Payments") {
  return <Payments />;
}

if (activePage === "Measurements") {
  return <Measurements />;
}
if (activePage === "Reports") {
  return <Reports />;
}



    if (activePage === "Dashboard") {
      return (
        <>
          <section className="welcome-card">
            <div className="welcome-content">
              <span className="welcome-label">YOUR STITCHING WORKSPACE</span>
              <h1>Welcome to TailorDesk!</h1>
              <p>
                Keep track of your customers, orders and payments in one
                simple place.
              </p>
              <button
                className="primary-button"
                onClick={() => navigate("Customers")}
              >
                <Plus size={18} />
                Add a Customer
              </button>
            </div>
            <div className="welcome-illustration">
              <Scissors size={76} strokeWidth={1.2} />
            </div>
          </section>

          <section className="stats-grid">
            <StatCard
              icon={<Users />}
              label="Total Customers"
              value={customers.length}
              note="Customers saved"
              color="purple"
            />
            <StatCard
              icon={<Clock3 />}
              label="Being Stitched"
              value={activeOrders.length}
              note="Pending or in progress"
              color="blue"
            />
            <StatCard
              icon={<CheckCircle2 />}
              label="Ready for Delivery"
              value={readyOrders.length}
              note="Ready to hand over"
              color="green"
            />
            <StatCard
              icon={<IndianRupee />}
              label="Money to Collect"
              value={money(totalToCollect)}
              note="Outstanding balance"
              color="orange"
            />
          </section>

          <section className="dashboard-panel">
            <div className="panel-heading">
              <div>
                <h2>Recent Blouse Orders</h2>
                <p>Quickly find a customer's stitching work.</p>
              </div>
              <button
                className="text-button"
                onClick={() => navigate("Orders")}
              >
                View all <ArrowRight size={16} />
              </button>
            </div>

            <div className="order-search">
              <Search size={18} />
              <input
                type="search"
                placeholder="Search customer or blouse..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            {recentOrders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Shirt size={30} /></div>
                <h3>No blouse orders yet</h3>
                <p>
                  Your blouse orders will appear here after you add them.
                </p>
                <button
                  className="primary-button"
                  onClick={() => navigate("Customers")}
                >
                  <Plus size={18} />
                  Get Started
                </button>
              </div>
            ) : (
              <div className="recent-order-list">
                {recentOrders.map((order) => (
                  <div className="recent-order" key={order.id}>
                    <div className="order-shirt-icon">
                      <Shirt size={21} />
                    </div>
                    <div className="recent-order-details">
                      <strong>{order.customerName || "Customer"}</strong>
                      <span>
                        {order.garment || order.description || "Blouse"}
                        {order.deliveryDate
                          ? ` · Due ${order.deliveryDate}`
                          : ""}
                      </span>
                    </div>
                    <div className="recent-order-meta">
                      <strong>{money(getOrderBalance(order))}</strong>
                      <span className={`status-badge ${statusClass(order.status)}`}>
                        {order.status || "Pending"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="dashboard-panel quick-panel">
            <div className="panel-heading">
              <div>
                <h2>Quick Access</h2>
                <p>Choose what you want to do.</p>
              </div>
            </div>
            <div className="quick-actions">
              <QuickAction
                icon={<Users />}
                title="Customers"
                description="Add or find a customer"
                onClick={() => navigate("Customers")}
              />
              <QuickAction
                icon={<Shirt />}
                title="Blouse Orders"
                description="Track stitching work"
                onClick={() => navigate("Orders")}
              />
              <QuickAction
                icon={<Ruler />}
                title="Measurements"
                description="View saved measurements"
                onClick={() => navigate("Measurements")}
              />
              <QuickAction
                icon={<Wallet />}
                title="Payments"
                description="Check pending balances"
                onClick={() => navigate("Payments")}
              />
            </div>
          </section>
        </>
      );
    }

    return (
      <section className="dashboard-panel coming-soon">
        <div className="empty-icon">
          {navigation.find((item) => item.name === activePage)?.icon &&
            (() => {
              const Icon = navigation.find(
                (item) => item.name === activePage
              ).icon;
              return <Icon size={30} />;
            })()}
        </div>
        <h2>{activePage}</h2>
        <p>
          This section will be built next. We will keep it simple and easy
          to use.
        </p>
        <button
          className="primary-button"
          onClick={() => navigate("Dashboard")}
        >
          <LayoutDashboard size={18} />
          Back to Dashboard
        </button>
      </section>
    );
  }


if (authLoading) {
  return (
    <div className="auth-loading">
      <p>Loading TailorDesk...</p>
    </div>
  );
}

if (!currentUser) {
  return showRegister ? (
    <Register
      onRegister={(user) => {
        setCurrentUser(user);
        setShowRegister(false);
      }}
      onShowLogin={() => setShowRegister(false)}
    />
  ) : (
    <Login
      onLogin={(user) => {
        setCurrentUser(user);
        setShowRegister(false);
      }}
      onShowRegister={() => setShowRegister(true)}
    />
  );
}

async function handleLogout() {
  try {
    await logoutUser();
    setCurrentUser(null);
    setShowRegister(false);
    setActivePage("Dashboard");
  } catch (error) {
    console.error("Failed to log out:", error);
  }
}
return (
    <div className="app-layout">

      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon"><Scissors size={24} /></div>
          <div>
            <h2>TailorDesk</h2>
            <span>Every Stitch, Organized</span>
          </div>
          <button
            className="close-sidebar"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={21} />
          </button>
        </div>

        <div className="nav-label">MAIN MENU</div>
        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                className={`nav-item ${
                  activePage === item.name ? "active" : ""
                }`}
                onClick={() => navigate(item.name)}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help-icon"><Scissors size={22} /></div>
          <strong>Every Stitch, Organized</strong>
          <p>Your customers and orders, all in one place.</p>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="menu-button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={23} />
            </button>
            <div>
              <h2>{activePage}</h2>
              <p>TailorDesk / {activePage}</p>
            </div>
          </div>


<div className="topbar-account">
  <span>{currentUser.username}</span>
  <button type="button" onClick={handleLogout}>
    Sign Out
  </button>
</div>

        </header>

        <div className="page-content" key={`${activePage}-${refresh}`}>
          {renderPage()}
        </div>

        <footer className="app-footer">
          TailorDesk <span>·</span> Simple stitching management
        </footer>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, note, color }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-note">{note}</div>
    </div>
  );
}

function QuickAction({ icon, title, description, onClick }) {
  return (
    <button className="quick-action" onClick={onClick}>
      <div className="quick-action-icon">{icon}</div>
      <div className="quick-action-text">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <ArrowRight size={17} className="quick-action-arrow" />
    </button>
  );
}

function statusClass(status) {
  const value = String(status || "Pending")
    .toLowerCase()
    .replaceAll(" ", "-");

  if (value === "ready") return "ready-for-delivery";
  return value;
}

export default App;
