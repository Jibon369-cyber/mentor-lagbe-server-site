import "dotenv/config";
import { auth } from "./config/auth.js";
import {
  applications,
  db,
  payments,
  tuitions,
  users,
} from "./config/db.js";

/**
 * Realistic connected seed data for MentorLagbe.
 * It creates real BetterAuth accounts (so password login works), then
 * tuitions, applications, reviews, bookmarks and Stripe payment records.
 *
 * Run with: npm run seed
 */

const ADMIN = {
  name: "MentorLagbe Admin",
  email: "admin@mentorlagbe.com",
  password: "Admin@1234",
};

const TUTORS = [
  {
    name: "Rahim Uddin",
    email: "rahim@mentorlagbe.com",
    password: "Tutor@1234",
    phone: "+8801711001001",
    plan: "pro",
    image: "https://i.pravatar.cc/200?img=12",
    bio: "BUET graduate with 8 years of experience teaching Higher Math and admission preparation. I focus on concepts, speed and exam strategy.",
  },
  {
    name: "Nusrat Jahan",
    email: "nusrat@mentorlagbe.com",
    password: "Tutor@1234",
    phone: "+8801711001002",
    plan: "pro",
    image: "https://i.pravatar.cc/200?img=47",
    bio: "Physics lecturer and HSC examiner. My online batches include weekly problem-solving sheets and one-to-one doubt sessions.",
  },
  {
    name: "Tanvir Hasan",
    email: "tanvir@mentorlagbe.com",
    password: "Tutor@1234",
    phone: "+8801711001003",
    plan: "free",
    image: "https://i.pravatar.cc/200?img=33",
    bio: "Full-stack developer and mentor. I teach Python, JavaScript and web development through small projects and code reviews.",
  },
  {
    name: "Farhana Akter",
    email: "farhana@mentorlagbe.com",
    password: "Tutor@1234",
    phone: "+8801711001004",
    plan: "pro",
    image: "https://i.pravatar.cc/200?img=44",
    bio: "IELTS 8.5 and Cambridge CELTA certified trainer. I help students and professionals speak and write English with confidence.",
  },
  {
    name: "Mehedi Hasan",
    email: "mehedi@mentorlagbe.com",
    password: "Tutor@1234",
    phone: "+8801711001005",
    plan: "free",
    image: "https://i.pravatar.cc/200?img=15",
    bio: "Chemistry teacher for HSC and Class 9-10. I make organic chemistry visual and easy with real-life examples.",
  },
  {
    name: "Sadia Islam",
    email: "sadia.tutor@mentorlagbe.com",
    password: "Tutor@1234",
    phone: "+8801711001006",
    plan: "free",
    image: "https://i.pravatar.cc/200?img=45",
    bio: "Medical student and Biology mentor. I teach Class 9-10 Biology with diagram practice and board question analysis.",
  },
  {
    name: "Arif Chowdhury",
    email: "arif@mentorlagbe.com",
    password: "Tutor@1234",
    phone: "+8801711001007",
    plan: "pro",
    image: "https://i.pravatar.cc/200?img=8",
    bio: "ICT trainer and software engineer. I teach HSC ICT, programming fundamentals and practical lab skills.",
  },
];

