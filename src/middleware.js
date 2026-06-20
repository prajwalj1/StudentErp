import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      const path = req.nextUrl.pathname;
      if (path.startsWith("/owner")) return token?.role === "OWNER";
      if (path.startsWith("/teacher")) return token?.role === "TEACHER";
      if (path.startsWith("/student")) return token?.role === "STUDENT";
      return true;
    },
  },
});

export const config = {
  matcher: ["/owner/:path*", "/teacher/:path*", "/student/:path*"],
};
