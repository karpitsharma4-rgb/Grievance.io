import API from "./api.js";
import Core from "./core.js";

/**
 * Super Admin Dashboard Logic - Connected to real backend
 */

const DEPARTMENTS = [
  "Academic Affairs",
  "Administration",
  "Facilities & Infrastructure",
  "IT & Technical Support",
  "Student Welfare & Discipline",
];

const SuperAdminApp = {
  currentCaseId: null,
  currentCaseStatus: null,
  currentAdminId: null,
  currentAdminName: null,
  confirmCallback: null,
  escalatedFilterMode: "Escalated", // 'Escalated' | 'Resolved'
  escalatedDeptFilter: "all",
  allGrievanceDeptFilter: "all",

  // ── Toast ─────────────────────────────────────────────────────────────────
  showToast: (title, message, type = "success") => {
    const toast = document.getElementById("toast");
    const toastIcon = document.getElementById("toast-icon");
    const toastTitle = document.getElementById("toast-title");
    const toastMsg = document.getElementById("toast-message");
    if (!toast) return;

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

    toast.classList.remove("translate-y-20", "opacity-0", "pointer-events-none");
    toast.classList.add("translate-y-0", "opacity-100");
    setTimeout(() => SuperAdminApp.hideToast(), 4000);
  },

  hideToast: () => {
    const toast = document.getElementById("toast");
    if (toast) {
      toast.classList.add("translate-y-20", "opacity-0", "pointer-events-none");
      toast.classList.remove("translate-y-0", "opacity-100");
    }
  },

  // ── Confirm Dialog ────────────────────────────────────────────────────────
  showConfirm: (title, message, callback) => {
    const modal = document.getElementById("confirm-modal");
    if (!modal) return;
    document.getElementById("confirm-title").innerText = title;
    document.getElementById("confirm-message").innerText = message;
    SuperAdminApp.confirmCallback = callback;
    modal.style.display = "flex";
    modal.classList.remove("hidden");
  },

  hideConfirm: () => {
    const modal = document.getElementById("confirm-modal");
    if (modal) {
      modal.style.display = "none";
      modal.classList.add("hidden");
    }
    SuperAdminApp.confirmCallback = null;
  },

  // ── Init ──────────────────────────────────────────────────────────────────
  init: async () => {
    Core.log("Initializing SuperAdmin Dashboard");
    const user = API.getCurrentUser();
    if (!user) return;

    // Fill profile header
    if (user.name) {
      const nameEl = document.getElementById("header-user-name");
      if (nameEl) nameEl.innerText = user.name;
      const profileNameEl = document.getElementById("profile-name");
      if (profileNameEl) profileNameEl.innerText = user.name;
      const profileEmailEl = document.getElementById("profile-email");
      if (profileEmailEl) profileEmailEl.innerText = user.email || "";
      const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
      const avatarEl = document.getElementById("header-avatar");
      if (avatarEl) avatarEl.innerText = initials;
      const profileAvatarEl = document.getElementById("profile-avatar-initials");
      if (profileAvatarEl) profileAvatarEl.innerText = initials;
    }

    // Load data
    await SuperAdminApp.loadOverviewStats();
    await SuperAdminApp.loadEscalatedCases();
    await SuperAdminApp.loadAllCases();
    await SuperAdminApp.loadAdmins();

    // Bind Back Button
    document
      .getElementById("btn-back-to-escalated")
      ?.addEventListener("click", () => {
        Core.navTo(SuperAdminApp._backView || "escalated");
      });

    // Bind Chat Send
    document.getElementById("btn-chat-send")?.addEventListener("click", (e) => {
      e.preventDefault();
      SuperAdminApp.sendMessage();
    });

    // Bind Chat Refresh
    document.getElementById("btn-refresh-chat-detail")?.addEventListener("click", () => {
      SuperAdminApp.refreshChat();
    });

    // Bind Add Admin
    document
      .getElementById("btn-add-new-admin")
      ?.addEventListener("click", SuperAdminApp.showAddAdminModal);

    // Bind Add Admin Modal
    document
      .getElementById("btn-cancel-admin-modal")
      ?.addEventListener("click", SuperAdminApp.hideAddAdminModal);
    document
      .getElementById("btn-create-admin-modal")
      ?.addEventListener("click", SuperAdminApp.createAdmin);

    // Bind Resolve Case
    document
      .getElementById("btn-resolve-case")
      ?.addEventListener("click", SuperAdminApp.handleResolveCase);

    // Bind Password Modal
    document
      .getElementById("btn-change-password")
      ?.addEventListener("click", SuperAdminApp.showPasswordModal);
    document
      .getElementById("btn-password-cancel")
      ?.addEventListener("click", SuperAdminApp.hidePasswordModal);
    document
      .getElementById("btn-password-confirm")
      ?.addEventListener("click", SuperAdminApp.confirmPasswordChange);

    // Bind Edit Admin Modal
    document
      .getElementById("btn-edit-admin-cancel")
      ?.addEventListener("click", SuperAdminApp.hideEditAdminModal);
    document
      .getElementById("btn-edit-admin-confirm")
      ?.addEventListener("click", SuperAdminApp.confirmEditAdmin);

    // Bind Confirm Modal
    document
      .getElementById("btn-confirm-no")
      ?.addEventListener("click", SuperAdminApp.hideConfirm);
    document
      .getElementById("btn-confirm-yes")
      ?.addEventListener("click", () => {
        if (SuperAdminApp.confirmCallback) SuperAdminApp.confirmCallback();
        SuperAdminApp.hideConfirm();
      });

    // Bind Toast Close
    document
      .getElementById("toast-close")
      ?.addEventListener("click", SuperAdminApp.hideToast);

    // Bind Escalated page filters
    document.getElementById("filter-escalated-btn")?.addEventListener("click", () => {
      SuperAdminApp.escalatedFilterMode = "Escalated";
      document.getElementById("filter-escalated-btn").className = "px-4 py-2 text-xs font-bold rounded-full bg-black text-white";
      document.getElementById("filter-resolved-btn").className = "px-4 py-2 text-xs font-bold rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200";
      SuperAdminApp.loadEscalatedCases();
    });
    document.getElementById("filter-resolved-btn")?.addEventListener("click", () => {
      SuperAdminApp.escalatedFilterMode = "Resolved";
      document.getElementById("filter-resolved-btn").className = "px-4 py-2 text-xs font-bold rounded-full bg-black text-white";
      document.getElementById("filter-escalated-btn").className = "px-4 py-2 text-xs font-bold rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200";
      SuperAdminApp.loadEscalatedCases();
    });

    // Bind dept filter dropdown on Escalated view
    const deptSelectEscalated = document.getElementById("dept-filter-escalated-select");
    if (deptSelectEscalated) {
      deptSelectEscalated.addEventListener("change", (e) => {
        SuperAdminApp.escalatedDeptFilter = e.target.value;
        SuperAdminApp.loadEscalatedCases();
      });
    }

    // Bind Case ID / Full search bar on Escalated view (debounced)
    const searchInputEscalated = document.getElementById("input-search-escalated-cases");
    if (searchInputEscalated) {
      let debounceEsc;
      searchInputEscalated.addEventListener("input", () => {
        clearTimeout(debounceEsc);
        debounceEsc = setTimeout(SuperAdminApp.loadEscalatedCases, 250);
      });
    }

    // Bind dept filter dropdown on All-Grievances view
    const deptSelect = document.getElementById("dept-filter-select");
    if (deptSelect) {
      deptSelect.addEventListener("change", (e) => {
        SuperAdminApp.allGrievanceDeptFilter = e.target.value;
        SuperAdminApp.loadAllCases();
      });
    }

    // Bind Case ID / Full search bar (debounced)
    const searchInput = document.getElementById("input-search-all-cases");
    if (searchInput) {
      let debounce;
      searchInput.addEventListener("input", () => {
        clearTimeout(debounce);
        debounce = setTimeout(SuperAdminApp.loadAllCases, 250);
      });
    }

    // Bind Download Report
    document
      .getElementById("btn-download-report")
      ?.addEventListener("click", async () => {
        const period = document.getElementById("select-report-period")?.value || "monthly";
        const format = document.getElementById("select-report-format")?.value || "excel";
        const department = document.getElementById("select-report-department")?.value || "all";
        SuperAdminApp.showToast("Generating", "Preparing your report...", "warning");
        const result = await API.downloadReport({ period, format, department });
        if (result.success) {
          SuperAdminApp.showToast("Downloaded", "Report downloaded successfully.");
        } else {
          SuperAdminApp.showToast("Error", result.message, "error");
        }
      });

    // Bind Quick Action buttons on overview
    document.getElementById("btn-goto-escalated")?.addEventListener("click", () => Core.navTo("escalated"));
    document.getElementById("btn-goto-all")?.addEventListener("click", () => Core.navTo("all-grievances"));
    document.getElementById("btn-goto-admin")?.addEventListener("click", () => Core.navTo("admin-mgmt"));

    // Bind logout
    document.getElementById("btn-logout")?.addEventListener("click", () => {
      API.logout();
      window.location.href = "/pages/auth.html";
    });
  },

  // ── Overview Stats ────────────────────────────────────────────────────────
  loadOverviewStats: async () => {
    const [statsResult, allResult, adminsResult] = await Promise.all([
      API.getStats(),
      API.getAllCases(),
      API.getAdmins(),
    ]);

    if (statsResult.success) {
      const { total, resolved, escalated, pending, inProgress } = statsResult.stats;
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val ?? "—"; };
      set("stat-total", total);
      set("stat-resolved", resolved);
      set("stat-resolved2", resolved);
      set("stat-escalated", escalated);
      set("stat-escalated2", escalated);
      set("stat-pending", pending);
      set("stat-inprogress", inProgress);
    }

    if (adminsResult.success) {
      const el = document.getElementById("stat-admins");
      if (el) el.innerText = adminsResult.admins.length;
    }

    // Build bar chart from all cases
    if (allResult.success) {
      SuperAdminApp.renderDeptBarChart(allResult.cases || []);
    }

    // Load recent escalations (last 4)
    await SuperAdminApp.loadRecentEscalations();
  },

  renderDeptBarChart: (cases) => {
    const container = document.getElementById("dept-bar-chart");
    if (!container) return;

    // Count per dept
    const counts = {};
    DEPARTMENTS.forEach((d) => (counts[d] = 0));
    cases.forEach((c) => {
      if (counts[c.department] !== undefined) counts[c.department]++;
    });

    const max = Math.max(...Object.values(counts), 1);

    const MAX_BAR_PX = 160;   // max bar height in px
    const COL_W      = 75;    // total column width in px
    const BAR_W      = 46;    // actual bar width in px
    const TOTAL_H    = MAX_BAR_PX + 70; // container height (bar + count + label)

    // Using glossy colors closely matching the 3D chart screenshot
    const colors = ["#9dd2f3", "#f1d141", "#a8da42", "#efa36a", "#3cc6bd"];
    const shortNames = [
      "Academic\nAffairs", "Administration Department", "Facilities & Infrastructure", "IT\nSupport", "Student\nWelfare",
    ];

    const gradientStops = "rgba(0,0,0,0.15) 0%, rgba(255,255,255,0.7) 20%, rgba(255,255,255,0) 45%, rgba(0,0,0,0.05) 75%, rgba(0,0,0,0.2) 100%";

    /*
     * Layout: Absolute background grid + 3D cylinders with elliptical top caps.
     */
    container.innerHTML =
      `<div style="position:relative;width:100%;height:${TOTAL_H}px;margin-top:10px;">
         <div style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;display:flex;flex-direction:column;justify-content:space-between;padding-top:20px;padding-bottom:40px;">
            <div style="border-top:1px solid #f3f4f6;width:100%;"></div>
            <div style="border-top:1px solid #f3f4f6;width:100%;"></div>
            <div style="border-top:1px solid #f3f4f6;width:100%;"></div>
            <div style="border-top:1px dashed #e5e7eb;width:100%;"></div>
         </div>
         <div style="position:relative;z-index:1;display:flex;justify-content:center;gap:20px;width:100%;height:100%;align-items:stretch;padding-top:10px;">` +
      DEPARTMENTS.map((dept, i) => {
        const count  = counts[dept] || 0;
        const barH   = Math.max(Math.round((count / max) * MAX_BAR_PX), 10);
        const label  = shortNames[i].replace("\n", "<br>");
        const color  = colors[i];
        return `
          <div style="display:flex;flex-direction:column;align-items:center;width:${COL_W}px;">
            <span style="font-size:13px;font-weight:800;color:#374151;line-height:1.2;margin-bottom:8px;">${count}</span>
            <div style="flex:1;"></div>
            <div style="position:relative;width:${BAR_W}px;height:${barH}px;background-color:${color};background-image:linear-gradient(to right, ${gradientStops}); border-radius:0 0 6px 6px; box-shadow: 2px 5px 8px rgba(0,0,0,0.15); transition:height 0.55s cubic-bezier(.4,0,.2,1);">
              <!-- Top Cap -->
              <div style="position:absolute;top:-7px;left:0;width:100%;height:14px;background-color:${color};border-radius:50%;background-image:linear-gradient(to right, ${gradientStops}); box-shadow: inset 0 2px 4px rgba(255,255,255,0.9), inset 0 -2px 4px rgba(0,0,0,0.1); z-index:2;"></div>
            </div>
            <span style="font-size:10px;font-weight:600;color:#6b7280;text-align:center;line-height:1.3;margin-top:12px;width:${COL_W}px;">${label}</span>
          </div>`;
      }).join("") +
      `</div></div>`;
  },


  loadRecentEscalations: async () => {
    const result = await API.getEscalatedCases();
    const container = document.getElementById("recent-escalations-list");
    if (!container) return;

    if (!result.success) {
      container.innerHTML = `<p class="text-center text-xs text-gray-400 py-4">Failed to load.</p>`;
      return;
    }

    const cases = (result.cases || []).slice(0, 4);
    if (cases.length === 0) {
      container.innerHTML = `<p class="text-center text-xs text-gray-400 py-4">No escalated cases. 🎉</p>`;
      return;
    }

    container.innerHTML = cases.map((c) => `
      <div
        class="p-4 bg-gray-50 rounded-2xl border-l-4 border-red-500 cursor-pointer hover:bg-white hover:shadow-sm transition"
        onclick="SuperAdminApp.openCase('${c.caseId}', 'overview')"
      >
        <div class="flex justify-between items-start mb-1">
          <span class="text-[10px] font-bold text-gray-500">#${c.caseId} • ${c.department}</span>
          <button class="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-full hover:bg-red-100 transition"
            onclick="event.stopPropagation(); SuperAdminApp.openCase('${c.caseId}', 'overview')">
            Handle
          </button>
        </div>
        <p class="text-sm font-bold text-gray-900 truncate">${c.subject}</p>
      </div>
    `).join("");
  },

  // ── Escalated Cases ───────────────────────────────────────────────────────
  loadEscalatedCases: async () => {
    const filterStatus = SuperAdminApp.escalatedFilterMode;
    const filters = { status: filterStatus === "Escalated" ? "Escalated" : "Resolved" };

    if (SuperAdminApp.escalatedDeptFilter && SuperAdminApp.escalatedDeptFilter !== "all") {
      filters.department = SuperAdminApp.escalatedDeptFilter;
    }
    const searchEl = document.getElementById("input-search-escalated-cases");
    if (searchEl && searchEl.value.trim()) {
      filters.search = searchEl.value.trim();
    }

    const result = await API.getAllCases(filters);

    if (!result.success) return;

    const cases = result.cases || [];
    const tbody = document.getElementById("case-list-escalated");
    if (!tbody) return;

    const badge = document.getElementById("escalated-badge");
    if (badge) badge.innerText = `${cases.length} ${filterStatus === "Escalated" ? "Active" : "Resolved"}`;

    if (cases.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-gray-500">No ${filterStatus} cases.</td></tr>`;
      return;
    }

    tbody.innerHTML = cases
      .map(
        (c) => `
            <tr class="hover:bg-gray-50 transition cursor-pointer" data-case-id="${c.caseId}">
                <td class="px-6 py-4 font-mono font-bold text-gray-500">${c.caseId}</td>
                <td class="px-6 py-4 font-bold text-black">${c.subject}</td>
                <td class="px-6 py-4">${c.department}</td>
                <td class="px-6 py-4">
                    <span class="${SuperAdminApp.getStatusClass(c.status)} px-2 py-1 rounded text-[10px] font-bold">${c.status.toUpperCase()}</span>
                </td>
                <td class="px-6 py-4 text-right">
                    <button class="bg-black text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-gray-800 manage-btn" data-id="${c.caseId}">Manage</button>
                </td>
            </tr>
        `,
      )
      .join("");

    tbody.querySelectorAll("tr").forEach((row) => {
      row.onclick = (e) => {
        if (e.target.classList.contains("manage-btn")) return;
        if (row.dataset.caseId) SuperAdminApp.openCase(row.dataset.caseId, "escalated");
      };
    });

    tbody.querySelectorAll(".manage-btn").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        SuperAdminApp.openCase(btn.dataset.id, "escalated");
      };
    });
  },

  // ── All Cases ─────────────────────────────────────────────────────────────
  loadAllCases: async () => {
    const filters = {};
    if (SuperAdminApp.allGrievanceDeptFilter !== "all") {
      filters.department = SuperAdminApp.allGrievanceDeptFilter;
    }
    const searchEl = document.getElementById("input-search-all-cases");
    if (searchEl && searchEl.value.trim()) {
      filters.search = searchEl.value.trim();
    }

    const result = await API.getAllCases(filters);
    if (!result.success) return;

    const cases = result.cases || [];
    const tbody = document.getElementById("case-list");
    if (!tbody) return;

    if (cases.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-gray-500">No cases found.</td></tr>`;
      return;
    }

    tbody.innerHTML = cases
      .map(
        (c) => `
            <tr class="hover:bg-gray-50/50 transition" data-case-id="${c.caseId}">
                <td class="px-6 py-4 font-mono font-bold text-gray-500">${c.caseId}</td>
                <td class="px-6 py-4 font-medium text-black">${c.subject}</td>
                <td class="px-6 py-4">${c.department}</td>
                <td class="px-6 py-4">
                    <span class="${SuperAdminApp.getStatusClass(c.status)} px-2 py-1 rounded text-[10px] font-bold">${c.status.toUpperCase()}</span>
                </td>
                <td class="px-6 py-4 text-right">
                    <button class="text-black underline text-xs font-bold hover:no-underline view-btn" data-id="${c.caseId}">View</button>
                </td>
            </tr>
        `,
      )
      .join("");

    tbody.querySelectorAll("tr").forEach((row) => {
      row.onclick = (e) => {
        if (e.target.classList.contains("view-btn")) return;
        if (row.dataset.caseId) SuperAdminApp.openCase(row.dataset.caseId, "all-grievances");
      };
    });

    tbody.querySelectorAll(".view-btn").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        SuperAdminApp.openCase(btn.dataset.id, "all-grievances");
      };
    });
  },

  // ── Open Case Detail ──────────────────────────────────────────────────────
  openCase: async (id, fromView = "escalated") => {
    SuperAdminApp._backView = fromView;
    const result = await API.getCaseById(id);
    if (!result.success) {
      SuperAdminApp.showToast("Error", "Could not load case: " + result.message, "error");
      return;
    }

    const c = result.case;
    SuperAdminApp.currentCaseId = id;
    SuperAdminApp.currentCaseStatus = c.status;
    const isEscalated = c.status === "Escalated";

    // Header fields
    const detailId = document.getElementById("detail-id");
    const detailTitle = document.getElementById("detail-title");
    const detailDesc = document.getElementById("detail-desc");
    if (detailId) detailId.innerText = "#" + c.caseId;
    if (detailTitle) detailTitle.innerText = c.subject;
    if (detailDesc) detailDesc.innerText = c.description || "No description.";

    // Status badge
    const badge = document.getElementById("detail-status-badge");
    if (badge) {
      badge.innerText = c.status;
      badge.className = `text-xs font-bold px-3 py-1 rounded-full ${SuperAdminApp.getStatusBadgeClass(c.status)}`;
    }

    // Show resolve button only for escalated cases
    const actionArea = document.getElementById("case-action-area");
    if (actionArea) {
      if (isEscalated) {
        actionArea.classList.remove("hidden");
      } else {
        actionArea.classList.add("hidden");
      }
    }

    // Chat: show input only for escalated
    const chatInputArea = document.getElementById("chat-input-area");
    const chatViewOnly = document.getElementById("chat-viewonly-notice");
    if (chatInputArea && chatViewOnly) {
      if (isEscalated) {
        chatInputArea.classList.remove("hidden");
        chatViewOnly.classList.add("hidden");
      } else {
        chatInputArea.classList.add("hidden");
        chatViewOnly.classList.remove("hidden");
      }
    }

    // Student info
    if (c.student) {
      const sName = c.student.name || c.studentName || "Student";
      const initials = sName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
      const avatarEl = document.getElementById("student-avatar");
      const nameEl = document.getElementById("student-name");
      const deptEl = document.getElementById("student-dept");
      const rollEl = document.getElementById("student-roll");
      const emailEl = document.getElementById("student-email");
      const phoneEl = document.getElementById("student-phone");
      if (avatarEl) avatarEl.innerText = initials;
      if (nameEl) nameEl.innerText = sName;
      if (deptEl) deptEl.innerText = c.student.department || "";
      if (rollEl) rollEl.innerText = c.student.studentId || "N/A";
      if (emailEl) emailEl.innerText = c.student.email || "N/A";
      if (phoneEl) phoneEl.innerText = c.student.phone || "N/A";
    }

    // Meta info
    const metaDept = document.getElementById("meta-dept");
    const metaCat = document.getElementById("meta-category");
    const metaReason = document.getElementById("meta-escalation-reason");
    if (metaDept) metaDept.innerText = c.department || "—";
    if (metaCat) metaCat.innerText = c.category || "—";
    if (metaReason) {
      if (c.escalationReason) {
        metaReason.innerText = c.escalationReason;
        metaReason.classList.remove("hidden");
      } else {
        metaReason.classList.add("hidden");
      }
    }

    // Attachments
    SuperAdminApp.renderAttachments(c.attachments || []);

    SuperAdminApp.renderChat(c.messages || []);
    Core.navTo("case-detail");
  },

  renderAttachments: (attachments) => {
    const container = document.getElementById("attachment-list");
    if (!container) return;

    if (!attachments || attachments.length === 0) {
      container.innerHTML = '<p class="text-xs text-gray-400 italic">No attachments.</p>';
      return;
    }

    container.innerHTML = attachments.map((a) => {
      const ext = (a.originalName || a.filename || "").split(".").pop().toUpperCase() || "FILE";
      const isImage = /jpg|jpeg|png|gif/i.test(ext);
      const url = `${API.uploadsBase}/uploads/${a.filename}`;
      const bgColor = isImage ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-700";
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
    }).join("");
  },

  renderChat: (messages) => {
    const container = document.getElementById("chat-thread");
    if (!container) return;

    if (messages.length === 0) {
      container.innerHTML = `<p class="text-center text-xs text-gray-400 py-4">No messages yet.</p>`;
      return;
    }

    container.innerHTML = messages
      .map((m) => {
        const isAdmin = m.sender !== "Student";
        const time = new Date(m.time).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        return `
            <div class="flex gap-3 ${isAdmin ? "flex-row-reverse" : ""}">
                <div class="w-8 h-8 ${isAdmin ? "bg-black text-white" : "bg-gray-200 text-gray-600"} rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold">
                    ${isAdmin ? "SA" : "S"}
                </div>
                <div class="${isAdmin ? "bg-black text-white" : "bg-white border border-gray-100"} p-3 rounded-2xl ${isAdmin ? "rounded-tr-none" : "rounded-tl-none"} shadow-sm text-sm max-w-[80%]">
                    ${m.text}
                    <p class="text-[10px] ${isAdmin ? "text-gray-400" : "text-gray-400"} mt-1">${time}</p>
                </div>
            </div>`;
      })
      .join("");

    container.scrollTop = container.scrollHeight;
  },

  refreshChat: async () => {
    if (!SuperAdminApp.currentCaseId) return;
    const result = await API.getCaseById(SuperAdminApp.currentCaseId);
    if (result.success) {
      SuperAdminApp.renderChat(result.case.messages || []);
    }
  },

  sendMessage: async () => {
    const input = document.getElementById("input-chat-reply");
    const text = input?.value?.trim();
    if (!text || !SuperAdminApp.currentCaseId) return;

    const result = await API.sendMessage(SuperAdminApp.currentCaseId, text);
    if (result.success) {
      input.value = "";
      const caseResult = await API.getCaseById(SuperAdminApp.currentCaseId);
      if (caseResult.success)
        SuperAdminApp.renderChat(caseResult.case.messages || []);
      SuperAdminApp.showToast("Message Sent", "Your reply has been sent.");
    } else {
      SuperAdminApp.showToast("Error", result.message, "error");
    }
  },

  handleResolveCase: () => {
    SuperAdminApp.showConfirm(
      "Resolve Case?",
      "Mark this case as resolved and close it?",
      SuperAdminApp.resolveCase,
    );
  },

  resolveCase: async () => {
    if (!SuperAdminApp.currentCaseId) return;

    const result = await API.resolveCase(SuperAdminApp.currentCaseId);
    if (result.success) {
      SuperAdminApp.showToast("Case Resolved", "Marked as resolved.");
      Core.navTo(SuperAdminApp._backView || "escalated");
      await SuperAdminApp.loadEscalatedCases();
      await SuperAdminApp.loadAllCases();
      await SuperAdminApp.loadOverviewStats();
    } else {
      SuperAdminApp.showToast("Error", result.message, "error");
    }
  },

  // ── Admin Management ──────────────────────────────────────────────────────
  loadAdmins: async () => {
    const result = await API.getAdmins();
    if (!result.success) return;

    const admins = result.admins || [];
    const container = document.getElementById("admin-grid");
    if (!container) return;

    if (admins.length === 0) {
      container.innerHTML = `<div class="col-span-3 text-center py-12 text-gray-400">No admins yet. Add one!</div>`;
      return;
    }

    container.innerHTML = admins
      .map((a) => {
        const initials = a.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
        return `
            <div class="glass-panel bg-white rounded-[2rem] p-6 flex flex-col items-center text-center relative hover:shadow-lg transition admin-card"
                 data-admin-id="${a._id}" data-admin-name="${a.name}">
                <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-2xl font-bold mb-4">${initials}</div>
                <h3 class="font-bold text-lg">${a.name}</h3>
                <p class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">${a.department}</p>
                <p class="text-xs text-gray-500 mb-6">${a.email}</p>
                <div class="w-full flex gap-2 border-t border-gray-100 pt-4">
                    <button class="flex-1 py-2 text-xs font-bold text-black border border-gray-200 rounded-xl hover:bg-gray-50 btn-edit-admin">Edit Profile</button>
                    <button class="flex-1 py-2 text-xs font-bold text-red-500 border border-red-100 rounded-xl hover:bg-red-50 btn-delete-admin">Delete</button>
                </div>
            </div>`;
      })
      .join("");

    SuperAdminApp.bindAdminCardButtons();
  },

  bindAdminCardButtons: () => {
    document.querySelectorAll(".btn-edit-admin").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const card = btn.closest(".admin-card");
        SuperAdminApp.currentAdminId = card?.dataset?.adminId;
        SuperAdminApp.currentAdminName = card?.dataset?.adminName || "Admin";
        SuperAdminApp.showEditAdminModal();
      };
    });

    document.querySelectorAll(".btn-delete-admin").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const card = btn.closest(".admin-card");
        const adminId = card?.dataset?.adminId;
        const adminName = card?.dataset?.adminName || "Admin";
        SuperAdminApp.handleDeleteAdmin(adminId, adminName);
      };
    });
  },

  // ── Add Admin Modal ───────────────────────────────────────────────────────
  showAddAdminModal: () => {
    const modal = document.getElementById("add-admin-modal");
    if (modal) modal.classList.add("active");
  },

  hideAddAdminModal: () => {
    const modal = document.getElementById("add-admin-modal");
    if (modal) modal.classList.remove("active");
  },

  createAdmin: async () => {
    const name = document.getElementById("input-new-admin-name")?.value?.trim();
    const email = document.getElementById("input-new-admin-email")?.value?.trim();
    const department = document.getElementById("input-new-admin-dept")?.value;
    const password = document.getElementById("input-new-admin-password")?.value?.trim() || "Welcome@123";

    if (!name || !email) {
      SuperAdminApp.showToast("Missing Fields", "Please fill name and email.", "error");
      return;
    }

    const result = await API.createAdmin({ name, email, department, password });
    if (result.success) {
      SuperAdminApp.showToast("Admin Created", `"${name}" added to ${department} department.`);
      SuperAdminApp.hideAddAdminModal();
      document.getElementById("input-new-admin-name").value = "";
      document.getElementById("input-new-admin-email").value = "";
      await SuperAdminApp.loadAdmins();
      await SuperAdminApp.loadOverviewStats();
    } else {
      SuperAdminApp.showToast("Error", result.message, "error");
    }
  },

  // ── Edit Admin Modal ──────────────────────────────────────────────────────
  showEditAdminModal: () => {
    const modal = document.getElementById("edit-admin-modal");
    const subtitle = document.getElementById("edit-admin-subtitle");
    if (subtitle)
      subtitle.innerText = `Update details for ${SuperAdminApp.currentAdminName}.`;
    if (modal) {
      modal.style.display = "flex";
      modal.classList.remove("hidden");
    }
  },

  hideEditAdminModal: () => {
    const modal = document.getElementById("edit-admin-modal");
    if (modal) {
      modal.style.display = "none";
      modal.classList.add("hidden");
    }
  },

  confirmEditAdmin: async () => {
    const email = document.getElementById("input-edit-admin-email")?.value?.trim();
    const dept = document.getElementById("input-edit-admin-dept")?.value;

    if (!SuperAdminApp.currentAdminId) return;

    const result = await API.updateAdmin(SuperAdminApp.currentAdminId, {
      email,
      department: dept,
    });
    if (result.success) {
      SuperAdminApp.showToast("Admin Updated", `${SuperAdminApp.currentAdminName}'s profile updated.`);
      SuperAdminApp.hideEditAdminModal();
      await SuperAdminApp.loadAdmins();
    } else {
      SuperAdminApp.showToast("Error", result.message, "error");
    }
  },

  handleDeleteAdmin: (adminId, adminName) => {
    SuperAdminApp.showConfirm(
      "Delete Admin?",
      `Are you sure you want to remove "${adminName}"? This cannot be undone.`,
      () => SuperAdminApp.deleteAdmin(adminId, adminName),
    );
  },

  deleteAdmin: async (adminId, adminName) => {
    const result = await API.deleteAdmin(adminId);
    if (result.success) {
      SuperAdminApp.showToast("Admin Removed", `"${adminName}" has been deleted.`);
      await SuperAdminApp.loadAdmins();
      await SuperAdminApp.loadOverviewStats();
    } else {
      SuperAdminApp.showToast("Error", result.message, "error");
    }
  },

  // ── Password Modal ────────────────────────────────────────────────────────
  showPasswordModal: () => {
    const modal = document.getElementById("password-modal");
    if (modal) {
      modal.style.display = "flex";
      modal.classList.remove("hidden");
    }
  },

  hidePasswordModal: () => {
    const modal = document.getElementById("password-modal");
    if (modal) {
      modal.style.display = "none";
      modal.classList.add("hidden");
    }
  },

  confirmPasswordChange: async () => {
    const current = document.getElementById("input-current-password")?.value;
    const newPass = document.getElementById("input-new-password")?.value;
    const confirm = document.getElementById("input-confirm-password")?.value;

    if (!current || !newPass || !confirm) {
      SuperAdminApp.showToast("Missing Fields", "Please fill all fields.", "error");
      return;
    }
    if (newPass !== confirm) {
      SuperAdminApp.showToast("Mismatch", "Passwords do not match.", "error");
      return;
    }
    if (newPass.length < 6) {
      SuperAdminApp.showToast("Too Short", "Min 6 characters required.", "error");
      return;
    }

    const result = await API.changePassword(current, newPass);
    if (result.success) {
      SuperAdminApp.showToast("Password Changed", "Updated successfully.");
      SuperAdminApp.hidePasswordModal();
      ["input-current-password", "input-new-password", "input-confirm-password"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
    } else {
      SuperAdminApp.showToast("Error", result.message, "error");
    }
  },

  // ── Helpers ───────────────────────────────────────────────────────────────
  getStatusClass: (s) => {
    const map = {
      Pending: "text-yellow-600 bg-yellow-50",
      "In Progress": "text-orange-600 bg-orange-50",
      Escalated: "text-red-600 bg-red-50",
      Resolved: "text-green-600 bg-green-50",
    };
    return map[s] || "text-gray-600 bg-gray-100";
  },

  getStatusBadgeClass: (s) => {
    const map = {
      Pending: "bg-yellow-100 text-yellow-700",
      "In Progress": "bg-orange-100 text-orange-700",
      Escalated: "bg-red-100 text-red-700",
      Resolved: "bg-green-100 text-green-700",
    };
    return map[s] || "bg-gray-100 text-gray-600";
  },
};

window.SuperAdminApp = SuperAdminApp;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", SuperAdminApp.init);
} else {
  SuperAdminApp.init();
}