const STUDENTS = [
  {
    name: "Ayesha Rahman",
    email: "ayesha@mentorlagbe.com",
    password: "Student@1234",
    phone: "+8801812002001",
    plan: "pro",
    image: "https://i.pravatar.cc/200?img=32",
    bio: "HSC 2026 candidate preparing for admission tests.",
  },
  {
    name: "Md. Imran Hossain",
    email: "imran@mentorlagbe.com",
    password: "Student@1234",
    phone: "+8801812002002",
    plan: "free",
    image: "https://i.pravatar.cc/200?img=11",
    bio: "Learning Python and web development after office hours.",
  },
  {
    name: "Sadia Akter",
    email: "sadia@mentorlagbe.com",
    password: "Student@1234",
    phone: "+8801812002003",
    plan: "pro",
    image: "https://i.pravatar.cc/200?img=25",
    bio: "University student planning for IELTS and higher studies.",
  },
  {
    name: "Rafiul Islam",
    email: "rafiul@mentorlagbe.com",
    password: "Student@1234",
    phone: "+8801812002004",
    plan: "free",
    image: "https://i.pravatar.cc/200?img=13",
    bio: "Class 10 student who wants to improve math results.",
  },
  {
    name: "Tasmia Noor",
    email: "tasmia@mentorlagbe.com",
    password: "Student@1234",
    phone: "+8801812002005",
    plan: "free",
    image: "https://i.pravatar.cc/200?img=36",
    bio: "HSC student preparing for medical admission.",
  },
  {
    name: "Naimur Rahman",
    email: "naimur@mentorlagbe.com",
    password: "Student@1234",
    phone: "+8801812002006",
    plan: "free",
    image: "https://i.pravatar.cc/200?img=5",
    bio: "Class 9 student interested in science and ICT.",
  },
];

const banners = [
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1200&q=80",
];

