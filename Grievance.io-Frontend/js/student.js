import API from "./api.js";
import Core from "./core.js";

/**
 * Student Dashboard Logic - Connected to real backend
 */

const OPEN_EYE_ICON = `
  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    <circle cx="12" cy="12" r="3" stroke-width="1.8" />
  </svg>
`;

const CLOSED_EYE_ICON = `
  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 3l18 18" />
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10.584 10.587a2 2 0 102.828 2.828" />
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9.88 5.09A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.97 9.97 0 01-4.154 5.145M6.228 6.228A9.965 9.965 0 002.458 12c1.274 4.057 5.064 7 9.542 7a9.96 9.96 0 005.772-1.772" />
  </svg>
`;

const StudentApp = {
  currentCaseId: null,
  allCases: [],

  showToast: (title, message, type = "success") => {
    const toast = document.getElementById("toast");
    const toastIcon = document.getElementById("toast-icon");
    const toastTitle = document.getElementById("toast-title");
    const toastMsg = document.getElementById("toast-message");
    if (!toast || !toastIcon || !toastTitle || !toastMsg) return;

    toastTitle.innerText = title;
    toastMsg.innerText = message;

    const styles = {
      success: ["bg-green-100 text-green-600", "✓"],
      error: ["bg-red-100 text-red-600", "✕"],
      warning: ["bg-yellow-100 text-yellow-600", "⚠"],
    };
    const [cls, icon] = styles[type] || styles.success;
    toastIcon.className = `w-10 h-10 rounded-full flex items-center justify-center text-lg ${cls}`;
    toastIcon.innerText = icon;

    toast.classList.remove(
      "translate-y-20",
      "opacity-0",
      "pointer-events-none",
    );
    toast.classList.add("translate-y-0", "opacity-100");
    setTimeout(() => StudentApp.hideToast(), 4000);
  },

  hideToast: () => {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.classList.add("translate-y-20", "opacity-0", "pointer-events-none");
    toast.classList.remove("translate-y-0", "opacity-100");
  },

  getSessionPersistence: () => {
    return API.getSessionStorage() === localStorage;
  },

  loadCurrentUser: async () => {
    const sessionUser = API.getCurrentUser();
    if (!sessionUser?.token) return null;

    const result = await API.getMe();
    if (!result.success || !result.user) {
      API.logout();
      window.location.href = "auth.html";
      return null;
    }

    API.saveSession(
      result.user,
      sessionUser.token,
      StudentApp.getSessionPersistence(),
    );

    return { ...result.user, token: sessionUser.token };
  },

  init: async () => {
    Core.log("Initializing Student Dashboard");

    const user = await StudentApp.loadCurrentUser();
    if (!user) return;

    Core.updateHeader(user);

    // 1. Load real stats from backend
    await StudentApp.loadStats();

    // 2. Load real cases from backend
    await StudentApp.loadMyCases();

    // 3. Bind Grievance Form
    const form = document.getElementById("grievance-form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        StudentApp.handleFileGrievance(user);
      });
    }

    // 4. Fill Profile Data
    StudentApp.fillProfile(user);

    // 5. Bind Back Button
    const btnBack = document.getElementById("btn-back-to-cases");
    if (btnBack) btnBack.onclick = () => Core.navTo("my-cases");

    // 6. Bind Chat Send
    const chatForm = document.querySelector("#view-case-detail form");
    if (chatForm) {
      chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        StudentApp.sendMessage();
      });
    }

    // 6b. Bind Chat Refresh
    const btnRefreshChat = document.getElementById("btn-refresh-chat");
    if (btnRefreshChat) btnRefreshChat.onclick = () => StudentApp.refreshChat();

    // 7. Bind View All button
    const btnViewAll = document.getElementById("btn-view-all-update");
    if (btnViewAll) btnViewAll.onclick = () => Core.navTo("my-cases");

    // 8. Bind Cancel button on grievance form
    const btnCancel = document.getElementById("btn-cancel-grievance");
    if (btnCancel) btnCancel.onclick = () => Core.navTo("dashboard");

    // 9. Bind case status filter
    const caseFilter = document.getElementById("select-case-filter");
    if (caseFilter) {
      caseFilter.addEventListener("change", () =>
        StudentApp.applyFilters(),
      );
    }

    // 10. Bind case ID search bar
    const searchInput = document.getElementById("input-search-cases");
    if (searchInput) {
      let debounce;
      searchInput.addEventListener("input", () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => StudentApp.applyFilters(), 200);
      });
    }

    document
      .getElementById("btn-change-password")
      ?.addEventListener("click", StudentApp.showPasswordModal);
    document
      .getElementById("btn-password-cancel")
      ?.addEventListener("click", StudentApp.hidePasswordModal);
    document
      .getElementById("btn-password-confirm")
      ?.addEventListener("click", StudentApp.confirmPasswordChange);
    document
      .getElementById("toast-close")
      ?.addEventListener("click", StudentApp.hideToast);

    StudentApp.bindPasswordToggles();
  },

  bindPasswordToggles: () => {
    document.querySelectorAll("[data-toggle-password]").forEach((button) => {
      button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.togglePassword);
        if (!input) return;

        const isVisible = input.type === "text";
        input.type = isVisible ? "password" : "text";
        button.setAttribute("aria-pressed", String(!isVisible));
        button.setAttribute(
          "aria-label",
          isVisible ? "Show password" : "Hide password",
        );
        button.innerHTML = isVisible ? OPEN_EYE_ICON : CLOSED_EYE_ICON;
      });
    });
  },

  showPasswordModal: () => {
    const modal = document.getElementById("password-modal");
    if (!modal) return;

    modal.style.display = "flex";
    modal.classList.remove("hidden");
  },

  hidePasswordModal: () => {
    const modal = document.getElementById("password-modal");
    if (!modal) return;

    modal.style.display = "none";
    modal.classList.add("hidden");
  },

  confirmPasswordChange: async () => {
    const current = document.getElementById("input-current-password")?.value;
    const newPass = document.getElementById("input-new-password")?.value;
    const confirm = document.getElementById("input-confirm-password")?.value;

    if (!current || !newPass || !confirm) {
      StudentApp.showToast(
        "Missing Fields",
        "Please fill all fields.",
        "error",
      );
      return;
    }
    if (newPass !== confirm) {
      StudentApp.showToast("Mismatch", "Passwords do not match.", "error");
      return;
    }
    if (newPass.length < 6) {
      StudentApp.showToast("Too Short", "Min 6 characters required.", "error");
      return;
    }

    const result = await API.changePassword(current, newPass);
    if (!result.success) {
      StudentApp.showToast("Error", result.message, "error");
      return;
    }

    StudentApp.showToast("Password Changed", "Updated successfully.");
    StudentApp.hidePasswordModal();
    [
      "input-current-password",
      "input-new-password",
      "input-confirm-password",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
  },

  loadStats: async () => {
    const result = await API.getStats();
    if (!result.success) return;

    const { total, pending, inProgress, resolved } = result.stats;
    const active = pending + inProgress;

    const activeStat = document.querySelector(
      "#view-dashboard .glass-panel:nth-child(1) h3",
    );
    const resolvedStat = document.querySelector(
      "#view-dashboard .glass-panel:nth-child(2) h3",
    );
    const totalStat = document.querySelector(
      "#view-dashboard .glass-panel:nth-child(3) h3",
    );

    if (activeStat) activeStat.innerText = active;
    if (resolvedStat) resolvedStat.innerText = resolved;
    if (totalStat) totalStat.innerText = total;
  },

  loadMyCases: async () => {
    const result = await API.getMyCases();
    if (!result.success) {
      console.error("[StudentApp] Failed to load cases:", result.message);
      return;
    }

    const cases = result.cases || [];
    StudentApp.allCases = cases;

    // Update dashboard recent table
    StudentApp.renderDashboardTable(cases.slice(0, 3));

    // Update full case list
    StudentApp.renderCaseTable(cases);

    // Reset filter dropdown
    const caseFilter = document.getElementById("select-case-filter");
    if (caseFilter) caseFilter.value = "All Status";
  },

  renderDashboardTable: (cases) => {
    const tbody = document.querySelector("#view-dashboard tbody");
    if (!tbody) return;

    if (cases.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-gray-400">No cases yet. File your first grievance!</td></tr>`;
      return;
    }

    tbody.innerHTML = cases
      .map(
        (c) => `
            <tr class="hover:bg-gray-50/50">
                <td class="py-3 px-4">${c.category}</td>
                <td class="py-3 px-4 font-medium text-black">${c.subject}</td>
                <td class="py-3 px-4"><span class="${StudentApp.getStatusBadge(c.status)}">${c.status}</span></td>
                <td class="py-3 px-4 text-right">
                    <button class="text-xs font-bold underline check-btn" data-id="${c.caseId}">Check</button>
                </td>
            </tr>
        `,
      )
      .join("");

    tbody.querySelectorAll(".check-btn").forEach((btn) => {
      btn.onclick = () => StudentApp.openCaseDetail(btn.dataset.id);
    });
  },

  renderCaseTable: (cases) => {
    const container = document.getElementById("case-list");
    if (!container || container.tagName !== "TBODY") return;

    if (cases.length === 0) {
      container.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-gray-400">No cases found.</td></tr>`;
      return;
    }

    container.innerHTML = cases
      .map(
        (c) => `
            <tr class="hover:bg-gray-50/50 cursor-pointer" data-case-id="${c.caseId}">
                <td class="px-6 py-4 font-mono text-xs font-bold">#${c.caseId}</td>
                <td class="px-6 py-4 font-medium text-black">${c.subject}</td>
                <td class="px-6 py-4">${c.category}</td>
                <td class="px-6 py-4">${new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                <td class="px-6 py-4"><span class="${StudentApp.getStatusBadge(c.status)}">${c.status}</span></td>
                <td class="px-6 py-4 text-right">
                    <button class="text-xs underline view-case-btn" data-id="${c.caseId}">View</button>
                </td>
            </tr>
        `,
      )
      .join("");

    container.querySelectorAll(".view-case-btn").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        StudentApp.openCaseDetail(btn.dataset.id);
      };
    });

    container.querySelectorAll("tr").forEach((row) => {
      row.onclick = () => {
        if (row.dataset.caseId) StudentApp.openCaseDetail(row.dataset.caseId);
      };
    });
  },

  handleFileGrievance: async (user) => {
    const category = document.getElementById("category")?.value || "General";
    const subject =
      document.getElementById("input-grievance-subject")?.value?.trim() || "";
    const description =
      document.getElementById("input-grievance-description")?.value?.trim() ||
      "";
    const fileInput = document.getElementById("input-grievance-file");

    if (!subject) {
      alert("Please enter a subject.");
      return;
    }
    if (!description) {
      alert("Please enter a description.");
      return;
    }

    // Build FormData for file upload support
    const formData = new FormData();
    formData.append("category", category);
    formData.append("subject", subject);
    formData.append("description", description);

    if (fileInput && fileInput.files.length > 0) {
      Array.from(fileInput.files).forEach((f) =>
        formData.append("attachments", f),
      );
    }

    const submitBtn = document.querySelector(
      '#grievance-form button[type="submit"]',
    );
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = "Submitting...";
    }

    const result = await API.fileGrievance(formData);

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = "Submit Grievance";
    }

    if (result.success) {
      alert(`✅ Grievance Filed! Case ID: ${result.case.caseId}`);
      document.getElementById("input-grievance-subject").value = "";
      document.getElementById("input-grievance-description").value = "";
      if (fileInput) fileInput.value = "";
      await StudentApp.loadMyCases();
      Core.navTo("my-cases");
    } else {
      alert("❌ Error: " + result.message);
    }
  },

  openCaseDetail: async (id) => {
    const result = await API.getCaseById(id);
    if (!result.success) {
      alert("Could not load case: " + result.message);
      return;
    }

    const c = result.case;
    StudentApp.currentCaseId = id;

    const detailId = document.getElementById("detail-id");
    const detailTitle = document.getElementById("detail-title");

    if (detailId) detailId.innerText = "Case #" + c.caseId;
    if (detailTitle) detailTitle.innerText = c.subject + " • " + c.category;

    // Update status badge
    const statusBadge = document.getElementById("detail-status-badge");
    if (statusBadge) {
      const statusStyles = {
        Pending: "bg-yellow-50 text-yellow-600",
        "In Progress": "bg-blue-50 text-blue-600",
        Escalated: "bg-red-50 text-red-600",
        Resolved: "bg-green-50 text-green-600",
      };
      statusBadge.className = `${statusStyles[c.status] || "bg-gray-50 text-gray-600"} text-xs font-bold px-3 py-1 rounded-full`;
      statusBadge.innerText = c.status;
    }

    // Render chat
    StudentApp.renderChat(c.messages || []);

    // Disable chat input if case is resolved
    const chatInput = document.getElementById("input-chat-message");
    const chatSendBtn = document.getElementById("btn-chat-send");
    if (c.status === "Resolved") {
      if (chatInput) {
        chatInput.disabled = true;
        chatInput.placeholder = "This case is resolved. Messaging is disabled.";
      }
      if (chatSendBtn) chatSendBtn.disabled = true;
    } else {
      if (chatInput) {
        chatInput.disabled = false;
        chatInput.placeholder = "Type a message...";
      }
      if (chatSendBtn) chatSendBtn.disabled = false;
    }

    // Render attachments
    StudentApp.renderAttachments(c.attachments || []);

    // Populate ticket details sidebar
    const fields = {
      subject: c.subject,
      category: c.category,
      date: new Date(c.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      description: c.description,
    };

    const sidebar = document.querySelector(
      "#view-case-detail .glass-panel:last-child",
    );
    if (sidebar) {
      const ps = sidebar.querySelectorAll("p.font-medium, p.text-sm");
      if (ps[0]) ps[0].innerText = c.subject;
      if (ps[1]) ps[1].innerText = c.category;
      if (ps[2]) ps[2].innerText = new Date(c.createdAt).toLocaleDateString();
      if (ps[3]) ps[3].innerText = c.description;
    }

    Core.navTo("case-detail");
  },

  renderChat: (messages) => {
    const container = document.getElementById("chat-thread");
    if (!container) return;

    if (messages.length === 0) {
      container.innerHTML = `<p class="text-center text-xs text-gray-400 py-4">No messages yet. Start the conversation!</p>`;
      return;
    }

    container.innerHTML = messages
      .map((m) => {
        const isStudent = m.sender === "Student";
        const time = new Date(m.time).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        return `
            <div class="flex ${isStudent ? "flex-row-reverse" : ""} gap-3">
                <div class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${isStudent ? "bg-black text-white" : "bg-gray-200 text-gray-600"}">
                    ${isStudent ? "You" : "A"}
                </div>
                <div class="${isStudent ? "chat-bubble-student" : "chat-bubble-admin"} p-4 text-sm max-w-[80%] shadow-sm">
                    ${m.text}
                    <p class="text-[10px] text-gray-400 mt-2 ${isStudent ? "text-right" : ""}">${isStudent ? "You" : m.sender} • ${time}</p>
                </div>
            </div>`;
      })
      .join("");

    container.scrollTop = container.scrollHeight;
  },

  refreshChat: async () => {
    if (!StudentApp.currentCaseId) return;
    const result = await API.getCaseById(StudentApp.currentCaseId);
    if (result.success) {
      StudentApp.renderChat(result.case.messages || []);
    }
  },

  sendMessage: async () => {
    const input = document.getElementById("input-chat-message");
    const text = input?.value?.trim();
    if (!text || !StudentApp.currentCaseId) return;

    const result = await API.sendMessage(StudentApp.currentCaseId, text);
    if (result.success) {
      input.value = "";
      // Reload the case to get updated messages
      const caseResult = await API.getCaseById(StudentApp.currentCaseId);
      if (caseResult.success) {
        StudentApp.renderChat(caseResult.case.messages || []);
      }
    } else {
      alert("Failed to send: " + result.message);
    }
  },

  fillProfile: (user) => {
    const profileName = document.getElementById("profile-name");
    const profileEmail = document.getElementById("profile-email");
    const profileAvatar = document.getElementById("profile-avatar");
    const profileStudentId = document.getElementById("profile-studentid");
    const profilePhone = document.getElementById("profile-phone");
    const profileRole = document.getElementById("profile-role");

    if (profileName) profileName.innerText = user.name || "Student";
    if (profileEmail) profileEmail.innerText = user.email || "";
    if (profileStudentId) profileStudentId.innerText = user.studentId || "N/A";
    if (profilePhone) profilePhone.innerText = user.phone || "N/A";
    if (profileRole)
      profileRole.innerText = user.department || user.role || "Student";
    if (profileAvatar && user.name) {
      const initials = user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      profileAvatar.innerText = initials;
    }
  },

  renderAttachments: (attachments) => {
    const container = document.getElementById("attachment-list");
    if (!container) return;

    if (!attachments || attachments.length === 0) {
      container.innerHTML =
        '<p class="text-xs text-gray-400 italic">No attachments.</p>';
      return;
    }

    container.innerHTML = attachments
      .map((a) => {
        const ext =
          (a.originalName || a.filename || "").split(".").pop().toUpperCase() ||
          "FILE";
        const isImage = /jpg|jpeg|png|gif/i.test(ext);
        const url = `${API.uploadsBase}/uploads/${a.filename}`;
        const bgColor = isImage
          ? "bg-blue-100 text-blue-700"
          : "bg-gray-200 text-gray-700";
        return `
            <a href="${url}" target="_blank" rel="noopener"
               class="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:shadow-sm transition cursor-pointer group">
                <div class="w-8 h-8 ${bgColor} rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0">${ext.slice(0, 3)}</div>
                <div class="min-w-0">
                    <p class="text-xs font-semibold text-gray-800 truncate max-w-[120px]">${a.originalName || a.filename}</p>
                    <p class="text-[10px] text-gray-400">${a.size ? (a.size / 1024).toFixed(1) + " KB" : ""}</p>
                </div>
                <svg class="w-3 h-3 text-gray-400 group-hover:text-black ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </a>`;
      })
      .join("");
  },

  // Combined filter: status + search by case ID
  applyFilters: () => {
    const status = document.getElementById("select-case-filter")?.value || "All Status";
    const query = (document.getElementById("input-search-cases")?.value || "").trim().toLowerCase();
    let filtered = StudentApp.allCases;
    if (status !== "All Status") filtered = filtered.filter((c) => c.status === status);
    if (query) filtered = filtered.filter((c) => c.caseId.toLowerCase().includes(query));
    StudentApp.renderCaseTable(filtered);
  },

  filterCases: (filterValue) => {
    if (filterValue === "All Status") {
      StudentApp.renderCaseTable(StudentApp.allCases);
    } else {
      const filtered = StudentApp.allCases.filter(
        (c) => c.status === filterValue,
      );
      StudentApp.renderCaseTable(filtered);
    }
  },

  getStatusBadge: (status) => {
    const map = {
      Pending:
        "bg-yellow-50 text-yellow-600 px-2 py-1 rounded text-xs font-bold",
      "In Progress":
        "bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-bold",
      Escalated: "bg-red-50 text-red-600 px-2 py-1 rounded text-xs font-bold",
      Resolved:
        "bg-green-50 text-green-600 px-2 py-1 rounded text-xs font-bold",
    };
    return map[status] || map["Pending"];
  },
};

window.StudentApp = StudentApp;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", StudentApp.init);
} else {
  StudentApp.init();
}
