/**
 * ─────────────────────────────────────────────────────────────────
 *  Grievance System — Rich Seed Script
 *  Compatible with: 5-department schema, no isAnonymous, no slaDeadline
 *
 *  Run from the backend folder:
 *    node backend/seed.js
 *
 *  Credentials after seed:
 *    Super Admin  → super@demo.com        / demo123
 *    Admin (AA)   → admin.academic@demo.com / demo123
 *    Admin (ADM)  → admin.admin@demo.com    / demo123
 *    Admin (FAC)  → admin.facilities@demo.com / demo123
 *    Admin (IT)   → admin.it@demo.com       / demo123
 *    Admin (SWD)  → admin.welfare@demo.com  / demo123
 *    Student 1    → arjun@demo.com          / demo123
 *    Student 2    → priya@demo.com          / demo123
 *    Student 3    → rahul@demo.com          / demo123
 *    Student 4    → sneha@demo.com          / demo123
 *    Student 5    → kiran@demo.com          / demo123
 * ─────────────────────────────────────────────────────────────────
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Case = require("./models/Case");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/grievancedb";

// ── Helpers ──────────────────────────────────────────────────────────────────

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const hoursAgo = (n) => new Date(Date.now() - n * 60 * 60 * 1000);

// ── Users ─────────────────────────────────────────────────────────────────────

const plainUsers = [
  // Super Admin
  {
    name: "Dr. Ananya Sharma",
    email: "super@demo.com",
    password: "demo123",
    role: "superadmin",
    phone: "+91 98100 00001",
  },

  // Department Admins
  {
    name: "Prof. Vikram Nair",
    email: "admin.academic@demo.com",
    password: "demo123",
    role: "admin",
    department: "Academic Affairs",
    phone: "+91 98100 00002",
  },
  {
    name: "Ms. Rekha Joshi",
    email: "admin.admin@demo.com",
    password: "demo123",
    role: "admin",
    department: "Administration",
    phone: "+91 98100 00003",
  },
  {
    name: "Mr. Suresh Iyer",
    email: "admin.facilities@demo.com",
    password: "demo123",
    role: "admin",
    department: "Facilities & Infrastructure",
    phone: "+91 98100 00004",
  },
  {
    name: "Ms. Deepa Menon",
    email: "admin.it@demo.com",
    password: "demo123",
    role: "admin",
    department: "IT & Technical Support",
    phone: "+91 98100 00005",
  },
  {
    name: "Dr. Ramesh Pillai",
    email: "admin.welfare@demo.com",
    password: "demo123",
    role: "admin",
    department: "Student Welfare & Discipline",
    phone: "+91 98100 00006",
  },

  // Students
  {
    name: "Arjun Mehta",
    email: "arjun@demo.com",
    password: "demo123",
    role: "student",
    phone: "+91 90000 10001",
    studentId: "2022CS101",
  },
  {
    name: "Priya Krishnan",
    email: "priya@demo.com",
    password: "demo123",
    role: "student",
    phone: "+91 90000 10002",
    studentId: "2022EC202",
  },
  {
    name: "Rahul Desai",
    email: "rahul@demo.com",
    password: "demo123",
    role: "student",
    phone: "+91 90000 10003",
    studentId: "2023ME303",
  },
  {
    name: "Sneha Patel",
    email: "sneha@demo.com",
    password: "demo123",
    role: "student",
    phone: "+91 90000 10004",
    studentId: "2023CE404",
  },
  {
    name: "Kiran Rao",
    email: "kiran@demo.com",
    password: "demo123",
    role: "student",
    phone: "+91 90000 10005",
    studentId: "2021IT505",
  },
];

// ── Seed Function ─────────────────────────────────────────────────────────────

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅  Connected to MongoDB:", MONGO_URI);

    // ── Wipe old data ──────────────────────────────────────────────
    await User.deleteMany({});
    await Case.deleteMany({});
    console.log("🗑️   Cleared all existing Users and Cases");

    // ── Hash passwords and create users ───────────────────────────
    const hashedUsers = await Promise.all(
      plainUsers.map(async (u) => ({
        ...u,
        password: await bcrypt.hash(u.password, 10),
      }))
    );

    const createdUsers = await User.insertMany(hashedUsers, {
      // Skip Mongoose validation so we bypass the pre('save') hook
      // (passwords are already hashed above)
      validateBeforeSave: false,
    });

    console.log(`👤  Created ${createdUsers.length} users`);

    // ── Extract references ─────────────────────────────────────────
    const superAdmin = createdUsers.find((u) => u.role === "superadmin");

    const adminByDept = (dept) =>
      createdUsers.find((u) => u.role === "admin" && u.department === dept);

    const adminAA  = adminByDept("Academic Affairs");
    const adminADM = adminByDept("Administration");
    const adminFAC = adminByDept("Facilities & Infrastructure");
    const adminIT  = adminByDept("IT & Technical Support");
    const adminSWD = adminByDept("Student Welfare & Discipline");

    const byEmail = (e) => createdUsers.find((u) => u.email === e);
    const arjun = byEmail("arjun@demo.com");
    const priya = byEmail("priya@demo.com");
    const rahul = byEmail("rahul@demo.com");
    const sneha = byEmail("sneha@demo.com");
    const kiran = byEmail("kiran@demo.com");

    // ── Build Cases ────────────────────────────────────────────────

    const cases = [

      // ══════════════════════════════════════════════════════════════
      // 1. ACADEMIC AFFAIRS — Pending (brand new, no interaction)
      // ══════════════════════════════════════════════════════════════
      {
        caseId: "G-1001",
        category: "Academic Affairs",
        department: "Academic Affairs",
        subject: "Grade recalculation request for Semester 5 Mathematics",
        description:
          "My internal marks for MAT501 show 34/50 on the portal, but the paper I received back shows 41/50. I have the physical answer sheet with the professor's signature which clearly shows the correct score. Requesting a formal grade review and correction before the final transcript is generated.",
        status: "Pending",
        student: arjun._id,
        studentName: arjun.name,
        messages: [],
        createdAt: daysAgo(1),
      },

      // ══════════════════════════════════════════════════════════════
      // 2. ACADEMIC AFFAIRS — In Progress (active conversation)
      // ══════════════════════════════════════════════════════════════
      {
        caseId: "G-1002",
        category: "Academic Affairs",
        department: "Academic Affairs",
        subject: "Incorrect attendance record preventing exam appearance",
        description:
          "The system shows my attendance in PHY402 as 58%, below the required 75%. However I was present in all sessions. I have photos with timestamps from inside the classroom for the dates marked absent. The biometric scanner near Lab 3 has been malfunctioning for weeks. Please correct this before the exam hall tickets are issued.",
        status: "In Progress",
        student: priya._id,
        studentName: priya.name,
        assignedAdmin: adminAA._id,
        assignedAdminName: adminAA.name,
        messages: [
          {
            sender: "Student",
            senderId: priya._id,
            text: "I filed this 3 days ago. Any update? Exam is next week.",
            time: daysAgo(2),
          },
          {
            sender: "Admin",
            senderId: adminAA._id,
            text: "Hello Priya, I have forwarded the matter to the Physics department coordinator. We are cross-checking the biometric logs against the manual register. Please provide the class photos to this email: phycoord@university.edu",
            time: daysAgo(2),
          },
          {
            sender: "Student",
            senderId: priya._id,
            text: "Sent the photos to that email. They include date and time metadata. Please expedite.",
            time: daysAgo(1),
          },
          {
            sender: "Admin",
            senderId: adminAA._id,
            text: "Photos received. We are verifying with the faculty. Expected resolution within 24 hours.",
            time: hoursAgo(18),
          },
        ],
        createdAt: daysAgo(5),
      },

      // ══════════════════════════════════════════════════════════════
      // 3. ACADEMIC AFFAIRS — Resolved
      // ══════════════════════════════════════════════════════════════
      {
        caseId: "G-1003",
        category: "Academic Affairs",
        department: "Academic Affairs",
        subject: "Missing elective credit from transfer university",
        description:
          "I transferred from NIT Surathkal in Semester 3. My transcript shows 4 credits for the elective ELE201 I completed there, but the credit transfer is not reflected in my current university portal, making me appear 4 credits short for graduation.",
        status: "Resolved",
        student: rahul._id,
        studentName: rahul.name,
        assignedAdmin: adminAA._id,
        assignedAdminName: adminAA.name,
        resolvedAt: daysAgo(3),
        messages: [
          {
            sender: "Admin",
            senderId: adminAA._id,
            text: "Rahul, we have received confirmation from NIT Surathkal's registrar. Your 4 elective credits for ELE201 have been manually added to your record.",
            time: daysAgo(4),
          },
          {
            sender: "Student",
            senderId: rahul._id,
            text: "I can see the credits now on the portal. Thank you so much!",
            time: daysAgo(4),
          },
          {
            sender: "Admin",
            senderId: adminAA._id,
            text: "You're welcome. The case is now marked as resolved. Your updated transcript will be available within 2 working days.",
            time: daysAgo(3),
          },
        ],
        createdAt: daysAgo(10),
      },

      // ══════════════════════════════════════════════════════════════
      // 4. ACADEMIC AFFAIRS — Escalated (require superadmin)
      // ══════════════════════════════════════════════════════════════
      {
        caseId: "G-1004",
        category: "Academic Affairs",
        department: "Academic Affairs",
        subject: "Alleged bias in PhD admission interview scoring",
        description:
          "I appeared for the PhD (CS) interview on Jan 12th. My written score was 91/100 (highest in the batch), yet I was rejected while candidates with lower written scores were admitted. Three other applicants have independently raised the same concern. We are requesting a formal review of the scoring rubric and interview panel notes under RTI.",
        status: "Escalated",
        student: kiran._id,
        studentName: kiran.name,
        assignedAdmin: adminAA._id,
        assignedAdminName: adminAA.name,
        escalatedTo: "Super Admin",
        escalationReason:
          "Multiple students allege systemic bias in PhD admission process. Requires institutional-level investigation beyond department scope.",
        messages: [
          {
            sender: "Student",
            senderId: kiran._id,
            text: "This is a serious issue affecting multiple students. We need transparency in the evaluation process.",
            time: daysAgo(6),
          },
          {
            sender: "Admin",
            senderId: adminAA._id,
            text: "I understand your concern. I have reviewed the initial complaint but this is beyond the department's purview. Escalating to the Super Administrator for a formal institutional review.",
            time: daysAgo(5),
          },
          {
            sender: "Student",
            senderId: kiran._id,
            text: "Thank you. Please ensure the interview panel notes are preserved as evidence.",
            time: daysAgo(5),
          },
        ],
        createdAt: daysAgo(8),
      },

      // ══════════════════════════════════════════════════════════════
      // 5. ADMINISTRATION — Pending
      // ══════════════════════════════════════════════════════════════
      {
        caseId: "G-1005",
        category: "Administration",
        department: "Administration",
        subject: "Scholarship disbursement delayed by 2 months",
        description:
          "My State Merit Scholarship (ID: SMS-2023-4821) was due in October but has not been credited yet. I have confirmed with the state portal that the funds were released to the university on October 3rd. I am dependent on this for hostel fees and it is now causing financial hardship. Reference number from state portal: TN/SCH/2023/84921.",
        status: "Pending",
        student: sneha._id,
        studentName: sneha.name,
        messages: [],
        createdAt: daysAgo(2),
      },

      // ══════════════════════════════════════════════════════════════
      // 6. ADMINISTRATION — In Progress
      // ══════════════════════════════════════════════════════════════
      {
        caseId: "G-1006",
        category: "Administration",
        department: "Administration",
        subject: "Name spelling error on official degree certificate",
        description:
          "My name on the degree certificate issued in May convocation reads 'AJURN MEHTA' instead of 'ARJUN MEHTA'. I need this corrected on an urgent basis as I have submitted the diploma to a potential employer and they flagged the discrepancy.",
        status: "In Progress",
        student: arjun._id,
        studentName: arjun.name,
        assignedAdmin: adminADM._id,
        assignedAdminName: adminADM.name,
        messages: [
          {
            sender: "Admin",
            senderId: adminADM._id,
            text: "Arjun, we have identified the data entry error in the convocation records. A corrected certificate is being printed and will be dispatched within 5-7 working days.",
            time: daysAgo(3),
          },
          {
            sender: "Student",
            senderId: arjun._id,
            text: "Thank you! Will there also be a corrected digital copy on DigiLocker?",
            time: daysAgo(3),
          },
          {
            sender: "Admin",
            senderId: adminADM._id,
            text: "Yes. The DigiLocker update will happen simultaneously. We will notify you via email.",
            time: daysAgo(2),
          },
        ],
        createdAt: daysAgo(7),
      },

      // ══════════════════════════════════════════════════════════════
      // 7. ADMINISTRATION — Resolved
      // ══════════════════════════════════════════════════════════════
      {
        caseId: "G-1007",
        category: "Administration",
        department: "Administration",
        subject: "Bonafide certificate not generated despite 3 requests",
        description:
          "I have requested a bonafide certificate three times through the student portal over the past month. Each time I receive an automated email that it will be ready in 3 days, but nothing happens. I urgently need this for a bank loan application.",
        status: "Resolved",
        student: priya._id,
        studentName: priya.name,
        assignedAdmin: adminADM._id,
        assignedAdminName: adminADM.name,
        resolvedAt: daysAgo(1),
        messages: [
          {
            sender: "Admin",
            senderId: adminADM._id,
            text: "Priya, the prior requests were not processed due to a backend queue issue. Your bonafide certificate has been generated and emailed to you now. Digital copy also uploaded to the student portal.",
            time: daysAgo(2),
          },
          {
            sender: "Student",
            senderId: priya._id,
            text: "Received it! Thank you for resolving this finally.",
            time: daysAgo(1),
          },
        ],
        createdAt: daysAgo(12),
      },

      // ══════════════════════════════════════════════════════════════
      // 8. ADMINISTRATION — Escalated
      // ══════════════════════════════════════════════════════════════
      {
        caseId: "G-1008",
        category: "Administration",
        department: "Administration",
        subject: "Unjustified fine of ₹15,000 on student account",
        description:
          "My student account has a ₹15,000 fine labeled 'Library Damage - Sept 2024'. I have never damaged any library property. I requested proof of damage from the Administration Office but was told no documentation exists. I believe this is an error or misattribution. The fine is blocking my exam registration.",
        status: "Escalated",
        student: rahul._id,
        studentName: rahul.name,
        assignedAdmin: adminADM._id,
        assignedAdminName: adminADM.name,
        escalatedTo: "Super Admin",
        escalationReason:
          "Student disputes a large fine with no supporting documentation. Administration unable to provide proof. Requires higher authority review to waive or uphold the charge.",
        messages: [
          {
            sender: "Student",
            senderId: rahul._id,
            text: "I would like to know the specific book or item I allegedly damaged, the date, and any staff witness. None of this was provided.",
            time: daysAgo(9),
          },
          {
            sender: "Admin",
            senderId: adminADM._id,
            text: "We have investigated and cannot locate the supporting fine issuance record. This matter requires a decision from the Super Administrator on whether to waive the charge.",
            time: daysAgo(7),
          },
          {
            sender: "Student",
            senderId: rahul._id,
            text: "My exams are in 2 weeks. Please resolve this urgently.",
            time: daysAgo(6),
          },
        ],
        createdAt: daysAgo(11),
      },

      // ══════════════════════════════════════════════════════════════
      // 9. FACILITIES & INFRASTRUCTURE — Pending
      // ══════════════════════════════════════════════════════════════
      {
        caseId: "G-1009",
        category: "Facilities & Infrastructure",
        department: "Facilities & Infrastructure",
        subject: "Hostel Block C — water supply cut since 48 hours",
        description:
          "The water supply to Hostel Block C (rooms 301–430) has been completely cut for the past 48 hours. Approximately 130 students are affected. We cannot bathe, flush toilets, or maintain hygiene. The hostel supervisor said a pump broke but no repair timeline has been given. Please treat this as an emergency.",
        status: "Pending",
        student: arjun._id,
        studentName: arjun.name,
        messages: [],
        createdAt: hoursAgo(6),
      },

      // ══════════════════════════════════════════════════════════════
      // 10. FACILITIES & INFRASTRUCTURE — Pending
      // ══════════════════════════════════════════════════════════════
      {
        caseId: "G-1010",
        category: "Facilities & Infrastructure",
        department: "Facilities & Infrastructure",
        subject: "Broken street lights on campus main road — safety hazard",
        description:
          "The stretch of road between Gate 2 and the Library building has no functional street lights. Eleven lights have been broken for over 3 weeks. Students returning from the library after 8 PM face a genuine safety risk. Two near-accidents involving bicycles have already been reported to the security desk.",
        status: "Pending",
        student: sneha._id,
        studentName: sneha.name,
        messages: [],
        createdAt: daysAgo(3),
      },

      // ══════════════════════════════════════════════════════════════
      // 11. FACILITIES & INFRASTRUCTURE — In Progress
      // ══════════════════════════════════════════════════════════════
      {
        caseId: "G-1011",
        category: "Facilities & Infrastructure",
        department: "Facilities & Infrastructure",
        subject: "Mess food quality severely deteriorated — multiple complaints",
        description:
          "For the past 2 weeks, the Central Mess has been serving undercooked rice, stale dal, and spoiled vegetables at dinner. At least 15 students reported stomach issues this week, 3 of whom visited the campus health center. We have photographs and videos. The mess contractor should be held accountable and the food quality inspected.",
        status: "In Progress",
        student: kiran._id,
        studentName: kiran.name,
        assignedAdmin: adminFAC._id,
        assignedAdminName: adminFAC.name,
        messages: [
          {
            sender: "Admin",
            senderId: adminFAC._id,
            text: "Kiran, thank you for this detailed report. I have issued notice to the mess contractor and scheduled a surprise food quality inspection for tomorrow. The health center records have been requested.",
            time: daysAgo(4),
          },
          {
            sender: "Student",
            senderId: kiran._id,
            text: "Tonight's dinner again had spoiled curry — 8 more students affected. Please escalate if needed.",
            time: daysAgo(3),
          },
          {
            sender: "Admin",
            senderId: adminFAC._id,
            text: "The inspection was conducted today. Several violations found. A show-cause notice has been issued to the contractor. Temporary catering arrangement is being made for the next 3 days.",
            time: daysAgo(2),
          },
          {
            sender: "Student",
            senderId: kiran._id,
            text: "Today's food was noticeably better. Thank you for taking action.",
            time: daysAgo(1),
          },
        ],
        createdAt: daysAgo(6),
      },

      // ══════════════════════════════════════════════════════════════
      // 12. FACILITIES & INFRASTRUCTURE — Resolved
      // ══════════════════════════════════════════════════════════════
      {
        caseId: "G-1012",
        category: "Facilities & Infrastructure",
        department: "Facilities & Infrastructure",
        subject: "Classroom AC in Room 204 not working during exams",
        description:
          "The AC in Room 204 (capacity 60 students) has been broken for 10 days. This room is scheduled for end-semester exams next week. The temperature inside during afternoon hours crosses 36°C. Students with heat sensitivities are especially impacted.",
        status: "Resolved",
        student: priya._id,
        studentName: priya.name,
        assignedAdmin: adminFAC._id,
        assignedAdminName: adminFAC.name,
        resolvedAt: daysAgo(2),
        messages: [
          {
            sender: "Admin",
            senderId: adminFAC._id,
            text: "Prioritized this. The AC compressor has been replaced today. Please verify if the room temperature is now comfortable.",
            time: daysAgo(3),
          },
          {
            sender: "Student",
            senderId: priya._id,
            text: "Yes! The AC is working now. Room is cool. Thank you for the quick fix before the exams.",
            time: daysAgo(2),
          },
        ],
        createdAt: daysAgo(11),
      },

      // ══════════════════════════════════════════════════════════════
      // 13. FACILITIES & INFRASTRUCTURE — Escalated
      // ══════════════════════════════════════════════════════════════
      {
        caseId: "G-1013",
        category: "Facilities & Infrastructure",
        department: "Facilities & Infrastructure",
        subject: "Structural cracks in Lab Building E — potential safety risk",
        description:
          "Visible cracks have appeared along the walls and ceiling of Lab E (ground floor). The cracks have widened noticeably over the last 2 weeks. An unofficial assessment by a civil engineering faculty member suggested possible foundation settling. No official notice has been issued and students are still using the labs. We request an authorized structural audit immediately.",
        status: "Escalated",
        student: rahul._id,
        studentName: rahul.name,
        assignedAdmin: adminFAC._id,
        assignedAdminName: adminFAC.name,
        escalatedTo: "Super Admin",
        escalationReason:
          "Potential structural safety hazard in a student-occupied building. Requires institutional-level authorization for a professional structural audit and possible temporary closure.",
        messages: [
          {
            sender: "Student",
            senderId: rahul._id,
            text: "Photos attached in the original submission. The largest crack is now about 3cm wide near the window column.",
            time: daysAgo(7),
          },
          {
            sender: "Admin",
            senderId: adminFAC._id,
            text: "I have inspected the site. The cracks are significant enough to warrant a certified structural engineer's assessment. This is beyond the Facilities department's authority to authorize alone. Escalating for an institutional decision.",
            time: daysAgo(6),
          },
          {
            sender: "Student",
            senderId: rahul._id,
            text: "Please close the lab in the meantime. Students are at risk sitting below those cracks.",
            time: daysAgo(6),
          },
        ],
        createdAt: daysAgo(9),
      },

      // ══════════════════════════════════════════════════════════════
      // 14. IT & TECHNICAL SUPPORT — Pending
      // ══════════════════════════════════════════════════════════════
      {
        caseId: "G-1014",
        category: "IT & Technical Support",
        department: "IT & Technical Support",
        subject: "Student portal login broken — cannot access exam schedule",
        description:
          "Since March 10th, I cannot log in to the student portal. I get the error: 'Session token invalid. Please contact IT support.' I have tried on 3 different browsers and my mobile. Password reset also fails — I never receive the OTP. My exam schedule and hall ticket are only accessible through the portal. Exams start in 4 days.",
        status: "Pending",
        student: sneha._id,
        studentName: sneha.name,
        messages: [],
        createdAt: hoursAgo(12),
      },

      // ══════════════════════════════════════════════════════════════
      // 15. IT & TECHNICAL SUPPORT — In Progress (with internal note)
      // ══════════════════════════════════════════════════════════════
      {
        caseId: "G-1015",
        category: "IT & Technical Support",
        department: "IT & Technical Support",
        subject: "Campus WiFi completely inaccessible in entire Boys Hostel",
        description:
          "The WiFi network 'UNIV_STUDENT' has not connected successfully for any device in the Boys Hostel since March 8th. Over 200 students are affected. We are unable to attend online classes, access the LMS, or download study materials. Personal hotspot data is getting exhausted. This needs urgent resolution.",
        status: "In Progress",
        student: arjun._id,
        studentName: arjun.name,
        assignedAdmin: adminIT._id,
        assignedAdminName: adminIT.name,
        messages: [
          {
            sender: "Admin",
            senderId: adminIT._id,
            text: "Arjun, we identified that the main access point controller for the Boys Hostel zone failed due to a firmware update gone wrong on March 8th. A replacement unit has been ordered and will arrive tomorrow. We will restore connectivity within 24 hours.",
            time: daysAgo(3),
          },
          {
            sender: "Student",
            senderId: arjun._id,
            text: "Understood. Is there any temporary hotspot or LAN access we can use in the meantime?",
            time: daysAgo(3),
          },
          {
            sender: "Admin",
            senderId: adminIT._id,
            text: "Yes — we have set up a temporary wired LAN station in the hostel common room (Ground Floor). 8 ports available. Students can bring their laptops there for assignments.",
            time: daysAgo(2),
          },
          {
            sender: "Admin",
            senderId: adminIT._id,
            text: "[INTERNAL NOTE] The unit arrives tomorrow (courier tracking: DTDC-882719). Schedule installation for 6 AM before students wake up. Also check if AP firmware on Block D needs rollback.",
            isInternal: true,
            time: daysAgo(2),
          },
          {
            sender: "Student",
            senderId: arjun._id,
            text: "WiFi is working now! You guys are amazing. Thank you.",
            time: hoursAgo(4),
          },
        ],
        createdAt: daysAgo(5),
      },

      // ══════════════════════════════════════════════════════════════
      // 16. IT & TECHNICAL SUPPORT — Resolved
      // ══════════════════════════════════════════════════════════════
      {
        caseId: "G-1016",
        category: "IT & Technical Support",
        department: "IT & Technical Support",
        subject: "LMS quiz submission lost — marks not recorded",
        description:
          "I completed the MCQ quiz for CS401 on March 5th, submitted successfully per the confirmation screen, but the marks are not recorded in the system. The professor says the LMS shows I never submitted. I have a screenshot of the confirmation screen with timestamp.",
        status: "Resolved",
        student: kiran._id,
        studentName: kiran.name,
        assignedAdmin: adminIT._id,
        assignedAdminName: adminIT.name,
        resolvedAt: daysAgo(5),
        messages: [
          {
            sender: "Admin",
            senderId: adminIT._id,
            text: "We reviewed the server logs for the LMS on March 5th. There was a transaction commit failure between 10:42–10:58 AM that caused some submissions to not persist properly despite showing a success screen. Your submission was in this window.",
            time: daysAgo(6),
          },
          {
            sender: "Admin",
            senderId: adminIT._id,
            text: "We have notified your professor and the academic registrar. A make-up quiz will be arranged for all 7 affected students. You will get an email with the details.",
            time: daysAgo(6),
          },
          {
            sender: "Student",
            senderId: kiran._id,
            text: "Got the email. The makeup quiz is tomorrow. Thank you for investigating this properly.",
            time: daysAgo(5),
          },
        ],
        createdAt: daysAgo(9),
      },

      // ══════════════════════════════════════════════════════════════
      // 17. IT & TECHNICAL SUPPORT — Escalated
      // ══════════════════════════════════════════════════════════════
      {
        caseId: "G-1017",
        category: "IT & Technical Support",
        department: "IT & Technical Support",
        subject: "Student data breach — personal details visible to other students",
        description:
          "While using the student portal today I noticed that under 'Classmates' section, full personal data of all students — including phone numbers, home addresses, parents' contact — is publicly visible to anyone logged in. This is a serious data privacy violation under PDPA. Immediate action needed to pull this data and investigate how it was exposed.",
        status: "Escalated",
        student: priya._id,
        studentName: priya.name,
        assignedAdmin: adminIT._id,
        assignedAdminName: adminIT.name,
        escalatedTo: "Super Admin",
        escalationReason:
          "Critical data privacy breach exposing sensitive student PII to all portal users. Requires immediate institutional response, possible notification to students, and compliance review.",
        messages: [
          {
            sender: "Student",
            senderId: priya._id,
            text: "I can access Arjun Mehta's home address and his parents' phone directly on my screen right now. This needs to be fixed immediately.",
            time: daysAgo(1),
          },
          {
            sender: "Admin",
            senderId: adminIT._id,
            text: "This is a critical issue. We have immediately disabled the 'Classmates' module. Investigating the API endpoint that exposed this data. Escalating to Super Admin for institutional response.",
            time: daysAgo(1),
          },
          {
            sender: "Student",
            senderId: priya._id,
            text: "Please also check if any external scraping happened. The data was live for at least 6 hours this morning.",
            time: hoursAgo(20),
          },
        ],
        createdAt: daysAgo(1),
      },

      // ══════════════════════════════════════════════════════════════
      // 18. STUDENT WELFARE & DISCIPLINE — Pending
      // ══════════════════════════════════════════════════════════════
      {
        caseId: "G-1018",
        category: "Student Welfare & Discipline",
        department: "Student Welfare & Discipline",
        subject: "Mental health counseling appointment — 3 week wait time",
        description:
          "I requested an appointment with the campus counselor on March 1st. The next available slot is March 23rd — a 3-week wait. I am dealing with severe exam anxiety and sleep deprivation. I need earlier access to mental health support. Could the university consider adding a second counselor for the exam season?",
        status: "Pending",
        student: sneha._id,
        studentName: sneha.name,
        messages: [],
        createdAt: daysAgo(1),
      },

      // ══════════════════════════════════════════════════════════════
      // 19. STUDENT WELFARE & DISCIPLINE — In Progress
      // ══════════════════════════════════════════════════════════════
      {
        caseId: "G-1019",
        category: "Student Welfare & Discipline",
        department: "Student Welfare & Discipline",
        subject: "Bullying and verbal harassment by senior students in hostel",
        description:
          "For the past 3 weeks, a group of 4th-year students (I can provide names privately) have been verbally harassing me and two other 1st-year students in the hostel corridor after lights out. They mock us, pour water under our doors, and take our footwear. I am afraid to report this openly because I share a floor with them.",
        status: "In Progress",
        student: arjun._id,
        studentName: arjun.name,
        assignedAdmin: adminSWD._id,
        assignedAdminName: adminSWD.name,
        messages: [
          {
            sender: "Admin",
            senderId: adminSWD._id,
            text: "Arjun, thank you for your courage in reporting this. We take harassment extremely seriously. Please share the names via secure email to welfare@university.edu — it will remain completely confidential. A preliminary investigation has begun.",
            time: daysAgo(4),
          },
          {
            sender: "Student",
            senderId: arjun._id,
            text: "Sent the names to that email. Please also include the two other affected students in the process — they are willing to give statements.",
            time: daysAgo(4),
          },
          {
            sender: "Admin",
            senderId: adminSWD._id,
            text: "Received. We have spoken to the floor proctor. Surveillance footage review is in progress. The students in question have been informally warned pending the formal inquiry.",
            time: daysAgo(3),
          },
          {
            sender: "Admin",
            senderId: adminSWD._id,
            text: "[INTERNAL] Check CCTV footage for corridor B3 between 11 PM–1 AM on March 8, 9, 10. Request footage from security office.",
            isInternal: true,
            time: daysAgo(3),
          },
          {
            sender: "Student",
            senderId: arjun._id,
            text: "The harassment stopped after they were warned. I hope the formal inquiry is completed to prevent recurrence.",
            time: daysAgo(1),
          },
        ],
        createdAt: daysAgo(6),
      },

      // ══════════════════════════════════════════════════════════════
      // 20. STUDENT WELFARE & DISCIPLINE — Resolved
      // ══════════════════════════════════════════════════════════════
      {
        caseId: "G-1020",
        category: "Student Welfare & Discipline",
        department: "Student Welfare & Discipline",
        subject: "Medical leave not recorded — attendance penalized",
        description:
          "I was hospitalized for dengue fever from Feb 10–16 (7 days). I submitted my hospital discharge summary and doctor's certificate to the office on Feb 20th. However, the attendance system still shows those days as absent and my attendance in 3 subjects dropped below 75%. I have the submitted copies and acknowledgment receipt.",
        status: "Resolved",
        student: priya._id,
        studentName: priya.name,
        assignedAdmin: adminSWD._id,
        assignedAdminName: adminSWD.name,
        resolvedAt: daysAgo(4),
        messages: [
          {
            sender: "Admin",
            senderId: adminSWD._id,
            text: "Priya, we verified your hospital documents and the acknowledgment receipt. The medical leave has been formally recorded and communicated to the Academic registrar. Your attendance has been recalculated.",
            time: daysAgo(5),
          },
          {
            sender: "Student",
            senderId: priya._id,
            text: "The portal now shows correct attendance. I'm above 75% in all subjects again. Thank you!",
            time: daysAgo(4),
          },
        ],
        createdAt: daysAgo(14),
      },

      // ══════════════════════════════════════════════════════════════
      // 21. STUDENT WELFARE & DISCIPLINE — Escalated
      // ══════════════════════════════════════════════════════════════
      {
        caseId: "G-1021",
        category: "Student Welfare & Discipline",
        department: "Student Welfare & Discipline",
        subject: "Ragging complaint — severe physical intimidation in hostel",
        description:
          "On the night of March 9th, a group of approximately 8 senior students entered my room at midnight, forced me and my roommate out of bed, and subjected us to physical and verbal abuse for over 2 hours. My roommate's belongings were damaged. We were threatened not to report. I am filing this despite the threat because this is wrong. I can identify all of them.",
        status: "Escalated",
        student: rahul._id,
        studentName: rahul.name,
        assignedAdmin: adminSWD._id,
        assignedAdminName: adminSWD.name,
        escalatedTo: "Super Admin",
        escalationReason:
          "Serious ragging incident involving physical intimidation and property damage. Requires immediate institutional response, police liaison if needed, and formal Anti-Ragging Committee convening.",
        messages: [
          {
            sender: "Student",
            senderId: rahul._id,
            text: "I have photos of damaged property and a voice recording of part of the incident. How do I share these securely?",
            time: daysAgo(4),
          },
          {
            sender: "Admin",
            senderId: adminSWD._id,
            text: "Rahul, please email evidence to antiragging@university.edu with your student ID in the subject line. This is encrypted and only the Anti-Ragging Committee can access it. Your safety is our priority — you and your roommate will be temporarily relocated.",
            time: daysAgo(4),
          },
          {
            sender: "Admin",
            senderId: adminSWD._id,
            text: "This is a serious ragging case. Escalating to Super Admin to convene the formal Anti-Ragging Committee and initiate disciplinary proceedings. Police notification may be required per UGC regulations.",
            time: daysAgo(3),
          },
          {
            sender: "Student",
            senderId: rahul._id,
            text: "Evidence sent. I am willing to appear before the committee. Please protect my identity during the proceedings.",
            time: daysAgo(3),
          },
        ],
        createdAt: daysAgo(5),
      },

      // ══════════════════════════════════════════════════════════════
      // 22–30. Additional variety cases across all depts/statuses
      // ══════════════════════════════════════════════════════════════

      // 22. AA — Pending
      {
        caseId: "G-1022",
        category: "Academic Affairs",
        department: "Academic Affairs",
        subject: "Research paper plagiarism allegation — unfair accusation",
        description:
          "My thesis supervisor has accused my research paper of 25% plagiarism, but the Turnitin report only shows 8% similarity, mostly from self-citations and standard methodology text. Despite providing the report, he is threatening to reject the paper. I need an independent review committee.",
        status: "Pending",
        student: kiran._id,
        studentName: kiran.name,
        messages: [],
        createdAt: hoursAgo(8),
      },

      // 23. ADM — Resolved
      {
        caseId: "G-1023",
        category: "Administration",
        department: "Administration",
        subject: "Fee receipt not generated after online payment",
        description:
          "I paid my semester fee of ₹42,500 online on March 2nd. The amount was deducted from my account (transaction ID: HDFC-9281047) but no receipt was generated and the fee status on portal still shows 'Unpaid'.",
        status: "Resolved",
        student: sneha._id,
        studentName: sneha.name,
        assignedAdmin: adminADM._id,
        assignedAdminName: adminADM.name,
        resolvedAt: daysAgo(6),
        messages: [
          {
            sender: "Admin",
            senderId: adminADM._id,
            text: "Sneha, we confirmed receipt of your payment from the payment gateway. The portal's reconciliation had a lag. Your fee is now marked as paid and the receipt has been emailed. Your exam registration is cleared.",
            time: daysAgo(7),
          },
          {
            sender: "Student",
            senderId: sneha._id,
            text: "Receipt received and portal updated. Thank you for the quick resolution!",
            time: daysAgo(6),
          },
        ],
        createdAt: daysAgo(10),
      },

      // 24. FAC — Pending
      {
        caseId: "G-1024",
        category: "Facilities & Infrastructure",
        department: "Facilities & Infrastructure",
        subject: "Library elevator out of order — accessibility issue for disabled student",
        description:
          "The main library elevator has been non-functional for 11 days. I use a wheelchair and the reference section, which I need daily for dissertation research, is on the 3rd floor. I cannot access it without the elevator. This is a serious accessibility issue.",
        status: "Pending",
        student: arjun._id,
        studentName: arjun.name,
        messages: [],
        createdAt: daysAgo(4),
      },

      // 25. IT — In Progress
      {
        caseId: "G-1025",
        category: "IT & Technical Support",
        department: "IT & Technical Support",
        subject: "Email account hacked — suspicious login from foreign IP",
        description:
          "I received an alert that my university email account was accessed from an IP address in Romania on March 11th at 3:14 AM. I did not authorize this login. I immediately changed my password but am concerned my academic data may have been accessed.",
        status: "In Progress",
        student: kiran._id,
        studentName: kiran.name,
        assignedAdmin: adminIT._id,
        assignedAdminName: adminIT.name,
        messages: [
          {
            sender: "Admin",
            senderId: adminIT._id,
            text: "Kiran, we have reviewed the access logs. The login from Romania (IP: 185.220.xxx.xxx — a known Tor exit node) accessed your inbox and sent 3 outgoing emails. We have revoked all active sessions. The 3 emails have been recalled. Please check for any forwarding rules set up without your knowledge.",
            time: daysAgo(2),
          },
          {
            sender: "Student",
            senderId: kiran._id,
            text: "Checked — there was a forwarding rule set to an external address I don't recognize. I deleted it. What else should I do?",
            time: daysAgo(2),
          },
          {
            sender: "Admin",
            senderId: adminIT._id,
            text: "Enable 2-factor authentication immediately under Account Settings > Security. Also review your recovery email and phone. We are adding this IP to the blocklist and investigating if other accounts were targeted.",
            time: daysAgo(1),
          },
        ],
        createdAt: daysAgo(3),
      },

      // 26. SWD — Pending
      {
        caseId: "G-1026",
        category: "Student Welfare & Discipline",
        department: "Student Welfare & Discipline",
        subject: "International student — visa documentation help urgently needed",
        description:
          "I am an international student from Sri Lanka. My student visa expires on March 31st and the university needs to issue a fresh enrollment verification letter for visa extension. I submitted the request 3 weeks ago but have not received it. The consulate requires 15 working days for processing so I need this letter by March 16th.",
        status: "Pending",
        student: sneha._id,
        studentName: sneha.name,
        messages: [],
        createdAt: hoursAgo(2),
      },

      // 27. FAC — In Progress
      {
        caseId: "G-1027",
        category: "Facilities & Infrastructure",
        department: "Facilities & Infrastructure",
        subject: "Sports complex changing room — broken locks and no hot water",
        description:
          "The changing rooms in the Sports Complex (both Boys and Girls sections) have broken locks on 60% of the cubicles and no hot water supply. Athletes practicing in the cold mornings are forced to shower with cold water or skip showering entirely. We represent 45 sports team members making this joint complaint.",
        status: "In Progress",
        student: rahul._id,
        studentName: rahul.name,
        assignedAdmin: adminFAC._id,
        assignedAdminName: adminFAC.name,
        messages: [
          {
            sender: "Admin",
            senderId: adminFAC._id,
            text: "Rahul, we have raised a work order for the lock replacements — 12 new deadbolts ordered and will be installed by Monday. The water heater issue is a separate system; our plumber inspected and the boiler needs a part replacement (ordered, 3-day delivery).",
            time: daysAgo(3),
          },
          {
            sender: "Student",
            senderId: rahul._id,
            text: "The locks are still broken as of today. Was Monday installation cancelled?",
            time: daysAgo(1),
          },
          {
            sender: "Admin",
            senderId: adminFAC._id,
            text: "The contractor didn't show up on Monday. We have escalated with them and rescheduled for tomorrow morning. I will personally verify completion.",
            time: hoursAgo(6),
          },
        ],
        createdAt: daysAgo(7),
      },

      // 28. AA — Resolved
      {
        caseId: "G-1028",
        category: "Academic Affairs",
        department: "Academic Affairs",
        subject: "Project supervisor change request — conflict of interest",
        description:
          "My current project supervisor, Prof. Krishnan, is a direct relation of a competing research group in my area. There is a conflict of interest as my research could impact his group's grant. I am requesting a change of supervisor to Prof. Malhotra who has agreed to take me on.",
        status: "Resolved",
        student: priya._id,
        studentName: priya.name,
        assignedAdmin: adminAA._id,
        assignedAdminName: adminAA.name,
        resolvedAt: daysAgo(8),
        messages: [
          {
            sender: "Admin",
            senderId: adminAA._id,
            text: "Priya, after reviewing the circumstances and consulting the Research Committee, we have approved your supervisor change request. Prof. Malhotra has been formally assigned effective from today. The change is reflected in the portal.",
            time: daysAgo(9),
          },
          {
            sender: "Student",
            senderId: priya._id,
            text: "Thank you for handling this sensitively. I can see the change in the portal. Prof. Malhotra and I will meet tomorrow.",
            time: daysAgo(8),
          },
        ],
        createdAt: daysAgo(15),
      },

      // 29. ADM — In Progress
      {
        caseId: "G-1029",
        category: "Administration",
        department: "Administration",
        subject: "Transcript required for foreign university application — 4 week delay",
        description:
          "I applied for an official sealed transcript on February 15th for my MS application to TU Delft. The deadline for submission is March 20th. It is now March 14th and I have received nothing. Other applicants who applied after me have already received theirs.",
        status: "In Progress",
        student: kiran._id,
        studentName: kiran.name,
        assignedAdmin: adminADM._id,
        assignedAdminName: adminADM.name,
        messages: [
          {
            sender: "Admin",
            senderId: adminADM._id,
            text: "Kiran, we found your application in a backlog from the system migration in February. Prioritizing yours now. The transcript will be issued by tomorrow in both physical and digital (PDF) form.",
            time: hoursAgo(10),
          },
          {
            sender: "Student",
            senderId: kiran._id,
            text: "Please also email a digital copy to my TU Delft application email: kiran.r@tudelft-apply.nl. The deadline is in 6 days.",
            time: hoursAgo(9),
          },
          {
            sender: "Admin",
            senderId: adminADM._id,
            text: "Noted. We will send to that address as well. Physical copy will go by registered speed post today.",
            time: hoursAgo(8),
          },
        ],
        createdAt: daysAgo(2),
      },

      // 30. IT — Resolved
      {
        caseId: "G-1030",
        category: "IT & Technical Support",
        department: "IT & Technical Support",
        subject: "ERP system freezes when submitting assignment — data lost",
        description:
          "Every time I try to submit a file larger than 5 MB through the ERP assignment portal, the page freezes and the submission is lost. The system shows no error message. I have lost 3 hours of work across two deadlines. Smaller files work fine. Browser console shows 413 error.",
        status: "Resolved",
        student: arjun._id,
        studentName: arjun.name,
        assignedAdmin: adminIT._id,
        assignedAdminName: adminIT.name,
        resolvedAt: daysAgo(5),
        messages: [
          {
            sender: "Admin",
            senderId: adminIT._id,
            text: "Thanks for including the browser error code — very helpful. The server's nginx config had a 5MB upload limit that wasn't updated after the ERP upgrade. We've increased it to 50MB. Please retry your submission.",
            time: daysAgo(6),
          },
          {
            sender: "Student",
            senderId: arjun._id,
            text: "Uploaded a 28MB file just now — it worked perfectly! Also submitted my overdue assignment with professor's permission.",
            time: daysAgo(5),
          },
          {
            sender: "Admin",
            senderId: adminIT._id,
            text: "Great! We've also deployed a proper error message for cases where limits are hit, so future users see a clear explanation rather than a freeze.",
            time: daysAgo(5),
          },
        ],
        createdAt: daysAgo(9),
      },
    ];

    // ── Insert Cases (bypass pre-save hook since caseIds are already set) ──
    await Case.insertMany(cases, { validateBeforeSave: false });
    console.log(`📋  Created ${cases.length} cases`);

    // ── Done ───────────────────────────────────────────────────────
    console.log("\n🎉  Seed complete! Login credentials:");
    console.log("─────────────────────────────────────────────────────");
    console.log("Role         | Email                          | Password");
    console.log("─────────────────────────────────────────────────────");
    console.log("Super Admin  | super@demo.com                 | demo123 ");
    console.log("Admin (AA)   | admin.academic@demo.com        | demo123 ");
    console.log("Admin (ADM)  | admin.admin@demo.com           | demo123 ");
    console.log("Admin (FAC)  | admin.facilities@demo.com      | demo123 ");
    console.log("Admin (IT)   | admin.it@demo.com              | demo123 ");
    console.log("Admin (SWD)  | admin.welfare@demo.com         | demo123 ");
    console.log("Student 1    | arjun@demo.com                 | demo123 ");
    console.log("Student 2    | priya@demo.com                 | demo123 ");
    console.log("Student 3    | rahul@demo.com                 | demo123 ");
    console.log("Student 4    | sneha@demo.com                 | demo123 ");
    console.log("Student 5    | kiran@demo.com                 | demo123 ");
    console.log("─────────────────────────────────────────────────────");
    console.log("\n📊  Case breakdown:");
    console.log("   Academic Affairs           → 6 cases (P, IP, R, E, P, R)");
    console.log("   Administration             → 6 cases (P, IP, R, E, R, IP)");
    console.log("   Facilities & Infra         → 6 cases (P, P, IP, R, E, IP)");
    console.log("   IT & Technical Support     → 5 cases (P, IP, R, E, IP, R)");
    console.log("   Student Welfare & Disc.    → 5 cases (P, IP, R, E, P)");
    console.log("   Total: 30 cases  |  P=7  IP=8  R=8  E=7");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌  Seed error:", err.message);
    if (err.errors) {
      Object.keys(err.errors).forEach((k) =>
        console.error(`   Field: ${k} — ${err.errors[k].message}`)
      );
    }
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
