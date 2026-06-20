import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/mongodb";
import Teacher from "@/models/Teacher";
import Student from "@/models/Student";
import bcrypt from "bcryptjs";


export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "Email or Teacher ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        await dbConnect();
        
        // Hardcoded Owner for initial access
        if (credentials.identifier === "owner@erp.com" && credentials.password === "password") {
          return { id: "owner-1", name: "Administrator", email: "owner@erp.com", role: "OWNER" };
        }

        // Check Teachers (by email or teacherId)
        const teacher = await Teacher.findOne({
          $or: [
            { email: credentials.identifier },
            { teacherId: credentials.identifier }
          ]
        });

        if (teacher) {
          // Check if password matches (either hashed or plain text for migration)
          let isValid = false;
          try {
            isValid = await bcrypt.compare(credentials.password, teacher.password);
          } catch (e) {
            // If bcrypt fails (e.g. not a hash or bcrypt not installed correctly), fallback to plain comparison
            isValid = teacher.password === credentials.password;
          }

          // Final fallback if bcrypt didn't throw but returned false, yet it might be a plain password
          if (!isValid && teacher.password === credentials.password) {
            isValid = true;
          }

          if (isValid) {
            return { 
              id: teacher._id.toString(), 
              name: teacher.name, 
              email: teacher.email, 
              role: "TEACHER",
              teacherId: teacher.teacherId
            };
          }
        }


        // Check Students (by email or studentId)
        const student = await Student.findOne({
          $or: [
            { email: credentials.identifier },
            { studentId: credentials.identifier }
          ]
        });
        if (student) {
          if (student.status === 'graduated') {
            return null;
          }
          let isValid = false;
          try {
            isValid = await bcrypt.compare(credentials.password, student.password);
          } catch (e) {
            isValid = student.password === credentials.password;
          }
          if (!isValid && student.password === credentials.password) {
            isValid = true;
          }
          if (isValid) {
            return { id: student._id.toString(), name: student.name, email: student.email, role: "STUDENT", studentId: student.studentId, grade: student.grade };
          }
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.studentId = user.studentId;
        token.grade = user.grade;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.studentId = token.studentId;
        session.user.grade = token.grade;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};

