import { z } from "zod";

export const teacherSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  teacherId: z.string().min(1, "Teacher ID is required").max(50),
  password: z.string().min(4, "Password must be at least 4 characters"),
  subject: z.string().optional(),
  phone: z.string().optional(),
});

export const studentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  studentId: z.string().min(1, "Student ID is required").max(50),
  grade: z.string().min(1, "Grade is required"),
  section: z.string().optional(),
  password: z.string().min(4, "Password must be at least 4 characters"),
  scholarship: z.number().min(0).optional(),
});

export const feeSchema = z.object({
  studentId: z.string().min(1),
  amount: z.number().positive("Amount must be positive"),
  date: z.string().optional(),
  grade: z.string().optional(),
  month: z.string().optional(),
});

export const classSchema = z.object({
  grade: z.string().min(1, "Grade is required"),
  section: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  teacherId: z.string().optional(),
});

export const attendanceSchema = z.object({
  date: z.string().min(1, "Date is required"),
  grade: z.string().min(1, "Grade is required"),
  section: z.string().optional(),
  students: z.array(z.object({
    studentId: z.string().min(1),
    status: z.enum(["Present", "Absent"]),
  })).min(1, "At least one student required"),
});

export const examSchema = z.object({
  title: z.string().min(1, "Exam title is required"),
  grade: z.string().min(1, "Grade is required"),
  subject: z.string().min(1, "Subject is required"),
  date: z.string().min(1, "Date is required"),
  status: z.enum(["Upcoming", "Completed", "Published"]).optional(),
  questionPaper: z.string().optional(),
});

export const markSchema = z.object({
  classScheduleId: z.string().min(1),
  examType: z.string().min(1),
  marksData: z.array(z.object({
    studentId: z.string().min(1),
    marksObtained: z.number().min(0, "Marks cannot be negative"),
    totalMarks: z.number().min(1).optional(),
  })).min(1, "At least one student mark required"),
});

export const noticeSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required"),
  targetRole: z.enum(["all", "teacher", "student"]).optional(),
});

export function validate(schema) {
  return (data) => {
    const result = schema.safeParse(data);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return { valid: false, errors };
    }
    return { valid: true, data: result.data };
  };
}
