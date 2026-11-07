
import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Phone,
  X,
  UserRound,
  ArrowLeft,
  Pencil,
} from "lucide-react";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer as deleteCustomerFromAPI,
} from "../api";
import "./Customers.css";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  // Load customers from Django when the page opens.
  useEffect(() => {
    async function loadData() {
      try {
        const data = await getCustomers();

        setCustomers(
          data.map((customer) => ({
            ...customer,
            createdAt: customer.created_at,
          }))
        );
      } catch (err) {
        setError(
          err.message || "Unable to load customers. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function resetForm() {
    setForm({ name: "", phone: "", address: "" });
    setEditingId(null);
    setShowForm(false);
    setError("");
  }

  function openAddForm() {
    setForm({ name: "", phone: "", address: "" });
    setEditingId(null);
    setError("");
    setShowForm(true);
  }

  function openEditForm(customer) {
    setSelectedCustomer(null);
    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      address: customer.address || "",
    });
    setEditingId(customer.id);
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const name = form.name.trim();
    const phone = form.phone.trim();
    const address = form.address.trim();

    if (!name) {
      setError("Please enter the customer's name.");
      return;
    }

    if (phone && !/^[+\d\s()-]{7,20}$/.test(phone)) {
      setError("Please enter a valid phone number.");
      return;
    }

    const duplicate = customers.some(
      (customer) =>
        String(customer.id) !== String(editingId) &&
        phone &&
        customer.phone?.replace(/\D/g, "") === phone.replace(/\D/g, "")
    );

    if (duplicate) {
      setError(
        "This phone number is already saved. Search for that customer instead."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingId !== null) {
        const updated = await updateCustomer(editingId, {
          name,
          phone,
          address,
        });

        const updatedCustomer = {
          ...updated,
          createdAt: updated.created_at,
        };

        setCustomers((previous) =>
          previous.map((customer) =>
            String(customer.id) === String(editingId)
              ? updatedCustomer
              : customer
          )
        );

        setSelectedCustomer((previous) =>
          previous && String(previous.id) === String(editingId)
            ? updatedCustomer
            : previous
        );
      } else {
        const created = await createCustomer({
          name,
          phone,
          address,
        });

        const newCustomer = {
          ...created,
          createdAt: created.created_at,
        };

        setCustomers((previous) =>
          [newCustomer, ...previous].sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        );
      }

      resetForm();
      window.dispatchEvent(new Event("tailordesk-updated"));
    } catch (err) {
      setError(err.message || "Unable to save customer.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCustomer(customer) {
    const confirmed = window.confirm(
      `Delete ${customer.name} from your customer list? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteCustomerFromAPI(customer.id);

      setCustomers((previous) =>
        previous.filter((item) => item.id !== customer.id)
      );

      setSelectedCustomer(null);
      window.dispatchEvent(new Event("tailordesk-updated"));
    } catch (err) {
      window.alert(
        err.message ||
          "Unable to delete customer. They may have existing orders."
      );
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const search = searchTerm.toLowerCase().trim();

    return (
      (customer.name || "").toLowerCase().includes(search) ||
      (customer.phone || "").toLowerCase().includes(search)
    );
  });

  if (selectedCustomer) {
    const customer = customers.find(
      (item) => String(item.id) === String(selectedCustomer.id)
    );

    if (customer) {
      return (
        <section className="customers-page">
          <button
            className="customer-back-button"
            onClick={() => setSelectedCustomer(null)}
          >
            <ArrowLeft size={17} />
            Back to Customers
          </button>

          <div className="customer-profile-card">
            <div className="customer-profile-top">
              <div className="customer-avatar customer-avatar-large">
                <UserRound size={29} />
              </div>

              <div className="customer-profile-info">
                <span className="customer-eyebrow">CUSTOMER DETAILS</span>
                <h1>{customer.name}</h1>
                <p>{customer.phone || "No phone number added"}</p>
              </div>

              <button
                className="customer-secondary-button"
                onClick={() => openEditForm(customer)}
              >
                <Pencil size={16} />
                Edit
              </button>
            </div>

            <div className="customer-detail-row">
              <span>Phone number</span>
              <strong>{customer.phone || "Not added"}</strong>
            </div>

            <div className="customer-detail-row">
              <span>Address</span>
              <strong>{customer.address || "Not added"}</strong>
            </div>

            <div className="customer-detail-row">
              <span>Customer since</span>
              <strong>
                {customer.createdAt
                  ? new Date(customer.createdAt).toLocaleDateString("en-IN")
                  : "Date not available"}
              </strong>
            </div>

            <div className="customer-profile-note">
              <Users size={19} />
              <div>
                <strong>Customer saved successfully</strong>
                <p>
                  When adding a blouse, choose this customer to reuse these
                  details. You won't need to enter their name again.
                </p>
              </div>
            </div>

            <button
              className="customer-delete-button"
              onClick={() => deleteCustomer(customer)}
            >
              Delete customer
            </button>
          </div>

          {showForm && (
            <CustomerForm
              form={form}
              setForm={setForm}
              error={error}
              onSubmit={handleSubmit}
              onCancel={resetForm}
              editing={editingId !== null}
              saving={saving}
            />
          )}
        </section>
      );
    }
  }

  return (
    <section className="customers-page">
      <div className="customers-heading">
        <div>
          <span className="customer-eyebrow">YOUR CUSTOMER BOOK</span>
          <h1>Customers</h1>
          <p>Save customer details once and find them whenever needed.</p>
        </div>

        <button className="primary-button" onClick={openAddForm}>
          <Plus size={18} />
          Add Customer
        </button>
      </div>

      <div className="customer-summary">
        <div className="customer-summary-icon">
          <Users size={23} />
        </div>
        <div>
          <span>Total Customers</span>
          <strong>{customers.length}</strong>
        </div>
      </div>

      <div className="customers-list-card">
        <div className="customers-list-heading">
          <div>
            <h2>Customer List</h2>
            <p>Tap a customer to view their saved details.</p>
          </div>
        </div>

        <div className="customer-search">
          <Search size={19} />
          <input
            type="search"
            placeholder="Search by name or phone number..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />

          {searchTerm && (
            <button
              aria-label="Clear search"
              onClick={() => setSearchTerm("")}
            >
              <X size={17} />
            </button>
          )}
        </div>

        {loading ? (
          <div className="customers-empty">
            <p>Loading customers...</p>
          </div>
        ) : error && customers.length === 0 ? (
          <div className="customers-empty">
            <h3>Unable to load customers</h3>
            <p>{error}</p>
            <button
              className="primary-button"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="customers-empty">
            <div className="customers-empty-icon">
              {searchTerm ? <Search size={29} /> : <Users size={29} />}
            </div>

            <h3>
              {searchTerm ? "No customer found" : "No customers added yet"}
            </h3>

            <p>
              {searchTerm
                ? "Try searching with a different name or phone number."
                : "Add your first customer to start keeping track of stitching orders."}
            </p>

            {!searchTerm && (
              <button className="primary-button" onClick={openAddForm}>
                <Plus size={18} />
                Add First Customer
              </button>
            )}
          </div>
        ) : (
          <div className="customer-list">
            {filteredCustomers.map((customer) => (
              <div className="customer-list-item" key={customer.id}>
                <button
                  className="customer-open-button"
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <div className="customer-avatar">
                    <UserRound size={21} />
                  </div>

                  <div className="customer-list-info">
                    <strong>{customer.name}</strong>
                    <span>
                      <Phone size={13} />
                      {customer.phone || "No phone number"}
                    </span>
                  </div>
                </button>

                <button
                  className="customer-edit-icon"
                  aria-label={`Edit ${customer.name}`}
                  onClick={() => openEditForm(customer)}
                >
                  <Pencil size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredCustomers.length > 0 && (
          <div className="customer-list-footer">
            Showing {filteredCustomers.length} of {customers.length} customers
          </div>
        )}
      </div>

      {showForm && (
        <CustomerForm
          form={form}
          setForm={setForm}
          error={error}
          onSubmit={handleSubmit}
          onCancel={resetForm}
          editing={editingId !== null}
          saving={saving}
        />
      )}
    </section>
  );
}

function CustomerForm({
  form,
  setForm,
  error,
  onSubmit,
  onCancel,
  editing,
  saving,
}) {
  return (
    <div
      className="customer-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        className="customer-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-form-title"
      >
        <div className="customer-modal-heading">
          <div>
            <span className="customer-eyebrow">
              {editing ? "UPDATE DETAILS" : "NEW CUSTOMER"}
            </span>
            <h2 id="customer-form-title">
              {editing ? "Edit Customer" : "Add Customer"}
            </h2>
          </div>

          <button
            className="customer-modal-close"
            aria-label="Close form"
            onClick={onCancel}
          >
            <X size={21} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <label className="customer-field">
            Customer Name <span>*</span>
            <input
              autoFocus
              type="text"
              placeholder="Enter full name"
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              required
            />
          </label>

          <label className="customer-field">
            Phone Number
            <input
              type="tel"
              placeholder="Enter phone number"
              value={form.phone}
              onChange={(event) =>
                setForm({ ...form, phone: event.target.value })
              }
            />
          </label>

          <label className="customer-field">
            Address <span className="optional-label">(Optional)</span>
            <textarea
              rows="3"
              placeholder="Enter address if needed"
              value={form.address}
              onChange={(event) =>
                setForm({ ...form, address: event.target.value })
              }
            />
          </label>

          {error && <p className="customer-form-error">{error}</p>}

          <div className="customer-form-actions">
            <button
              type="button"
              className="customer-cancel-button"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editing
                  ? "Save Changes"
                  : "Save Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
