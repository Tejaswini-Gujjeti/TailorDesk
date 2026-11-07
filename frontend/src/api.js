
const API_BASE_URL = "http://localhost:8000/api";


async function apiFetch(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});

  if (!["GET", "HEAD", "OPTIONS", "TRACE"].includes(method)) {
    const csrfCookie = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("csrftoken="));

    if (csrfCookie) {
      headers.set(
        "X-CSRFToken",
        decodeURIComponent(csrfCookie.split("=").slice(1).join("="))
      );
    }
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
}


export async function getCsrfToken() {
  const response = await apiFetch(`${API_BASE_URL}/auth/csrf/`);

  if (!response.ok) {
    throw new Error("Failed to initialize security token.");
  }

  return true;
}



// -------------------- CUSTOMERS --------------------

export async function getCustomers() {
  const response = await fetch(`${API_BASE_URL}/customers/`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to load customers.");
  }

  return response.json();
}


export async function createCustomer(customer) {
  const response = await apiFetch(`${API_BASE_URL}/customers/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(customer),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      Object.values(error).flat().join(" ") || "Failed to add customer."
    );
  }

  return response.json();
}

export async function updateCustomer(id, customer) {
  const response = await apiFetch(`${API_BASE_URL}/customers/${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(customer),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      Object.values(error).flat().join(" ") || "Failed to update customer."
    );
  }

  return response.json();
}


export async function deleteCustomer(id) {
  const response = await apiFetch(`${API_BASE_URL}/customers/${id}/`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to delete customer (${response.status}): ${errorText}`
    );
  }
}


// -------------------- ORDERS --------------------

export async function getOrders() {
  const response = await apiFetch(`${API_BASE_URL}/orders/`);

  if (!response.ok) {
    throw new Error("Failed to load orders.");
  }

  return response.json();
}

export async function createOrder(order) {
  const response = await apiFetch(`${API_BASE_URL}/orders/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      Object.values(error).flat().join(" ") || "Failed to add order."
    );
  }

  return response.json();
}

export async function updateOrder(id, order) {
  const response = await apiFetch(`${API_BASE_URL}/orders/${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      Object.values(error).flat().join(" ") || "Failed to update order."
    );
  }

  return response.json();
}
export async function deleteOrder(id) {
  const response = await apiFetch(`${API_BASE_URL}/orders/${id}/`, {
    method: "DELETE",
  });

  if (!response.ok) {
    let message = "Failed to delete order.";

    try {
      const data = await response.json();
      message = data.error || data.detail || message;
    } catch {
      // Keep the default error message if no JSON response is available.
    }

    throw new Error(message);
  }
}

 // -------------------- PAYMENTS --------------------

export async function getPayments() {
  const response = await apiFetch(`${API_BASE_URL}/payments/`);

  if (!response.ok) {
    throw new Error("Failed to load payments.");
  }

  return response.json();
}

export async function createPayment(payment) {
  const response = await apiFetch(`${API_BASE_URL}/payments/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payment),
  });

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      Object.values(error).flat().join(" ") ||
        "Failed to record payment."
    );
  }

  return response.json();
}

export async function updatePayment(id, payment) {
  const response = await apiFetch(`${API_BASE_URL}/payments/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payment),
  });

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      Object.values(error).flat().join(" ") ||
        "Failed to update payment."
    );
  }

  return response.json();
}

export async function deletePayment(id) {
  const response = await apiFetch(`${API_BASE_URL}/payments/${id}/`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete payment.");
  }
}



export async function getMeasurements() {
  const response = await apiFetch(`${API_BASE_URL}/measurements/`);

  if (!response.ok) {
    throw new Error("Failed to load measurements.");
  }

  return response.json();
}

export async function createMeasurement(measurement) {
  const response = await apiFetch(`${API_BASE_URL}/measurements/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(measurement),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      Object.values(error).flat().join(" ") ||
        "Failed to save measurements."
    );
  }

  return response.json();
}




export async function updateMeasurement(id, measurement) {
  const response = await apiFetch(`${API_BASE_URL}/measurements/${id}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(measurement),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      Object.values(error).flat().join(" ") ||
        "Failed to update measurements."
    );
  }

  return response.json();
}


export async function deleteMeasurement(id) {
  const response = await apiFetch(`${API_BASE_URL}/measurements/${id}/`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to delete measurement (${response.status}): ${errorText}`
    );
  }
}



export async function registerUser(userData) {
  await getCsrfToken();

  const response = await apiFetch(`${API_BASE_URL}/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      Object.values(data).flat().join(" ") || "Registration failed."
    );
  }

  return data;
}

export async function loginUser(credentials) {
  await getCsrfToken();

  const response = await apiFetch(`${API_BASE_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Login failed.");
  }

  return data;
}

export async function logoutUser() {
  const response = await apiFetch(`${API_BASE_URL}/auth/logout/`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Logout failed.");
  }

  return response.json();
}

export async function getCurrentUser() {
  const response = await apiFetch(`${API_BASE_URL}/auth/me/`);

  if (!response.ok) {
    return null;
  }

  return response.json();
}



export async function getReportSummary(startDate, endDate) {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });

  const response = await apiFetch(
    `${API_BASE_URL}/reports/summary/?${params.toString()}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load reports.");
  }

  return data;
}
