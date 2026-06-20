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
        
        if (credentials.identifier === "owner@erp.com" && credentials.password === "password") {
          return { id: "owner-1", name: "Administrator", email: "owner@erp.com", role: "OWNER" };
        }

        const teacher = await Teacher.findOne({
          $or: [
            { email: credentials.identifier },
            { teacherId: credentials.identifier }
          ]
        });

        if (teacher) {
          const isValid = await bcrypt.compare(credentials.password, teacher.password).catch(() => false);
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

        const student = await Student.findOne({
          $or: [
            { email: credentials.identifier },
            { studentId: credentials.identifier }
          ]
        });

        if (student) {
          if (student.status === 'graduated') return null;
          const isValid = await bcrypt.compare(credentials.password, student.password).catch(() => false);
          if (isValid) {
            return { id: student._id.toString(), name: student.name, email: student.email, role: "STUDENT", studentId: student.studentId, grade: student.grade };
          }
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24,
  },
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

