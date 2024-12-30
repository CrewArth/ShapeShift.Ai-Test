import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // Array of public routes that don't require authentication
  publicRoutes: [
    "/",
    "/tutorial",
    "/docs",
    "/contact",
    "/faq",
    "/pricing",
    "/api/contact",
    "/forum",
    "/api/community/models",
    "/api/credits/check",
    "/api/proxy-model",
  ],
  
  // Array of routes to be ignored by the authentication middleware
  ignoredRoutes: [
    "/api/webhook/razorpay",
  ],

  afterAuth(auth, req) {
    // Handle users who aren't authenticated
    if (!auth.userId && !auth.isPublicRoute) {
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return Response.json({ error: 'Authentication required' }, { status: 401 });
      }
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return Response.redirect(signInUrl);
    }
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}; 