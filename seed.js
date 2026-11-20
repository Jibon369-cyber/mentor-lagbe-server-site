import "dotenv/config";
import { auth } from "./config/auth.js";
import { users, tuitions, applications, payments } from "./config/db.js";

async function createUser(name, email, password, role) {
  try {
    await auth.api.signUpEmail({ body: { name, email, password, role } });
  } catch (error) {
    console.log(`${email} already exists, skipping`);
  }
}

await createUser("Admin", "admin@mentorlagbe.com", "Admin@123", "student");
await users.updateOne(
  { email: "admin@mentorlagbe.com" },
  { $set: { role: "admin" } },
);

const tutors = [
  { name: "Rahim Uddin", email: "rahim@mentorlagbe.com" },
  { name: "Nusrat Jahan", email: "nusrat@mentorlagbe.com" },
  { name: "Tanvir Hasan", email: "tanvir@mentorlagbe.com" },
];

for (const t of tutors) await createUser(t.name, t.email, "123456", "tutor");
await createUser(
  "Sample Student",
  "student@mentorlagbe.com",
  "123456",
  "student",
);

const list = [
  [
    "Class 10 Math Batch",
    "Math",
    "Class 10",
    "Offline",
    "Dhaka - Dhanmondi",
    2500,
    4,
    0,
    "approved",
  ],
  [
    "HSC Physics Crash Course",
    "Physics",
    "HSC",
    "Online",
    "Zoom",
    3000,
    3,
    1,
    "approved",
  ],
  [
    "Python for Beginners",
    "Programming",
    "Adult",
    "Online",
    "Google Meet",
    3500,
    3,
    2,
    "approved",
  ],
  [
    "IELTS Band 7+ Preparation",
    "IELTS",
    "Adult",
    "Online",
    "Zoom",
    4500,
    5,
    1,
    "approved",
  ],
  [
    "Class 8 English Grammar",
    "English",
    "Class 8",
    "Offline",
    "Chattogram - GEC",
    2000,
    3,
    0,
    "approved",
  ],
  [
    "HSC Chemistry Batch",
    "Chemistry",
    "HSC",
    "Offline",
    "Dhaka - Mirpur",
    3000,
    4,
    2,
    "approved",
  ],
  [
    "Class 9 Biology Basics",
    "Biology",
    "Class 9",
    "Online",
    "Google Meet",
    2200,
    3,
    1,
    "approved",
  ],
  [
    "Web Development 1-on-1",
    "Programming",
    "Adult",
    "Online",
    "Zoom",
    5000,
    2,
    2,
    "approved",
  ],
  [
    "Admission Math Preparation",
    "Math",
    "Admission",
    "Offline",
    "Dhaka - Farmgate",
    3500,
    5,
    0,
    "approved",
  ],
  [
    "Class 6 Science Home Tutor",
    "Science",
    "Class 6",
    "Offline",
    "Sylhet - Zindabazar",
    1800,
    3,
    0,
    "approved",
  ],
  [
    "ICT for HSC Students",
    "ICT",
    "HSC",
    "Online",
    "Zoom",
    2500,
    3,
    2,
    "approved",
  ],
  [
    "Spoken English Mentorship",
    "English",
    "Adult",
    "Online",
    "Google Meet",
    2800,
    4,
    1,
    "approved",
  ],
  [
    "Class 7 Math Batch",
    "Math",
    "Class 7",
    "Offline",
    "Dhaka - Uttara",
    2100,
    4,
    0,
    "pending",
  ],
  [
    "JavaScript Mentorship",
    "Programming",
    "Adult",
    "Online",
    "Zoom",
    4000,
    3,
    2,
    "pending",
  ],
];

await tuitions.deleteMany({});
await applications.deleteMany({});
await payments.deleteMany({});

const docs = list.map(
  ([title, subject, classLevel, mode, location, fee, days, t, status], i) => ({
    title,
    subject,
    classLevel,
    mode,
    location,
    monthlyFee: fee,
    daysPerWeek: days,
    bannerImage: `https://picsum.photos/seed/mentor${i}/800/450`,
    description: `${title} with a friendly, experienced tutor. Small batch size, weekly progress tests and doubt-solving support.`,
    tutorName: tutors[t].name,
    tutorEmail: tutors[t].email,
    approvalStatus: status,
    isActive: true,
    createdAt: new Date(Date.now() - i * 86400000), // one day apart
  }),
);
const inserted = await tuitions.insertMany(docs);
const ids = Object.values(inserted.insertedIds);

const statuses = ["pending", "accepted", "rejected"];
const sampleApps = ids.slice(0, 3).map((id, i) => ({
  tuitionId: id.toString(),
  tuitionTitle: docs[i].title,
  subject: docs[i].subject,
  monthlyFee: docs[i].monthlyFee,
  tutorName: docs[i].tutorName,
  tutorEmail: docs[i].tutorEmail,
  studentName: "Sample Student",
  studentEmail: "student@mentorlagbe.com",
  studentPhone: "01700000000",
  preferredSchedule: "Evening, 6-8 PM",
  studentNote: "I want to improve my result.",
  status: statuses[i],
  appliedAt: new Date(),
}));
await applications.insertMany(sampleApps);

console.log("Seed done.");
console.log("Admin login: admin@mentorlagbe.com / Admin@123");
process.exit(0);