const TUITIONS = [
  {
    title: "Class 10 Higher Math Batch",
    subject: "Math",
    classLevel: "Class 10",
    mode: "Offline",
    location: "Dhaka - Dhanmondi",
    monthlyFee: 3500,
    daysPerWeek: 4,
    tutor: "rahim@mentorlagbe.com",
    approvalStatus: "approved",
    isActive: true,
    description:
      "A complete Higher Math batch for Class 10 students. We cover every board chapter, solve past papers and take a weekly model test. Small batch of 12 students with individual feedback.",
  },
  {
    title: "HSC Physics Crash Course",
    subject: "Physics",
    classLevel: "HSC",
    mode: "Online",
    location: "Zoom",
    monthlyFee: 3000,
    daysPerWeek: 3,
    tutor: "nusrat@mentorlagbe.com",
    approvalStatus: "approved",
    isActive: true,
    description:
      "Finish the HSC Physics syllabus with concept classes, creative question practice and weekly problem-solving sheets. Recorded lectures are available if you miss a live class.",
  },
  {
    title: "Python & Problem Solving for Beginners",
    subject: "Programming",
    classLevel: "Adult",
    mode: "Online",
    location: "Google Meet",
    monthlyFee: 4000,
    daysPerWeek: 3,
    tutor: "tanvir@mentorlagbe.com",
    approvalStatus: "approved",
    isActive: true,
    description:
      "Learn Python from zero with daily coding tasks, mini projects and code reviews. Perfect for university students and professionals who want a strong programming foundation.",
  },
  {
    title: "IELTS Band 7+ Preparation",
    subject: "IELTS",
    classLevel: "Adult",
    mode: "Online",
    location: "Zoom",
    monthlyFee: 5000,
    daysPerWeek: 5,
    tutor: "farhana@mentorlagbe.com",
    approvalStatus: "approved",
    isActive: true,
    description:
      "An intensive IELTS course covering Listening, Reading, Writing and Speaking. Includes two full mock tests, band-score feedback and a personal study plan.",
  },
  {
    title: "Class 8 English Grammar & Writing",
    subject: "English",
    classLevel: "Class 8",
    mode: "Offline",
    location: "Chattogram - GEC",
    monthlyFee: 2200,
    daysPerWeek: 3,
    tutor: "farhana@mentorlagbe.com",
    approvalStatus: "approved",
    isActive: true,
    description:
      "Build a strong grammar base and learn paragraph, letter and story writing for school exams. Weekly worksheets and friendly feedback keep students motivated.",
  },
  {
    title: "HSC Chemistry Complete Batch",
    subject: "Chemistry",
    classLevel: "HSC",
    mode: "Offline",
    location: "Sylhet - Zindabazar",
    monthlyFee: 3200,
    daysPerWeek: 4,
    tutor: "mehedi@mentorlagbe.com",
    approvalStatus: "approved",
    isActive: true,
    description:
      "Organic and inorganic chemistry made simple with visual notes, lab examples and board question analysis. Includes monthly exams and doubt-clearing sessions.",
  },
  {
    title: "Class 9 Biology Foundation",
    subject: "Biology",
    classLevel: "Class 9",
    mode: "Online",
    location: "Google Meet",
    monthlyFee: 2500,
    daysPerWeek: 3,
    tutor: "sadia.tutor@mentorlagbe.com",
    approvalStatus: "approved",
    isActive: true,
    description:
      "A concept-first Biology course for Class 9 students. Learn diagram techniques, board-style answers and chapter-wise revision strategies.",
  },
  {
    title: "Full-Stack Web Development 1-on-1",
    subject: "Programming",
    classLevel: "Adult",
    mode: "Online",
    location: "Zoom",
    monthlyFee: 6000,
    daysPerWeek: 2,
    tutor: "tanvir@mentorlagbe.com",
    approvalStatus: "approved",
    isActive: true,
    description:
      "Personal mentorship for aspiring developers. We build a production-style project together with React, Node.js, MongoDB and deployment. Includes resume and interview preparation.",
  },
  {
    title: "University Admission Math",
    subject: "Math",
    classLevel: "Admission",
    mode: "Offline",
    location: "Dhaka - Farmgate",
    monthlyFee: 4500,
    daysPerWeek: 5,
    tutor: "rahim@mentorlagbe.com",
    approvalStatus: "approved",
    isActive: true,
    description:
      "Focused admission preparation for BUET, DU and medical aspirants. Shortcut techniques, chapter tests and full-length model exams every two weeks.",
  },
  {
    title: "Class 6 Science Home Tutor",
    subject: "Science",
    classLevel: "Class 6",
    mode: "Offline",
    location: "Dhaka - Mirpur",
    monthlyFee: 2000,
    daysPerWeek: 3,
    tutor: "mehedi@mentorlagbe.com",
    approvalStatus: "approved",
    isActive: true,
    description:
      "Friendly home tuition for Class 6 Science. We cover school syllabus, homework support and simple experiments that make science interesting.",
  },
  {
    title: "HSC ICT & Programming Basics",
    subject: "ICT",
    classLevel: "HSC",
    mode: "Online",
    location: "Zoom",
    monthlyFee: 2800,
    daysPerWeek: 3,
    tutor: "arif@mentorlagbe.com",
    approvalStatus: "approved",
    isActive: true,
    description:
      "Master the HSC ICT syllabus with practical C programming, number systems, HTML and database basics. Includes board question practice and lab guidance.",
  },
  {
    title: "Spoken English for Professionals",
    subject: "English",
    classLevel: "Adult",
    mode: "Online",
    location: "Google Meet",
    monthlyFee: 3500,
    daysPerWeek: 4,
    tutor: "farhana@mentorlagbe.com",
    approvalStatus: "approved",
    isActive: true,
    description:
      "Speak confidently in meetings, interviews and everyday conversations. Live speaking drills, pronunciation feedback and vocabulary building in every class.",
  },
  {
    title: "Class 7 Math Weekly Batch",
    subject: "Math",
    classLevel: "Class 7",
    mode: "Offline",
    location: "Dhaka - Uttara",
    monthlyFee: 2400,
    daysPerWeek: 3,
    tutor: "rahim@mentorlagbe.com",
    approvalStatus: "approved",
    isActive: false,
    description:
      "A weekly math batch for Class 7 students. This batch is currently closed because all seats are filled.",
  },
  {
    title: "Class 10 Physics Final Revision",
    subject: "Physics",
    classLevel: "Class 10",
    mode: "Online",
    location: "Zoom",
    monthlyFee: 2600,
    daysPerWeek: 2,
    tutor: "nusrat@mentorlagbe.com",
    approvalStatus: "pending",
    isActive: true,
    description:
      "Final revision batch before the board exam. Chapter-wise MCQ and creative question practice with instant feedback.",
  },
  {
    title: "JavaScript Interview Prep",
    subject: "Programming",
    classLevel: "Adult",
    mode: "Online",
    location: "Google Meet",
    monthlyFee: 4500,
    daysPerWeek: 3,
    tutor: "tanvir@mentorlagbe.com",
    approvalStatus: "pending",
    isActive: true,
    description:
      "A focused interview preparation program covering JavaScript fundamentals, data structures, React and mock interviews.",
  },
  {
    title: "Class 9 Chemistry Lab Prep",
    subject: "Chemistry",
    classLevel: "Class 9",
    mode: "Offline",
    location: "Sylhet - Ambarkhana",
    monthlyFee: 2800,
    daysPerWeek: 3,
    tutor: "mehedi@mentorlagbe.com",
    approvalStatus: "rejected",
    isActive: true,
    description:
      "Practical chemistry support for Class 9 students. This listing needs more details before it can be approved.",
  },
];

