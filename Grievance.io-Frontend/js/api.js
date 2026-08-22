/**
 * API Module - Connects to the real Express/MongoDB backend
 * Auto-detects: uses relative /api in production, localhost in dev
 */

const envApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "");

const BASE_URL =
  envApiBaseUrl ||
  (window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "/api");

// Base URL for uploaded file attachments (strips /api suffix)
const UPLOADS_BASE = BASE_URL.replace("/api", "");

const API = {
  // ── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Get stored JWT token
   */
  getToken: () => {
    const session = API.getSession();
    return session ? session.token : null;
  },

  /**
   * Build headers with Authorization
   */
  getHeaders: (isFormData = false) => {
    const headers = {};
    if (!isFormData) headers["Content-Type"] = "application/json";
    const token = API.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  },

  /**
   * Generic fetch wrapper with error handling
   */
  request: async (method, endpoint, body = null, isFormData = false) => {
    try {
      const options = {
        method,
        headers: API.getHeaders(isFormData),
      };
      if (body) {
        options.body = isFormData ? body : JSON.stringify(body);
      }

      const res = await fetch(`${BASE_URL}${endpoint}`, options);
      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          message: data.message || `Error ${res.status}`,
        };
      }
      return data;
    } catch (err) {
      console.error(`[API] ${method} ${endpoint} failed:`, err.message);
      return {
        success: false,
        message: "Cannot connect to server. Is it running?",
      };
    }
  },

  // ── Session Management ────────────────────────────────────────────────────

  getSessionStorage: () => {
    const localSession = localStorage.getItem("grievance_session");
    if (localSession) {
      return localStorage;
    }

    const browserSession = sessionStorage.getItem("grievance_session");
    if (browserSession) {
      return sessionStorage;
    }

    return null;
  },

  saveSession: (user, token, persist = true) => {
    const targetStorage = persist ? localStorage : sessionStorage;
    const otherStorage = persist ? sessionStorage : localStorage;

    otherStorage.removeItem("grievance_session");
    targetStorage.setItem(
      "grievance_session",
      JSON.stringify({ ...user, token }),
    );
  },

  getSession: () => {
    const storage = API.getSessionStorage();
    const s = storage?.getItem("grievance_session");
    return s ? JSON.parse(s) : null;
  },

  getCurrentUser: () => {
    return API.getSession();
  },

  logout: () => {
    localStorage.removeItem("grievance_session");
    sessionStorage.removeItem("grievance_session");
  },

  // ── Auth ──────────────────────────────────────────────────────────────────

  /**
   * Login user
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{success, user?, token?, message?}>}
   */
  login: async (email, password, rememberMe = true) => {
    const result = await API.request("POST", "/auth/login", {
      email,
      password,
    });
    if (result.success) {
      API.saveSession(result.user, result.token, rememberMe);
    }
    return result;
  },

  /**
   * Register new student
   * @param {object} userData - { name, email, password, phone, studentId }
   */
  register: async (userData) => {
    const result = await API.request("POST", "/auth/register", userData);
    if (result.success) {
      API.saveSession(result.user, result.token);
    }
    return result;
  },

  /**
   * Get current user from server (validates token)
   */
  getMe: async () => {
    return await API.request("GET", "/auth/me");
  },

  /**
   * Change password
   * @param {string} currentPassword
   * @param {string} newPassword
   */
  changePassword: async (currentPassword, newPassword) => {
    return await API.request("PUT", "/auth/change-password", {
      currentPassword,
      newPassword,
    });
  },

  /**
   * Forgot password - send OTP to email
   * @param {string} email
   */
  forgotPassword: async (email) => {
    return await API.request("POST", "/auth/forgot-password", { email });
  },

  /**
   * Verify OTP - returns resetToken
   * @param {string} email
   * @param {string} otp
   */
  verifyOtp: async (email, otp) => {
    return await API.request("POST", "/auth/verify-otp", { email, otp });
  },

  /**
   * Reset password using resetToken
   * @param {string} resetToken
   * @param {string} newPassword
   */
  resetPassword: async (email, otp, newPassword) => {
    return await API.request("POST", "/auth/reset-password", {
      email,
      otp,
      newPassword,
    });
  },

  // ── Cases ─────────────────────────────────────────────────────────────────

  /**
   * File a new grievance (student)
   * @param {FormData} formData - includes category, subject, description, attachments
   */
  fileGrievance: async (formData) => {
    return await API.request("POST", "/cases", formData, true);
  },

  /**
   * Get student's own cases
   */
  getMyCases: async () => {
    return await API.request("GET", "/cases/my");
  },

  /**
   * Get cases for admin's department
   * @param {object} filters - { status, slaBreached }
   */
  getDepartmentCases: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return await API.request(
      "GET",
      `/cases/department${params ? "?" + params : ""}`,
    );
  },

  /**
   * Get all cases (superadmin)
   * @param {object} filters - { status, department, search }
   */
  getAllCases: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return await API.request("GET", `/cases/all${params ? "?" + params : ""}`);
  },

  /**
   * Get escalated cases (superadmin)
   */
  getEscalatedCases: async () => {
    return await API.request("GET", "/cases/escalated");
  },

  /**
   * Get dashboard statistics
   */
  getStats: async () => {
    return await API.request("GET", "/cases/stats");
  },

  /**
   * Get a single case by ID (e.g. 'G-1024')
   * @param {string} caseId
   */
  getCaseById: async (caseId) => {
    return await API.request("GET", `/cases/${caseId}`);
  },

  /**
   * Send a message in a case thread
   * @param {string} caseId
   * @param {string} text
   * @param {boolean} isInternal
   */
  sendMessage: async (caseId, text, isInternal = false) => {
    return await API.request("POST", `/cases/${caseId}/message`, {
      text,
      isInternal,
    });
  },

  /**
   * Change case status (admin/superadmin)
   * @param {string} caseId
   * @param {string} status
   * @param {string} remark
   */
  changeStatus: async (caseId, status, remark) => {
    return await API.request("PUT", `/cases/${caseId}/status`, {
      status,
      remark,
    });
  },

  /**
   * Escalate a case (admin)
   * @param {string} caseId
   * @param {string} escalateTo
   * @param {string} reason
   */
  escalateCase: async (caseId, escalateTo, reason) => {
    return await API.request("PUT", `/cases/${caseId}/escalate`, {
      escalateTo,
      reason,
    });
  },

  /**
   * Resolve and close a case (admin/superadmin)
   * @param {string} caseId
   */
  resolveCase: async (caseId) => {
    return await API.request("PUT", `/cases/${caseId}/resolve`);
  },

  // ── Admin Management (SuperAdmin) ─────────────────────────────────────────

  /**
   * Get all admins
   */
  getAdmins: async () => {
    return await API.request("GET", "/admin/list");
  },

  /**
   * Create a new admin
   * @param {object} adminData - { name, email, department, password }
   */
  createAdmin: async (adminData) => {
    return await API.request("POST", "/admin/create", adminData);
  },

  /**
   * Update admin profile
   * @param {string} adminId
   * @param {object} data - { email, department }
   */
  updateAdmin: async (adminId, data) => {
    return await API.request("PUT", `/admin/${adminId}`, data);
  },

  /**
   * Delete an admin
   * @param {string} adminId
   */
  deleteAdmin: async (adminId) => {
    return await API.request("DELETE", `/admin/${adminId}`);
  },

  uploadsBase: UPLOADS_BASE,

  /**
   * Download a report file (Excel or PDF)
   * @param {object} params - { period, format, department? }
   */
  downloadReport: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const url = `${BASE_URL}/reports/download${qs ? "?" + qs : ""}`;
    const token = API.getToken();
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, message: data.message || "Download failed" };
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match
        ? match[1]
        : `report.${params.format === "pdf" ? "pdf" : "xlsx"}`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      return { success: true };
    } catch (err) {
      console.error("[API] Report download failed:", err.message);
      return { success: false, message: "Cannot connect to server." };
    }
  },

  // ── Debug ─────────────────────────────────────────────────────────────────

  log: (msg, data = "") => {
    if (window.ANTIGRAVITY_DEBUG) {
      console.log(`[API] ${msg}`, data);
    }
  },
};

// Expose globally
window.API = API;

export default API;
