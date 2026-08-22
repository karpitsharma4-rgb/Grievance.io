import { defineConfig } from "vite";

export default defineConfig({
  // index.html is at the project root — Vite picks it up automatically.
  // Serve the whole project root so /js/* and /pages/* resolve correctly.
  root: ".",

  server: {
    port: 5173,
    open: true, // opens http://localhost:5173/ on `vite` start
  },

  build: {
    outDir: "dist",
    rollupOptions: {
      // Multi-page application: one entry per HTML file
      input: {
        main: "index.html",
        auth: "pages/auth.html",
        student: "pages/student_dashboard.html",
        normal_admin: "pages/normal_admin.html",
        superadmin: "pages/superadmin.html",
      },
    },
  },
});