async function createAccount({ name, email, password, role, plan, phone, bio, image }) {
  try {
    await auth.api.signUpEmail({
      body: { name, email, password, role },
    });
  } catch (error) {
    console.log(`Account ${email} could not be created: ${error.message}`);
  }

  await users.updateOne(
    { email },
    {
      $set: {
        name,
        email,
        role,
        plan,
        phone,
        bio,
        image,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );

  return users.findOne({ email });
}

async function seed() {
  console.log("Clearing old data...");
  await Promise.all([
    db.collection("accounts").deleteMany({}),
    db.collection("sessions").deleteMany({}),
    db.collection("verifications").deleteMany({}),
    users.deleteMany({}),
    tuitions.deleteMany({}),
    applications.deleteMany({}),
    payments.deleteMany({}),
  ]);

  console.log("Creating admin, tutors and students...");
  const admin = await createAccount({
    ...ADMIN,
    role: "admin",
    plan: "pro",
    phone: "+8801700000000",
    bio: "Platform administrator at MentorLagbe.",
    image: "https://i.pravatar.cc/200?img=68",
  });

  const tutorDocs = {};
  for (const tutor of TUTORS) {
    tutorDocs[tutor.email] = await createAccount({
      ...tutor,
      role: "tutor",
    });
  }

  const studentDocs = {};
  for (const student of STUDENTS) {
    studentDocs[student.email] = await createAccount({
      ...student,
      role: "student",
    });
  }

  console.log("Creating tuitions...");
  const now = Date.now();
  const tuitionDocs = TUITIONS.map((item, index) => {
    const tutor = tutorDocs[item.tutor];
    return {
      title: item.title,
      subject: item.subject,
      classLevel: item.classLevel,
      mode: item.mode,
      location: item.location,
      monthlyFee: item.monthlyFee,
      daysPerWeek: item.daysPerWeek,
      bannerImage: banners[index % banners.length],
      description: item.description,
      tutorName: tutor?.name || "MentorLagbe Tutor",
      tutorEmail: item.tutor,
      approvalStatus: item.approvalStatus,
      isActive: item.isActive,
      createdAt: new Date(now - index * 36 * 60 * 60 * 1000),
      updatedAt: new Date(now - index * 36 * 60 * 60 * 1000),
    };
  });

  const inserted = await tuitions.insertMany(tuitionDocs);
  const ids = Object.values(inserted.insertedIds).map((id) => id.toString());

  const byTitle = (title) => {
    const index = tuitionDocs.findIndex((item) => item.title === title);
    return { id: ids[index], doc: tuitionDocs[index] };
  };

  console.log("Creating applications, reviews and bookmarks...");

  const applicationSeed = [
    {
      tuition: "Class 10 Higher Math Batch",
      student: "ayesha@mentorlagbe.com",
      status: "accepted",
      schedule: "Saturday to Tuesday, 5:00 - 7:00 PM",
      note: "I want to strengthen my Higher Math and prepare for the SSC exam.",
      rating: 5,
      feedback:
        "Rahim sir explains every step clearly and the weekly model tests helped me improve my math result a lot.",
      daysAgo: 24,
    },
    {
      tuition: "HSC Physics Crash Course",
      student: "ayesha@mentorlagbe.com",
      status: "pending",
      schedule: "Evening after 7 PM",
      note: "I need help with electrostatics and modern physics.",
      daysAgo: 2,
    },
    {
      tuition: "University Admission Math",
      student: "ayesha@mentorlagbe.com",
      status: "accepted",
      schedule: "Morning batch, 8:00 - 10:00 AM",
      note: "Preparing for the DU and BUET admission tests.",
      rating: 4,
      feedback:
        "Very structured admission preparation. The shortcut techniques are genuinely useful for timed exams.",
      daysAgo: 18,
    },
    {
      tuition: "Python & Problem Solving for Beginners",
      student: "imran@mentorlagbe.com",
      status: "accepted",
      schedule: "Friday and Saturday, 8:00 - 10:00 PM",
      note: "I am a complete beginner and want to build a strong foundation.",
      rating: 5,
      feedback:
        "The projects and code reviews made Python finally click for me. Tanvir is patient and very practical.",
      daysAgo: 15,
    },
    {
      tuition: "Full-Stack Web Development 1-on-1",
      student: "imran@mentorlagbe.com",
      status: "pending",
      schedule: "Weekend mornings",
      note: "I want to build a portfolio project and prepare for interviews.",
      daysAgo: 1,
    },
    {
      tuition: "IELTS Band 7+ Preparation",
      student: "sadia@mentorlagbe.com",
      status: "accepted",
      schedule: "Daily, 9:00 - 11:00 PM",
      note: "My target band is 7.5 for a master's application.",
      rating: 5,
      feedback:
        "The mock tests and writing feedback were excellent. I reached band 7.5 in my first attempt.",
      daysAgo: 21,
    },
    {
      tuition: "Spoken English for Professionals",
      student: "sadia@mentorlagbe.com",
      status: "accepted",
      schedule: "Tuesday and Thursday, 8:00 PM",
      note: "I want to speak more confidently in interviews.",
      daysAgo: 9,
    },
    {
      tuition: "Class 10 Higher Math Batch",
      student: "rafiul@mentorlagbe.com",
      status: "pending",
      schedule: "After school, 4:30 - 6:30 PM",
      note: "I struggle with geometry and trigonometry.",
      daysAgo: 3,
    },
    {
      tuition: "Class 8 English Grammar & Writing",
      student: "rafiul@mentorlagbe.com",
      status: "rejected",
      schedule: "Friday only",
      note: "I need help with writing paragraphs and letters.",
      daysAgo: 12,
    },
    {
      tuition: "HSC Physics Crash Course",
      student: "tasmia@mentorlagbe.com",
      status: "accepted",
      schedule: "Evening, 6:00 - 8:00 PM",
      note: "I am preparing for the medical admission test.",
      rating: 4,
      feedback:
        "The problem-solving sheets are challenging in a good way. I feel much more confident in Physics now.",
      daysAgo: 17,
    },
    {
      tuition: "HSC Chemistry Complete Batch",
      student: "tasmia@mentorlagbe.com",
      status: "pending",
      schedule: "Friday and Saturday",
      note: "Organic chemistry is my weakest area.",
      daysAgo: 4,
    },
    {
      tuition: "Class 9 Biology Foundation",
      student: "naimur@mentorlagbe.com",
      status: "accepted",
      schedule: "Sunday, Tuesday and Thursday, 7:00 PM",
      note: "I want to improve my diagram-based answers.",
      rating: 5,
      feedback:
        "Sadia apu makes Biology easy to remember with diagrams and real examples. Highly recommended.",
      daysAgo: 13,
    },
    {
      tuition: "HSC ICT & Programming Basics",
      student: "naimur@mentorlagbe.com",
      status: "pending",
      schedule: "Weekend afternoons",
      note: "I want to learn C programming and HTML properly.",
      daysAgo: 5,
    },
    {
      tuition: "Class 6 Science Home Tutor",
      student: "naimur@mentorlagbe.com",
      status: "rejected",
      schedule: "Every day after 5 PM",
      note: "Looking for help with the school science syllabus.",
      daysAgo: 20,
    },
  ];

  const applicationDocs = applicationSeed.map((item) => {
    const { id, doc } = byTitle(item.tuition);
    const student = studentDocs[item.student];
    const appliedAt = new Date(now - item.daysAgo * 24 * 60 * 60 * 1000);

    return {
      tuitionId: id,
      tuitionTitle: doc.title,
      subject: doc.subject,
      monthlyFee: doc.monthlyFee,
      tutorName: doc.tutorName,
      tutorEmail: doc.tutorEmail,
      studentName: student?.name || "MentorLagbe Student",
      studentEmail: item.student,
      studentPhone: student?.phone || "+8801800000000",
      preferredSchedule: item.schedule,
      studentNote: item.note,
      status: item.status,
      appliedAt,
      ...(item.rating
        ? {
            rating: item.rating,
            feedback: item.feedback,
            reviewedAt: new Date(appliedAt.getTime() + 7 * 24 * 60 * 60 * 1000),
          }
        : {}),
    };
  });

  await applications.insertMany(applicationDocs);

  const bookmarkMap = {
    "ayesha@mentorlagbe.com": [
      "HSC Physics Crash Course",
      "IELTS Band 7+ Preparation",
      "Full-Stack Web Development 1-on-1",
    ],
    "imran@mentorlagbe.com": [
      "Class 10 Higher Math Batch",
      "University Admission Math",
    ],
    "tasmia@mentorlagbe.com": ["Python & Problem Solving for Beginners"],
    "naimur@mentorlagbe.com": [
      "Class 8 English Grammar & Writing",
      "Spoken English for Professionals",
    ],
  };

  for (const [email, titles] of Object.entries(bookmarkMap)) {
    await users.updateOne(
      { email },
      {
        $set: {
          savedTuitions: titles.map((title) => byTitle(title).id),
        },
      },
    );
  }

  console.log("Creating Pro plan payment records...");
  const paidUsers = [
    ...TUTORS.filter((tutor) => tutor.plan === "pro").map((tutor) => ({
      email: tutor.email,
      role: "tutor",
      amount: 15,
    })),
    ...STUDENTS.filter((student) => student.plan === "pro").map((student) => ({
      email: student.email,
      role: "student",
      amount: 10,
    })),
  ];

  const paymentDocs = paidUsers.map((item, index) => {
    const user = roleUser(item.email);
    return {
      userEmail: item.email,
      userName: user?.name || "MentorLagbe User",
      userRole: item.role,
      planName: item.role === "tutor" ? "Pro Tutor" : "Pro Student",
      amount: item.amount,
      currency: "usd",
      transactionId: `pi_seed_${String(index + 1).padStart(4, "0")}`,
      stripeSessionId: `cs_test_seed_${String(index + 1).padStart(4, "0")}`,
      paymentStatus: "paid",
      paidAt: new Date(now - (index + 3) * 24 * 60 * 60 * 1000),
    };
  });

  function roleUser(email) {
    return tutorDocs[email] || studentDocs[email];
  }

  await payments.insertMany(paymentDocs);

  console.log("");
  console.log("Seed complete.");
  console.log(`Users: ${await users.countDocuments()}`);
  console.log(`Tuitions: ${await tuitions.countDocuments()}`);
  console.log(`Applications: ${await applications.countDocuments()}`);
  console.log(`Payments: ${await payments.countDocuments()}`);
  console.log("");
  console.log("Admin login:");
  console.log(`  Email: ${ADMIN.email}`);
  console.log(`  Password: ${ADMIN.password}`);
  console.log("Tutor demo: rahim@mentorlagbe.com / Tutor@1234");
  console.log("Student demo: ayesha@mentorlagbe.com / Student@1234");
  console.log(`Admin id: ${admin?._id}`);
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
