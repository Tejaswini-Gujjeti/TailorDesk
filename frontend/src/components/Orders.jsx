
import { useEffect, useState } from "react";
import {
  getCustomers,
  getOrders,
  createOrder,
  updateOrder,
  deleteOrder as deleteOrderFromAPI,
  getPayments,
  createPayment,
  updatePayment,
  deletePayment,
} from "../api";
import {
  Shirt,
  Plus,
  Search,
  CalendarDays,
  IndianRupee,
  Pencil,
  X,
  Trash2,
  Clock3,
  CheckCircle2,
  UserRound,
  Users,
} from "lucide-react";
import "./Orders.css";


const STATUSES = [
  "Pending",
  "In Progress",
  "Ready for Delivery",
  "Delivered",
];



function formatMoney(value) {
  return "₹" + Number(value || 0).toLocaleString("en-IN");
}

function statusClass(status) {
  return String(status || "Pending")
    .toLowerCase()
    .replaceAll(" ", "-");
}

function getDeliveryUrgency(order) {
  if (order.status === "Delivered") {
    return {
      label: "Delivered",
      className: "urgency-delivered",
    };
  }

  if (!order.deliveryDate) {
    return {
      label: "Date not set",
      className: "urgency-no-date",
    };
  }

  const [year, month, day] = order.deliveryDate.split("-").map(Number);
  const deliveryDate = new Date(year, month - 1, day);
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const daysUntilDelivery = Math.round(
    (deliveryDate.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (daysUntilDelivery < 0) {
    return {
      label: "Overdue",
      className: "urgency-overdue",
    };
  }

  if (daysUntilDelivery === 0) {
    return {
      label: "Due today",
      className: "urgency-today",
    };
  }

  if (daysUntilDelivery <= 2) {
    return {
      label: "Due soon",
      className: "urgency-soon",
    };
  }

  return {
    label: "Upcoming",
    className: "urgency-upcoming",
  };
}

const emptyForm = {
  customerId: "",
  garment: "Blouse",
  description: "",
  deliveryDate: "",
  charge: "",
  paid: "0",
  status: "Pending",
};

export default function Orders() {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);

      try {
        const [customerData, orderData, paymentData] =
          await Promise.all([
            getCustomers(),
            getOrders(),
            getPayments(),
          ]);

        if (!isMounted) return;

        setCustomers(customerData);
        setOrders(
          orderData.map((order) => {
            const orderPayments = paymentData.filter(
              (payment) => String(payment.order) === String(order.id)
            );

            const paid = orderPayments.reduce(
              (sum, payment) => sum + Number(payment.amount || 0),
              0
            );

            const charge = Number(order.charge || 0);

            return {
              ...order,
              customerId: order.customer,
              customerName: order.customer_name,
              phone: order.customer_phone,
              deliveryDate: order.delivery_date || "",
              createdAt: order.created_at,
              advance: paid,
              paid,
              balance: Math.max(0, charge - paid),
            };
          })
        );
        setPayments(paymentData);
      } catch (err) {
        if (isMounted) {
          setError(
            err.message || "Failed to load orders and payments."
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

 

  
  function openAddForm() {
    
    setForm({
      ...emptyForm,
      customerId: customers[0] ? String(customers[0].id) : "",
    });
    setEditingOrder(null);
    setError("");
    setShowForm(true);
  }

  function openEditForm(order) {
    
    setForm({
      customerId: String(order.customerId || ""),
      garment: order.garment || "Blouse",
      description: order.description || "",
      deliveryDate: order.deliveryDate || "",
      charge: String(order.charge ?? ""),
      paid: String(order.advance ?? order.paid ?? 0),
      status: order.status || "Pending",
    });
    setEditingOrder(order);
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingOrder(null);
    setForm(emptyForm);
    setError("");
  }

  
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const customer = customers.find(
      (item) => String(item.id) === String(form.customerId)
    );

    if (!customer) {
      setError("Please select a customer first.");
      return;
    }

    const charge = Number(form.charge);
    const paid = Number(form.paid);

    if (!Number.isFinite(charge) || charge < 0) {
      setError("Enter a valid stitching charge.");
      return;
    }

    if (!Number.isFinite(paid) || paid < 0 || paid > charge) {
      setError("The amount paid must be between ₹0 and the total charge.");
      return;
    }
if (!form.garment.trim()) {
  setError("Please enter the garment name.");
  return;
}

const previousPaid = editingOrder
  ? Number(editingOrder.advance ?? editingOrder.paid ?? 0)
  : 0;

if (paid < previousPaid) {
  setError(
    "The paid amount cannot be reduced here. Existing payments must be handled separately."
  );
  return;
}

try {
      const orderPayload = {
        customer: Number(customer.id),
        garment: form.garment.trim(),
        description: form.description.trim(),
        delivery_date: form.deliveryDate || null,
        charge: charge.toFixed(2),
        status: form.status,
      };

      let savedOrder;

      if (editingOrder) {
        savedOrder = await updateOrder(editingOrder.id, orderPayload);
      } else {
        savedOrder = await createOrder(orderPayload);
      }

     
      const paymentDifference = paid - previousPaid;

      if (paymentDifference > 0) {
        await createPayment({
          order: savedOrder.id,
          amount: paymentDifference.toFixed(2),
          notes: "Payment recorded from order form",
        });
      } else if (paymentDifference < 0) {
        setError(
          "The paid amount cannot be reduced from this form. Please keep the existing paid amount or add a new payment."
        );
        return;
      }

      const [customerData, orderData, paymentData] = await Promise.all([
        getCustomers(),
        getOrders(),
        getPayments(),
      ]);

      setCustomers(customerData);
      setPayments(paymentData);

      setOrders(
        orderData.map((order) => {
          const paidForOrder = paymentData
            .filter((payment) => String(payment.order) === String(order.id))
            .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

          return {
            ...order,
            customerId: order.customer,
            customerName: order.customer_name,
            phone: order.customer_phone,
            deliveryDate: order.delivery_date || "",
            createdAt: order.created_at,
            advance: paidForOrder,
            paid: paidForOrder,
            balance: Math.max(0, Number(order.charge || 0) - paidForOrder),
          };
        })
      );

      closeForm();
    } catch (err) {
      setError(err.message || "Failed to save the order.");
    }
  }


  
  async function updateStatus(order, status) {
    try {
      setError("");

      await updateOrder(order.id, {
        customer: Number(order.customerId),
        garment: order.garment || "Blouse",
        description: order.description || "",
        delivery_date: order.deliveryDate || null,
        charge: Number(order.charge || 0).toFixed(2),
        status,
      });

      setOrders((currentOrders) =>
        currentOrders.map((item) =>
          item.id === order.id ? { ...item, status } : item
        )
      );

      window.dispatchEvent(new Event("tailordesk-updated"));
    } catch (err) {
      setError(err.message || "Failed to update stitching status.");
    }
  }

  
  
  async function deleteOrder(order) {
    const confirmed = window.confirm(
      `Delete the ${order.garment || "garment"} order for ${order.customerName}?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await deleteOrderFromAPI(order.id);

      setOrders((currentOrders) =>
        currentOrders.filter((item) => item.id !== order.id)
      );

      window.dispatchEvent(new Event("tailordesk-updated"));
    } catch (err) {
  const message = err.message || "Failed to delete order.";

  setError(message);
  window.alert(message);
}
  }



  const filteredOrders = orders
    .filter((order) => {
      const term = search.trim().toLowerCase();

      const matchesSearch = [
        order.customerName,
        order.phone,
        order.garment,
        order.description,
      ].some((value) =>
        String(value || "").toLowerCase().includes(term)
      );

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Ready for Delivery"
          ? ["Ready", "Ready for Delivery"].includes(order.status)
          : order.status === statusFilter);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aDelivered = a.status === "Delivered";
      const bDelivered = b.status === "Delivered";

      // Keep delivered orders after unfinished orders.
      if (aDelivered !== bDelivered) {
        return aDelivered ? 1 : -1;
      }

      // Orders with a delivery date come first.
      if (!a.deliveryDate && b.deliveryDate) return 1;
      if (a.deliveryDate && !b.deliveryDate) return -1;

      // Earliest delivery date first.
      if (a.deliveryDate && b.deliveryDate) {
        const dateDifference = a.deliveryDate.localeCompare(
          b.deliveryDate
        );

        if (dateDifference !== 0) return dateDifference;
      }

      // Newer orders first when delivery dates are the same.
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    });

  const totalBalance = filteredOrders.reduce(
    (sum, order) => sum + Math.max(0, Number(order.balance || 0)),
    0
  );

  return (
    <section className="orders-page">
      {loading && (
  <p className="orders-message">Loading orders...</p>
)}

{error && (
  <p className="orders-error" role="alert">
    {error}
  </p>
)}
      <div className="orders-heading">
        <div>
          <span className="orders-eyebrow">STITCHING WORK</span>
          <h1>Orders</h1>
          <p>Track each customer's stitching work and payment balance.</p>
        </div>

        <button className="primary-button" onClick={openAddForm}>
          <Plus size={18} />
          Add
        </button>
      </div>

      <div className="orders-summary-grid">
        <SummaryCard
          icon={<Shirt />}
          label="Total orders"
          value={orders.length}
          color="purple"
        />
        <SummaryCard
          icon={<Clock3 />}
          label="In Progress"
          value={orders.filter((order) =>
            ["Pending", "In Progress"].includes(order.status)
          ).length}
          color="blue"
        />
        <SummaryCard
          icon={<CheckCircle2 />}
          label="Ready"
          value={orders.filter((order) =>
            ["Ready", "Ready for Delivery"].includes(order.status)
          ).length}
          color="green"
        />
        <SummaryCard
          icon={<IndianRupee />}
          label="Balance in List"
          value={formatMoney(totalBalance)}
          color="orange"
        />
      </div>

      <div className="orders-list-card">
        <div className="orders-list-heading">
          <div>
            <h2>All Orders</h2>
            <p>Find a customer and update the stitching status.</p>
          </div>
          <span className="orders-count">
            {filteredOrders.length}{" "}
            {filteredOrders.length === 1 ? "order" : "orders"}
          </span>
        </div>

        <div className="orders-filters">
          <div className="orders-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search customer or order..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            aria-label="Filter by stitching status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="orders-empty">
            <div className="orders-empty-icon">
              {search || statusFilter !== "All" ? (
                <Search size={29} />
              ) : (
                <Shirt size={29} />
              )}
            </div>
            <h3>
              {search || statusFilter !== "All"
                ? "No matching orders"
                : "No order orders yet"}
            </h3>
            <p>
              {search || statusFilter !== "All"
                ? "Try a different search or status."
                : customers.length === 0
                  ? "Add a customer first, then create their first order."
                  : "Add the first order to start tracking your stitching work."}
            </p>
            {!search && statusFilter === "All" && customers.length > 0 && (
              <button className="primary-button" onClick={openAddForm}>
                <Plus size={18} />
                Add First order
              </button>
            )}
          </div>
        ) : (
          <div className="blouse-order-list">
            {filteredOrders.map((order) => {
              const urgency = getDeliveryUrgency(order);

              return (
                <article className="blouse-order-card" key={order.id}>
                  <div className="blouse-order-top">
                    <div className="blouse-order-icon">
                      <Shirt size={22} />
                    </div>

                    <div className="blouse-order-customer">
                      <h3>{order.customerName || "Customer"}</h3>
                      <p>
                        <UserRound size={13} />
                        {order.phone || "No phone number"}
                      </p>
                    </div>

                    <span
                      className={`order-status-badge ${statusClass(order.status)}`}
                    >
                      {order.status || "Pending"}
                    </span>
                  </div>

                  <div className="blouse-order-description">
                    <strong>{order.garment || "Blouse"}</strong>
                    {order.description && <p>{order.description}</p>}
                  </div>

                  <div className="blouse-order-details">
                    <div className="blouse-detail">
                      <span>Delivery date</span>
                      <strong>
                        <CalendarDays size={14} />
                        {order.deliveryDate || "Not set"}
                      </strong>

                      <span
                        className={`delivery-urgency ${urgency.className}`}
                      >
                        {urgency.label}
                      </span>
                    </div>

                    <div className="blouse-detail">
                      <span>Stitching charge</span>
                      <strong>{formatMoney(order.charge)}</strong>
                    </div>

                    <div className="blouse-detail">
                      <span>Paid</span>
                      <strong className="paid-amount">
                        {formatMoney(order.advance ?? order.paid)}
                      </strong>
                    </div>

                    <div className="blouse-detail">
                      <span>Balance</span>
                      <strong
                        className={
                          Number(order.balance || 0) > 0
                            ? "balance-amount"
                            : "paid-amount"
                        }
                      >
                        {formatMoney(order.balance)}
                      </strong>
                    </div>
                  </div>

                  <div className="blouse-order-actions">
                    <label className="order-status-control">
                      <span>Stitching status</span>
                      <select
                        value={order.status || "Pending"}
                        onChange={(event) =>
                          updateStatus(order, event.target.value)
                        }
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="order-action-buttons">
                      <button
                        className="order-edit-button"
                        onClick={() => openEditForm(order)}
                      >
                        <Pencil size={15} />
                        Edit
                      </button>
                      <button
                        className="order-delete-button"
                        aria-label={`Delete ${order.garment} order for ${order.customerName}`}
                        onClick={() => deleteOrder(order)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div
          className="order-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <div
            className="order-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-form-title"
          >
            <div className="order-modal-heading">
              <div>
                <span className="orders-eyebrow">
                  {editingOrder ? "UPDATE STITCHING WORK" : "NEW STITCHING WORK"}
                </span>
                <h2 id="order-form-title">
                  {editingOrder ? "Edit Blouse" : "Add Blouse"}
                </h2>
              </div>
              <button
                className="order-modal-close"
                onClick={closeForm}
                aria-label="Close form"
              >
                <X size={21} />
              </button>
            </div>

            {customers.length === 0 ? (
              <div className="order-no-customers">
                <Users size={28} />
                <h3>Add a customer first</h3>
                <p>
                  Go to Customers and save the customer's details before
                  creating a blouse order.
                </p>
                <button className="customer-cancel-button" onClick={closeForm}>
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <label className="order-field">
                  Customer <span>*</span>
                  <select
                    value={form.customerId}
                    onChange={(event) =>
                      setForm({ ...form, customerId: event.target.value })
                    }
                    required
                  >
                    <option value="">Select a customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={String(customer.id)}>
                        {customer.name}
                        {customer.phone ? ` · ${customer.phone}` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="order-field">
                  Garment name <span>*</span>
                  <input
                    type="text"
                    value={form.garment}
                    onChange={(event) =>
                      setForm({ ...form, garment: event.target.value })
                    }
                    placeholder="e.g. Blouse"
                    required
                  />
                </label>

                <label className="order-field">
                  Description
                  <span className="order-optional">(Optional)</span>
                  <textarea
                    rows="2"
                    value={form.description}
                    onChange={(event) =>
                      setForm({ ...form, description: event.target.value })
                    }
                    placeholder="e.g. Green silk blouse with gold border"
                  />
                </label>

                <label className="order-field">
                  Delivery date
                  <span className="order-optional">(Optional)</span>
                  <input
                    type="date"
                    value={form.deliveryDate}
                    onChange={(event) =>
                      setForm({ ...form, deliveryDate: event.target.value })
                    }
                  />
                </label>

                <div className="order-form-two-columns">
                  <label className="order-field">
                    Stitching charge (₹) <span>*</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.charge}
                      onChange={(event) =>
                        setForm({ ...form, charge: event.target.value })
                      }
                      placeholder="e.g. 500"
                      required
                    />
                  </label>

                  <label className="order-field">
                    Amount paid (₹)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.paid}
                      onChange={(event) =>
                        setForm({ ...form, paid: event.target.value })
                      }
                      required
                    />
                  </label>
                </div>

                <div className="order-balance-preview">
                  <span>Remaining balance</span>
                  <strong>
                    {formatMoney(
                      Math.max(
                        0,
                        Number(form.charge || 0) - Number(form.paid || 0)
                      )
                    )}
                  </strong>
                </div>

                <label className="order-field">
                  Stitching status
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm({ ...form, status: event.target.value })
                    }
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                {error && <p className="order-form-error">{error}</p>}

                <div className="order-form-actions">
                  <button
                    type="button"
                    className="customer-cancel-button"
                    onClick={closeForm}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="primary-button">
                    {editingOrder ? "Save Changes" : "Save Blouse"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function SummaryCard({ icon, label, value, color }) {
  return (
    <div className="orders-summary-card">
      <div className={`orders-summary-icon ${color}`}>{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}



