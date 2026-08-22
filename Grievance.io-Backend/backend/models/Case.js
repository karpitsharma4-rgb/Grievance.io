const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true, // 'Student', 'Admin', 'SuperAdmin'
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  text: {
    type: String,
    required: true,
  },
  isInternal: {
    type: Boolean,
    default: false, // true = internal note (admin-only)
  },
  time: {
    type: Date,
    default: Date.now,
  },
});

const caseSchema = new mongoose.Schema(
  {
    caseId: {
      type: String,
      unique: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Academic Affairs",
        "Administration",
        "Facilities & Infrastructure",
        "IT & Technical Support",
        "Student Welfare & Discipline",
      ],
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Escalated", "Resolved"],
      default: "Pending",
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    studentName: {
      type: String,
      default: "",
    },
    department: {
      type: String,
      enum: [
        "Academic Affairs",
        "Administration",
        "Facilities & Infrastructure",
        "IT & Technical Support",
        "Student Welfare & Discipline",
      ],
      default: "Administration",
    },
    assignedAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedAdminName: {
      type: String,
      default: "",
    },
    messages: [messageSchema],
    attachments: [
      {
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        path: String,
      },
    ],
    escalatedTo: {
      type: String,
      default: "",
    },
    escalationReason: {
      type: String,
      default: "",
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Auto-generate caseId before saving
caseSchema.pre("save", async function () {
  if (!this.caseId) {
    const count = await mongoose.model("Case").countDocuments();
    this.caseId = `G-${1000 + count + 1}`;
  }
});

module.exports = mongoose.model("Case", caseSchema);
