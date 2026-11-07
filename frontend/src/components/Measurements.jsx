import { useEffect, useState } from "react";
import {
  Ruler,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Save,
  UserRound,
} from "lucide-react";
import {
  getCustomers,
  getOrders,
  getMeasurements,
  createMeasurement,
  updateMeasurement,
  deleteMeasurement as deleteMeasurementFromAPI,
} from "../api";
import "./Measurements.css";

const CUSTOMERS_KEY = "tailordesk_customers";
const ORDERS_KEY = "tailordesk_orders";
const MEASUREMENTS_KEY = "tailordesk_measurements";

const FIELDS = [
  { key: "chest", label: "Chest" },
  { key: "waist", label: "Waist" },
  { key: "shoulder", label: "Shoulder" },
  { key: "blouse_length", label: "Blouse Length" },
  { key: "sleeve_length", label: "Sleeve Length" },
  { key: "sleeve_round", label: "Sleeve Round" },
  { key: "armhole", label: "Armhole" },
  { key: "neck_depth", label: "Neck Depth" },
];
const emptyForm = {
  customerId: "",
  orderId: "",
  chest: "",
  waist: "",
  shoulder: "",
  blouse_length: "",
  sleeve_length: "",
  sleeve_round: "",
  armhole: "",
  neck_depth: "",
  notes: "",
};
function readArray(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function Measurements() {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  async function loadData() {
  try {
    const [customersData, ordersData, measurementsData] =
      await Promise.all([
        getCustomers(),
        getOrders(),
        getMeasurements(),
      ]);

    setCustomers(customersData);
    setOrders(
      ordersData.map((order) => ({
        ...order,
        customerId: String(order.customer),
      }))
    );

    setMeasurements(
      measurementsData.map((measurement) => ({
        ...measurement,
        customerId: String(measurement.customer),
        orderId: String(measurement.order),
        customerName: measurement.customer_name,
        createdAt: measurement.created_at,
        updatedAt: measurement.updated_at,
      }))
    );
  } catch (error) {
    console.error("Failed to load measurements data:", error);
    setError(error.message || "Failed to load measurements.");
  }
}

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener("tailordesk-updated", handleUpdate);

    return () =>
      window.removeEventListener("tailordesk-updated", handleUpdate);
  }, []);

  const customerOrders = orders.filter(
    (order) => String(order.customerId) === String(form.customerId)
  );

  const visibleMeasurements = measurements
    .map((measurement) => {
      const customer = customers.find(
        (item) => String(item.id) === String(measurement.customerId)
      );
      const order = orders.find(
        (item) => String(item.id) === String(measurement.orderId)
      );

      return {
        ...measurement,
        customerName:
          customer?.name || measurement.customerName || "Unknown Customer",
        garment: order?.garment || measurement.garment || "Blouse",
        description: order?.description || measurement.description || "",
      };
    })
    .filter((measurement) => {
      const text = [
        measurement.customerName,
        measurement.garment,
        measurement.description,
        measurement.notes,
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(search.toLowerCase());
    })
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0) -
        new Date(a.updatedAt || a.createdAt || 0)
    );

  function openAddForm() {
    setEditingId(null);
    setError("");
    setForm({ ...emptyForm });
    setShowForm(true);
  }

  function openEditForm(measurement) {
    setEditingId(measurement.id);
    setError("");
    setForm({
      ...emptyForm,
      ...measurement,
      customerId: String(measurement.customerId),
      orderId: String(measurement.orderId),
    });
    setShowForm(true);
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  }
  async function saveMeasurement(event) {
  event.preventDefault();
  setError("");

  if (!form.customerId || !form.orderId) {
    setError("Please select a customer and order.");
    return;
  }

  const order = orders.find(
    (item) =>
      String(item.id) === String(form.orderId) &&
      String(item.customerId) === String(form.customerId)
  );

  if (!order) {
    setError("Please select a valid order for this customer.");
    return;
  }

  const hasValue = FIELDS.some(
    (field) => String(form[field.key] ?? "").trim() !== ""
  );

  if (!hasValue && !form.notes.trim()) {
    setError("Enter at least one measurement or a stitching note.");
    return;
  }

  for (const field of FIELDS) {
    const value = String(form[field.key] ?? "").trim();

    if (
      value !== "" &&
      (!Number.isFinite(Number(value)) || Number(value) <= 0)
    ) {
      setError(`${field.label} must be a number greater than zero.`);
      return;
    }
  }

  const existingForOrder = measurements.find(
    (item) =>
      String(item.orderId) === String(form.orderId) &&
      String(item.id) !== String(editingId)
  );

  if (existingForOrder) {
    setError(
      "This order already has measurements. Edit its existing record instead."
    );
    return;
  }

  const payload = {
    customer: Number(form.customerId),
    order: Number(form.orderId),
    chest: form.chest || null,
    waist: form.waist || null,
    shoulder: form.shoulder || null,
    blouse_length: form.blouse_length || null,
    sleeve_length: form.sleeve_length || null,
    sleeve_round: form.sleeve_round || null,
    armhole: form.armhole || null,
    neck_depth: form.neck_depth || null,
    notes: form.notes.trim(),
  };

  try {
    if (editingId !== null) {
  await updateMeasurement(editingId, payload);
} else {
  await createMeasurement(payload);
}
    await loadData();

    window.dispatchEvent(new Event("tailordesk-updated"));
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
  } catch (error) {
    console.error("Failed to save measurements:", error);
    setError(error.message || "Failed to save measurements. Please try again.");
  }
}


  
async function deleteMeasurement(id) {
  const confirmed = window.confirm(
    "Delete this measurement record? The order will not be deleted.");

  if (!confirmed) return;

  try {
    await deleteMeasurementFromAPI(id);
    await loadData();

    window.dispatchEvent(new Event("tailordesk-updated"));
    setError("");
  } catch (error) {
    console.error("Failed to delete measurement:", error);
    setError(error.message || "Failed to delete measurement.");
    window.alert(error.message || "Failed to delete measurement.");
  }
}


  return (
    <div className="measurements-page">
      <div className="measurements-heading">
        <div>
          <p className="measurements-eyebrow">STITCHING DETAILS</p>
          <h1>Measurements</h1>
          <p>Keep a separate measurement record for each order.</p>
        </div>

        <button
          className="measurement-add-button"
          onClick={openAddForm}
          disabled={orders.length === 0}
        >
          <Plus size={18} />
          Add Measurements
        </button>
      </div>

      <div className="measurements-info">
        <div className="measurements-info-icon">
          <Ruler size={22} />
        </div>
        <div>
          <strong>Measurements are order-specific</strong>
          <p>
            A new order can have different measurements. Older records
            remain saved for reference.
          </p>
        </div>
      </div>

      <div className="measurements-toolbar">
        <div className="measurements-search">
          <Search size={19} />
          <input
            type="search"
            placeholder="Search customer or stitching notes..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <span className="measurements-count">
          {visibleMeasurements.length} record
          {visibleMeasurements.length === 1 ? "" : "s"}
        </span>
      </div>

      {visibleMeasurements.length === 0 ? (
        <div className="measurements-empty">
          <Ruler size={38} />
          <h3>No measurements saved yet</h3>
          <p>
            Create an order first, then add measurements whenever they
            are needed.
          </p>
          {orders.length > 0 && (
            <button
              className="measurement-add-button"
              onClick={openAddForm}
            >
              <Plus size={17} />
              Add Measurements
            </button>
          )}
        </div>
      ) : (
        <div className="measurements-grid">
          {visibleMeasurements.map((measurement) => (
            <article className="measurement-card" key={measurement.id}>
              <div className="measurement-card-heading">
                <div className="measurement-customer-icon">
                  <UserRound size={21} />
                </div>

                <div className="measurement-customer-details">
                  <h3>{measurement.customerName}</h3>
                  <p>
                    {measurement.garment}
                    {measurement.description
                      ? ` · ${measurement.description}`
                      : ""}
                  </p>
                </div>
              </div>

              <div className="measurement-card-meta">
                <span>
                  Order date:{" "}
                  {measurement.createdAt
                    ? new Date(measurement.createdAt).toLocaleDateString("en-IN")
                    : "Not available"}
                </span>
              </div>

              <div className="measurement-values">
                {FIELDS.filter(
                  (field) =>
                    String(measurement[field.key] ?? "").trim() !== ""
                ).map((field) => (
                  <div className="measurement-value" key={field.key}>
                    <span>{field.label}</span>
                    <strong>{measurement[field.key]}</strong>
                  </div>
                ))}
              </div>

              {measurement.notes && (
                <div className="measurement-notes">
                  <span>Stitching notes</span>
                  <p>{measurement.notes}</p>
                </div>
              )}

              <div className="measurement-card-actions">
                <button
                  className="measurement-edit-button"
                  onClick={() => openEditForm(measurement)}
                >
                  <Pencil size={15} />
                  Edit
                </button>
                <button
                  className="measurement-delete-button"
                  onClick={() => deleteMeasurement(measurement.id)}
                  aria-label={`Delete measurements for ${measurement.customerName}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {showForm && (
        <div
          className="measurement-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowForm(false);
          }}
        >
          <div
            className="measurement-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="measurement-form-title"
          >
            <div className="measurement-modal-heading">
              <div>
                <p className="measurements-eyebrow">ORDER DETAILS</p>
                <h2 id="measurement-form-title">
                  {editingId ? "Edit Measurements" : "Add Measurements"}
                </h2>
                <p>Enter the measurements you need. All measurements are optional.</p>
              </div>

              <button
                className="measurement-close-button"
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveMeasurement}>
              <div className="measurement-form-field">
                <label htmlFor="measurement-customer">Customer *</label>
                <select
                  id="measurement-customer"
                  name="customerId"
                  value={form.customerId}
                  onChange={(event) => {
                    const customerId = event.target.value;
                    setForm((current) => ({
                      ...current,
                      customerId,
                      orderId: "",
                    }));
                    setError("");
                  }}
                  required
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                      {customer.phone ? ` — ${customer.phone}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="measurement-form-field">
                <label htmlFor="measurement-order">Order *</label>
                <select
                  id="measurement-order"
                  name="orderId"
                  value={form.orderId}
                  onChange={updateField}
                  required
                  disabled={!form.customerId}
                >
                  <option value="">Select an order</option>
                  {customerOrders.map((order) => {
                    const existingRecord = measurements.find(
                      (item) =>
                        String(item.orderId) === String(order.id) &&
                        String(item.id) !== String(editingId)
                    );

                    return (
                      <option
                        key={order.id}
                        value={order.id}
                        disabled={Boolean(existingRecord)}
                      >
                        {order.garment || "Order"}
                        {order.description ? ` — ${order.description}` : ""}
                        {order.deliveryDate ? ` · Due ${order.deliveryDate}` : ""}
                        {existingRecord ? " (measurements saved)" : ""}
                      </option>
                    );
                  })}
                </select>
                {form.customerId && customerOrders.length === 0 && (
                  <small>This customer has no orders yet.</small>
                )}
              </div>

              <div className="measurement-units-note">
                Enter all measurements using the same unit, such as inches.
              </div>

              <div className="measurement-fields-grid">
                {FIELDS.map((field) => (
                  <div className="measurement-form-field" key={field.key}>
                    <label htmlFor={`measurement-${field.key}`}>
                      {field.label}
                    </label>
                    <input
                      id={`measurement-${field.key}`}
                      name={field.key}
                      type="number"
                      min="0.1"
                      step="0.1"
                      placeholder="Optional"
                      value={form[field.key] ?? ""}
                      onChange={updateField}
                    />
                  </div>
                ))}
              </div>

              <div className="measurement-form-field">
                <label htmlFor="measurement-notes">Stitching notes</label>
                <textarea
                  id="measurement-notes"
                  name="notes"
                  rows="3"
                  placeholder="e.g. Elbow-length sleeves, deep back neck..."
                  value={form.notes}
                  onChange={updateField}
                />
              </div>

              {error && (
                <p className="measurement-form-error">{error}</p>
              )}

              <div className="measurement-modal-actions">
                <button
                  type="button"
                  className="measurement-cancel-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="measurement-save-button"
                >
                  <Save size={17} />
                  Save Measurements
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Measurements;
