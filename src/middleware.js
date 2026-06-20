import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized() {
      return true;
    },
  },
});

export const config = {
  matcher: ["/owner/:path*", "/teacher/:path*", "/student/:path*"],
};
