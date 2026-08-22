const express = require("express");
const router = express.Router();
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const Case = require("../models/Case");
const { protect, restrictTo } = require("../middleware/auth");

/**
 * Compute the date range from a period string.
 * @param {string} period - "weekly" | "15days" | "monthly" | "yearly"
 * @returns {{ start: Date, end: Date, label: string }}
 */
function getDateRange(period) {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case "weekly":
      start.setDate(end.getDate() - 7);
      return { start, end, label: "Last 7 Days" };
    case "15days":
      start.setDate(end.getDate() - 15);
      return { start, end, label: "Last 15 Days" };
    case "monthly":
      start.setMonth(end.getMonth() - 1);
      return { start, end, label: "Last 30 Days" };
    case "yearly":
      start.setFullYear(end.getFullYear() - 1);
      return { start, end, label: "Last 1 Year" };
    default:
      start.setMonth(end.getMonth() - 1);
      return { start, end, label: "Last 30 Days" };
  }
}

/**
 * Build MongoDB aggregation pipeline for report data.
 */
function buildPipeline(department, startDate, endDate) {
  const matchStage = {
    createdAt: { $gte: startDate, $lte: endDate },
  };

  if (department && department !== "all") {
    matchStage.department = department;
  }

  return [
    { $match: matchStage },
    {
      $lookup: {
        from: "users",
        localField: "student",
        foreignField: "_id",
        as: "studentInfo",
      },
    },
    { $unwind: { path: "$studentInfo", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        caseId: 1,
        category: 1,
        subject: 1,
        status: 1,
        department: 1,
        studentName: 1,
        studentEmail: { $ifNull: ["$studentInfo.email", "N/A"] },
        studentRoll: { $ifNull: ["$studentInfo.studentId", "N/A"] },
        isAnonymous: 1,
        escalatedTo: 1,
        escalationReason: 1,
        createdAt: 1,
        resolvedAt: 1,
        messageCount: { $size: { $ifNull: ["$messages", []] } },
      },
    },
    { $sort: { createdAt: -1 } },
  ];
}

