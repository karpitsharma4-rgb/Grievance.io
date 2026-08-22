import API from "./api.js";

const VIEW_IDS = ["login", "register", "forgot", "otp"];

let forgotEmail = "";

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

const AuthApp = {
  getDashboardPath: (role) => {
    return role === "student"
      ? "student_dashboard.html"
      : role === "superadmin"
        ? "superadmin.html"
        : "normal_admin.html";
  },

  showAuthShell: () => {
    const shell = document.getElementById("auth-shell");
    if (shell) {
      shell.classList.remove("is-pending");
    }
  },

  switchView: (viewName) => {
    VIEW_IDS.forEach((name) => {
      const el = document.getElementById(`view-${name}`);
      if (!el) return;

      el.classList.remove("active-view");
      el.classList.add("hidden-view");

      setTimeout(() => {
        if (!el.classList.contains("active-view")) {
          el.style.display = "none";
        }
      }, 400);
    });

    const target = document.getElementById(`view-${viewName}`);
    if (target) {
      target.style.display = "block";
      setTimeout(() => {
        target.classList.remove("hidden-view");
        target.classList.add("active-view");
      }, 20);
    }
  },

  bindNavigation: () => {
    document.getElementById("btn-switch-register").onclick = () =>
      AuthApp.switchView("register");
    document.getElementById("btn-switch-login").onclick = () =>
      AuthApp.switchView("login");
    document.getElementById("btn-back-login").onclick = () =>
      AuthApp.switchView("login");
    document.getElementById("btn-switch-forgot").onclick = () =>
      AuthApp.switchView("forgot");
    document.getElementById("btn-back-forgot").onclick = () =>
      AuthApp.switchView("forgot");
  },

  bindLogin: () => {
    document
      .getElementById("form-login")
      .addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("input-login-email").value.trim();
        const password = document.getElementById("input-login-password").value;
        const rememberMe = document.getElementById(
          "input-login-remember",
        ).checked;
        const btn = document.getElementById("btn-login-submit");

        btn.disabled = true;
        btn.innerText = "Signing in…";

        const result = await API.login(email, password, rememberMe);

        btn.disabled = false;
        btn.innerText = "Sign in";

        if (result.success) {
          window.location.href = AuthApp.getDashboardPath(result.user.role);
        } else {
          alert(result.message);
        }
      });
  },

  bindRegister: () => {
    document
      .getElementById("form-register")
      .addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document
          .getElementById("input-register-fullname")
          .value.trim();
        const email = document
          .getElementById("input-register-email")
          .value.trim();
        const password = document.getElementById(
          "input-register-password",
        ).value;
        const studentId = document
          .getElementById("input-register-studentid")
          .value.trim();
        const phone = document
          .getElementById("input-register-phone")
          .value.trim();
        const btn = document.getElementById("btn-register-submit");

        btn.disabled = true;
        btn.innerText = "Creating account…";

        const result = await API.register({
          name,
          email,
          password,
          studentId,
          phone,
        });

        btn.disabled = false;
        btn.innerText = "Create Account";

        if (result.success) {
          window.location.href = "student_dashboard.html";
        } else {
          alert(result.message);
        }
      });
  },

  bindForgotPassword: () => {
    document
      .getElementById("form-forgot")
      .addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document
          .getElementById("input-forgot-email")
          .value.trim();
        const btn = document.getElementById("btn-forgot-submit");

        if (!email) {
          alert("Please enter your email address.");
          return;
        }

        btn.disabled = true;
        btn.innerText = "Sending OTP…";

        const result = await API.forgotPassword(email);

        btn.disabled = false;
        btn.innerText = "Send OTP";

        if (result.success) {
          forgotEmail = email;
          AuthApp.switchView("otp");
        } else {
          alert(result.message);
        }
      });
  },

  bindOtpReset: () => {
    document
      .getElementById("form-otp")
      .addEventListener("submit", async (e) => {
        e.preventDefault();

        const otp = document.getElementById("input-otp-code").value.trim();
        const newPass = document.getElementById("input-otp-newpass").value;
        const confirmPass = document.getElementById(
          "input-otp-confirmpass",
        ).value;

        if (otp.length !== 6) {
          alert("Please enter the 6-digit OTP.");
          return;
        }
        if (!newPass) {
          alert("Please enter a new password.");
          return;
        }
        if (newPass !== confirmPass) {
          alert("Passwords do not match.");
          return;
        }
        if (newPass.length < 6) {
          alert("Password must be at least 6 characters.");
          return;
        }

        const result = await API.resetPassword(forgotEmail, otp, newPass);
        if (result.success) {
          alert("✅ Password reset successfully! Please sign in.");
          document.getElementById("input-otp-code").value = "";
          document.getElementById("input-otp-newpass").value = "";
          document.getElementById("input-otp-confirmpass").value = "";
          AuthApp.switchView("login");
        } else {
          alert("❌ " + result.message);
        }
      });
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

  restoreSession: async () => {
    const session = API.getSession();
    if (!session?.token) {
      AuthApp.showAuthShell();
      return;
    }

    const result = await API.getMe();

    if (result.success && result.user?.role) {
      API.saveSession(
        result.user,
        session.token,
        API.getSessionStorage() === localStorage,
      );
      window.location.replace(AuthApp.getDashboardPath(result.user.role));
      return;
    }

    API.logout();
    AuthApp.showAuthShell();
  },

  init: async () => {
    AuthApp.bindNavigation();
    AuthApp.bindLogin();
    AuthApp.bindRegister();
    AuthApp.bindForgotPassword();
    AuthApp.bindOtpReset();
    AuthApp.bindPasswordToggles();
    await AuthApp.restoreSession();
  },
};

window.switchView = AuthApp.switchView;
window.AuthApp = AuthApp;

AuthApp.init();

export default AuthApp;
