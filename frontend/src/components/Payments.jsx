
import { useEffect, useState } from "react";
import {
  IndianRupee,
  Search,
  CreditCard,
  Wallet,
  CheckCircle2,
  Clock,
  Plus,
  X,
} from "lucide-react";

import {
  getCustomers,
  getOrders,
  getPayments,
  createPayment,
  deletePayment,
} from "../api";
import "./Payments.css";



function getPaid(order) {
  return Number(order.paid ?? order.advance ?? 0);
}

function getBalance(order) {
  return Math.max(0, Number(order.charge || 0) - getPaid(order));
}

function getPaymentStatus(order) {
  const paid = getPaid(order);
  const charge = Number(order.charge || 0);

  if (paid >= charge && charge > 0) return "Fully Paid";
  if (paid > 0) return "Partially Paid";
  return "Unpaid";
}

function Payments() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  
async function loadData() {
  try {
    setError("");

    const [customerData, orderData, paymentData] = await Promise.all([
      getCustomers(),
      getOrders(),
      getPayments(),
    ]);

    setCustomers(customerData);

    const updatedOrders = orderData.map((order) => {
      const orderPayments = paymentData.filter(
        (payment) => String(payment.order) === String(order.id)
      );

      const paid = orderPayments.reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0
      );

      return {
        ...order,
        customerId: order.customer,
        customerName: order.customer_name,
        phone: order.customer_phone,
        deliveryDate: order.delivery_date || "",
        createdAt: order.created_at,
        paid,
        advance: paid,
        balance: Math.max(0, Number(order.charge || 0) - paid),
        payments: orderPayments.map((payment) => ({
          id: payment.id,
          amount: payment.amount,
          date: payment.payment_date,
          note: payment.notes,
        })),
      };
    });

    setOrders(updatedOrders);
  } catch (error) {
    setError(error.message || "Failed to load payment data.");
  }
}

useEffect(() => {
  loadData();

  const handleUpdate = () => loadData();
  window.addEventListener("tailordesk-updated", handleUpdate);

  return () => {
    window.removeEventListener("tailordesk-updated", handleUpdate);
  };
}, []);


  const orderRows = orders.map((order) => {
    const customer = customers.find(
      (item) => String(item.id) === String(order.customerId)
    );

    return {
      ...order,
      customerName: customer?.name || order.customerName || "Unknown Customer",
      phone: customer?.phone || order.phone || "",
      paid: getPaid(order),
      balance: getBalance(order),
      paymentStatus: getPaymentStatus(order),
    };
  });

  const filteredOrders = orderRows.filter((order) => {
    const searchText = [
      order.customerName,
      order.phone,
      order.garment,
      order.description,
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchText.includes(search.toLowerCase());
    const matchesFilter =
      filter === "All" || order.paymentStatus === filter;

    return matchesSearch && matchesFilter;
  });

  const totalCharge = orderRows.reduce(
    (sum, order) => sum + Number(order.charge || 0),
    0
  );

  const totalPaid = orderRows.reduce(
    (sum, order) => sum + order.paid,
    0
  );

  const totalBalance = orderRows.reduce(
    (sum, order) => sum + order.balance,
    0
  );

  function openPayment(order) {
    setSelectedOrder(order);
    setAmount("");
    setError("");
  }

 
async function recordPayment(event) {
  event.preventDefault();

  const paymentAmount = Number(amount);

  if (!selectedOrder) return;

  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
    setError("Enter a valid payment amount.");
    return;
  }

  const currentOrder = orders.find(
    (order) => String(order.id) === String(selectedOrder.id)
  );

  if (!currentOrder) {
    setError("This order could not be found. Please refresh the page.");
    return;
  }

  const balanceBefore = getBalance(currentOrder);

  if (paymentAmount > balanceBefore) {
    setError(
      `The remaining balance is ₹${balanceBefore.toLocaleString("en-IN")}.`
    );
    return;
  }

  try {
    setError("");

    await createPayment({
      order: currentOrder.id,
      amount: paymentAmount.toFixed(2),
      notes: "",
    });

    await loadData();

    window.dispatchEvent(new Event("tailordesk-updated"));

    setSelectedOrder(null);
    setAmount("");
  } catch (error) {
    setError(error.message || "Failed to record payment.");
  }
}


