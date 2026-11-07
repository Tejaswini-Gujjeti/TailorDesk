
import { useEffect, useState } from "react";
import { IndianRupee, ShoppingBag, ReceiptText, Wallet } from "lucide-react";
import { getReportSummary } from "../api";
import "./Reports.css";

export default function Reports() {
  const [startDate, setStartDate] = useState("2026-10-01");
  const [endDate, setEndDate] = useState("2026-10-28");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      if (!startDate || !endDate) {
        setReport(null);
        setError("Please select both dates.");
        return;
      }

      if (startDate > endDate) {
        setReport(null);
        setError("From Date cannot be after To Date.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await getReportSummary(startDate, endDate);

        if (!cancelled) {
          setReport(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load reports.");
          setReport(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReport();

    return () => {
      cancelled = true;
    };
  }, [startDate, endDate]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));

  const reportCards = [
    {
      label: "Orders Received",
      value: report?.total_orders ?? 0,
      icon: ShoppingBag,
      description: "Orders created in this period",
    },
    {
      label: "Total Order Value",
      value: formatCurrency(report?.total_order_value),
      icon: IndianRupee,
      description: "Total charges for those orders",
    },
    {
      label: "Payments Received",
      value: formatCurrency(report?.total_received),
      icon: Wallet,
      description: "Money collected in this period",
    },
    {
      label: "Payment Transactions",
      value: report?.total_payments ?? 0,
      icon: ReceiptText,
      description: "Payments recorded in this period",
    },
  ];

  return (
    <section className="reports-page">
      <div className="reports-heading">
        <span className="reports-eyebrow">BUSINESS OVERVIEW</span>
        <h1>Reports</h1>
        <p>
          Track payments received and stitching orders
          for your selected date range.
        </p>
      </div>

      <section className="reports-filter-card">
        <div className="reports-filter-heading">
          <h2>Select Date Range</h2>
          <p>Choose the period you want to review.</p>
        </div>

        <div className="reports-date-filters">
          <div className="report-date-field">
            <label htmlFor="report-start-date">From Date</label>
            <input
              id="report-start-date"
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>

          <div className="report-date-field">
            <label htmlFor="report-end-date">To Date</label>
            <input
              id="report-end-date"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
        </div>
      </section>

      {error && (
        <p className="reports-error" role="alert">
          {error}
        </p>
      )}

      <div className="reports-results-heading">
        <div>
          <h2>Report Summary</h2>
          <p>
            {startDate && endDate
              ? `${startDate} to ${endDate}`
              : "Select a date range"}
          </p>
        </div>
        {loading && <span className="reports-loading">Updating...</span>}
      </div>

      <div className="reports-summary-grid">
        {reportCards.map((card) => {
          const Icon = card.icon;

          return (
            <article className="reports-summary-card" key={card.label}>
              <div className="reports-card-top">
                <span className="reports-card-icon">
                  <Icon size={19} />
                </span>
              </div>

              <p className="reports-card-label">{card.label}</p>

              <h3>
                {loading && !report ? "Loading..." : card.value}
              </h3>

              <p className="reports-card-description">
                {card.description}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