// @route   GET /api/reports/download
// @desc    Download report as Excel or PDF
// @access  Private (admin, superadmin)
router.get(
  "/download",
  protect,
  restrictTo("admin", "superadmin"),
  async (req, res) => {
    try {
      const { period = "monthly", format = "excel" } = req.query;

      // Admin can only see their own department; superadmin can pick or see all
      let department;
      if (req.user.role === "admin") {
        department = req.user.department;
      } else {
        department = req.query.department || "all";
      }

      const { start, end, label } = getDateRange(period);
      const pipeline = buildPipeline(department, start, end);
      const cases = await Case.aggregate(pipeline);

      // Summary counts
      const summary = {
        total: cases.length,
        pending: cases.filter((c) => c.status === "Pending").length,
        inProgress: cases.filter((c) => c.status === "In Progress").length,
        escalated: cases.filter((c) => c.status === "Escalated").length,
        resolved: cases.filter((c) => c.status === "Resolved").length,
      };

      const deptLabel =
        department === "all" ? "All Departments" : department + " Department";
      const title = `Grievance Report — ${deptLabel} — ${label}`;

      if (format === "pdf") {
        return generatePDF(res, cases, summary, title);
      }
      return generateExcel(res, cases, summary, title, deptLabel, label);
    } catch (err) {
      console.error("[Reports] Download error:", err.message);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

// ── Excel Generation ──────────────────────────────────────────────────────────

async function generateExcel(
  res,
  cases,
  summary,
  title,
  deptLabel,
  periodLabel,
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Grievance System";
  workbook.created = new Date();

  // ── Summary Sheet ──
  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.columns = [
    { header: "Metric", key: "metric", width: 25 },
    { header: "Count", key: "count", width: 15 },
  ];
  summarySheet.getRow(1).font = { bold: true, size: 12 };
  summarySheet.addRow({ metric: "Department", count: deptLabel });
  summarySheet.addRow({ metric: "Period", count: periodLabel });
  summarySheet.addRow({ metric: "Total Cases", count: summary.total });
  summarySheet.addRow({ metric: "Pending", count: summary.pending });
  summarySheet.addRow({ metric: "In Progress", count: summary.inProgress });
  summarySheet.addRow({ metric: "Escalated", count: summary.escalated });
  summarySheet.addRow({ metric: "Resolved", count: summary.resolved });

  // ── Cases Sheet ──
  const caseSheet = workbook.addWorksheet("Cases");
  caseSheet.columns = [
    { header: "Case ID", key: "caseId", width: 12 },
    { header: "Category", key: "category", width: 22 },
    { header: "Subject", key: "subject", width: 35 },
    { header: "Student", key: "student", width: 20 },
    { header: "Roll No", key: "roll", width: 15 },
    { header: "Email", key: "email", width: 25 },
    { header: "Department", key: "department", width: 16 },
    { header: "Status", key: "status", width: 14 },
    { header: "Messages", key: "messages", width: 10 },
    { header: "Filed On", key: "filed", width: 18 },
    { header: "Resolved On", key: "resolved", width: 18 },
  ];
  caseSheet.getRow(1).font = { bold: true, size: 11 };
  caseSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1D1D1F" },
  };
  caseSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  for (const c of cases) {
    caseSheet.addRow({
      caseId: c.caseId,
      category: c.category,
      subject: c.subject,
      student: c.isAnonymous ? "Anonymous" : c.studentName,
      roll: c.isAnonymous ? "Hidden" : c.studentRoll,
      email: c.isAnonymous ? "Hidden" : c.studentEmail,
      department: c.department,
      status: c.status,
      messages: c.messageCount,
      filed: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "",
      resolved: c.resolvedAt
        ? new Date(c.resolvedAt).toLocaleDateString()
        : "—",
    });
  }

  const filename = `grievance_report_${Date.now()}.xlsx`;
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
}

// ── PDF Generation ────────────────────────────────────────────────────────────

function generatePDF(res, cases, summary, title) {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 40 });

  const filename = `grievance_report_${Date.now()}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  doc.pipe(res);

  // Title
  doc.fontSize(16).font("Helvetica-Bold").text(title, { align: "center" });
  doc.moveDown(0.5);
  doc
    .fontSize(9)
    .font("Helvetica")
    .text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
  doc.moveDown(1);

  // Summary
  doc.fontSize(11).font("Helvetica-Bold").text("Summary");
  doc.moveDown(0.3);
  doc
    .fontSize(9)
    .font("Helvetica")
    .text(
      `Total: ${summary.total}  |  Pending: ${summary.pending}  |  In Progress: ${summary.inProgress}  |  Escalated: ${summary.escalated}  |  Resolved: ${summary.resolved}`,
    );
  doc.moveDown(1);

  // Table header
  const tableTop = doc.y;
  const cols = [
    { label: "Case ID", x: 40, w: 65 },
    { label: "Category", x: 105, w: 100 },
    { label: "Subject", x: 205, w: 160 },
    { label: "Student", x: 365, w: 100 },
    { label: "Status", x: 465, w: 70 },
    { label: "Department", x: 535, w: 80 },
    { label: "Filed On", x: 615, w: 75 },
    { label: "Resolved", x: 690, w: 75 },
  ];

  doc.fontSize(8).font("Helvetica-Bold");
  for (const col of cols) {
    doc.text(col.label, col.x, tableTop, { width: col.w, ellipsis: true });
  }
  doc
    .moveTo(40, tableTop + 12)
    .lineTo(765, tableTop + 12)
    .stroke();

  // Table rows
  let y = tableTop + 16;
  doc.font("Helvetica").fontSize(7);

  for (const c of cases) {
    if (y > 540) {
      doc.addPage();
      y = 40;
    }

    const row = [
      c.caseId,
      c.category,
      c.subject,
      c.isAnonymous ? "Anonymous" : c.studentName,
      c.status,
      c.department,
      c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "",
      c.resolvedAt ? new Date(c.resolvedAt).toLocaleDateString() : "—",
    ];

    for (let i = 0; i < cols.length; i++) {
      doc.text(row[i] || "", cols[i].x, y, {
        width: cols[i].w,
        ellipsis: true,
      });
    }
    y += 14;
  }

  doc.end();
}

module.exports = router;