async function deleteRecordedPayment(order, payment) {
  const confirmed = window.confirm(
    `Delete this payment of ₹${Number(payment.amount).toLocaleString("en-IN")} for ${order.customerName}?`
  );

  if (!confirmed) return;

  try {
    setError("");

    await deletePayment(payment.id);
    await loadData();

    window.dispatchEvent(new Event("tailordesk-updated"));
  } catch (err) {
    const message = err.message || "Failed to delete payment.";
    setError(message);
    window.alert(message);
  }
}


  return (
    <div className="payments-page">
      <div className="payments-heading">
        <div>
          <p className="payments-eyebrow">FINANCIAL OVERVIEW</p>
          <h1>Payments</h1>
          <p>Track stitching charges, payments received, and outstanding balances.</p>
        </div>
      </div>
      {error && (
  <div className="payment-error" role="alert">
    {error}
  </div>
)}
      <div className="payment-summary">
        <div className="payment-summary-card">
          <div className="payment-summary-icon purple">
            <IndianRupee size={21} />
          </div>
          <p>Total Charges</p>
          <h2>₹{totalCharge.toLocaleString("en-IN")}</h2>
        </div>

        <div className="payment-summary-card">
          <div className="payment-summary-icon green">
            <CheckCircle2 size={21} />
          </div>
          <p>Amount Received</p>
          <h2>₹{totalPaid.toLocaleString("en-IN")}</h2>
        </div>

        <div className="payment-summary-card">
          <div className="payment-summary-icon orange">
            <Wallet size={21} />
          </div>
          <p>Balance Due</p>
          <h2>₹{totalBalance.toLocaleString("en-IN")}</h2>
        </div>
      </div>

      <div className="payments-toolbar">
        <div className="payments-search">
          <Search size={19} />
          <input
            type="search"
            placeholder="Search customer or blouse..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          aria-label="Filter by payment status"
        >
          <option value="All">All Payments</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Partially Paid">Partially Paid</option>
          <option value="Fully Paid">Fully Paid</option>
        </select>
      </div>

      <div className="payments-list">
        {filteredOrders.length === 0 ? (
          <div className="payments-empty">
            <CreditCard size={36} />
            <h3>No payment records found</h3>
            <p>Add a blouse order first, or try another search.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div className="payment-order-card" key={order.id}>
              <div className="payment-order-top">
                <div className="payment-customer-avatar">
                  {order.customerName.charAt(0).toUpperCase()}
                </div>

                <div className="payment-customer-info">
                  <h3>{order.customerName}</h3>
                  <p>
                    {order.garment || "Blouse"}
                    {order.description ? ` · ${order.description}` : ""}
                  </p>
                  {order.phone && <span>{order.phone}</span>}
                </div>

                <span
                  className={`payment-status ${order.paymentStatus
                    .toLowerCase()
                    .replaceAll(" ", "-")}`}
                >
                  {order.paymentStatus}
                </span>
              </div>

              <div className="payment-amount-grid">
                <div>
                  <span>Total Charge</span>
                  <strong>₹{Number(order.charge || 0).toLocaleString("en-IN")}</strong>
                </div>

                <div>
                  <span>Amount Paid</span>
                  <strong className="amount-received">
                    ₹{order.paid.toLocaleString("en-IN")}
                  </strong>
                </div>

                <div>
                  <span>Remaining</span>
                  <strong className="amount-due">
                    ₹{order.balance.toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>

              <div className="payment-progress">
                <div
                  className="payment-progress-fill"
                  style={{
                    width: `${
                      Number(order.charge) > 0
                        ? Math.min(100, (order.paid / Number(order.charge)) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>

              <div className="payment-order-footer">
                <span>
                  {order.payments?.length
                    ? `${order.payments.length} payment record(s)`
                    : "No payment history available"}
                </span>

                {order.balance > 0 && (
                  <button
                    className="record-payment-button"
                    onClick={() => openPayment(order)}
                  >
                    <Plus size={17} />
                    Record Payment
                  </button>
                )}

                {order.balance === 0 && order.charge > 0 && (
                  <span className="fully-paid-label">
                    <CheckCircle2 size={16} /> Fully settled
                  </span>
                )}
              </div>

              {order.payments?.length > 0 && (
                <details className="payment-history">
                  <summary>View payment history</summary>
                  <div className="payment-history-list">
                   
{order.payments.map((payment) => (
  <div className="payment-history-row" key={payment.id}>
    <span>
      {payment.date
        ? new Date(payment.date).toLocaleDateString("en-IN")
        : "Date unavailable"}
      {payment.note ? ` · ${payment.note}` : ""}
    </span>

    <strong>
      +₹{Number(payment.amount).toLocaleString("en-IN")}
    </strong>

    <button
      type="button"
      className="delete-payment-button"
      onClick={() => deleteRecordedPayment(order, payment)}
    >
      Delete
    </button>
  </div>
))}

                  </div>
                </details>
              )}
            </div>
          ))
        )}
      </div>

      {selectedOrder && (
        <div
          className="payment-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedOrder(null);
            }
          }}
        >
          <div
            className="payment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
          >
            <div className="payment-modal-heading">
              <div>
                <p className="payments-eyebrow">UPDATE BALANCE</p>
                <h2 id="payment-modal-title">Record Payment</h2>
                <p>{selectedOrder.customerName} · {selectedOrder.garment || "Blouse"}</p>
              </div>

              <button
                className="payment-close-button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close payment form"
              >
                <X size={20} />
              </button>
            </div>

            <div className="payment-modal-balance">
              <span>Remaining balance</span>
              <strong>
                ₹{getBalance(
                  orders.find(
                    (order) => String(order.id) === String(selectedOrder.id)
                  ) || selectedOrder
                ).toLocaleString("en-IN")}
              </strong>
            </div>

            <form onSubmit={recordPayment}>
              <label htmlFor="payment-amount">Amount received (₹)</label>
              <input
                id="payment-amount"
                type="number"
                min="0.01"
                step="0.01"
                max={getBalance(selectedOrder)}
                placeholder="Enter amount"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                  setError("");
                }}
                required
              />

              {error && <p className="payment-form-error">{error}</p>}

              <div className="payment-modal-actions">
                <button
                  type="button"
                  className="payment-cancel-button"
                  onClick={() => setSelectedOrder(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="record-payment-button">
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payments;
