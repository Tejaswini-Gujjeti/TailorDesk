const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api`;


let csrfToken = null;

async function apiFetch(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const isSafeMethod = ["GET", "HEAD", "OPTIONS", "TRACE"].includes(method);

  async function send() {
    const headers = new Headers(options.headers || {});

    if (!isSafeMethod) {
      if (!csrfToken) {
        await getCsrfToken();
      }

      headers.set("X-CSRFToken", csrfToken);
    }

    return fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
  }

  let response = await send();

  // Django rotates the CSRF token on login, so the cached token can go
  // stale. If the server rejects it, fetch a fresh one and retry once.
  if (!isSafeMethod && response.status === 403) {
    const body = await response.clone().text();

    if (body.includes("CSRF")) {
      await getCsrfToken();
      response = await send();
    }
  }

  return response;
}

export async function getCsrfToken() {
  const response = await apiFetch(`${API_BASE_URL}/auth/csrf/`);

  if (!response.ok) {
    throw new Error("Failed to initialize security token.");
  }

  const data = await response.json();
  csrfToken = data.csrfToken;

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

  // Registration logs the user in, which rotates the CSRF token.
  await getCsrfToken();

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

  // Login rotates the CSRF token, so refresh the cached one.
  await getCsrfToken();

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