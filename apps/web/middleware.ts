import { auth } from "@/auth";

const PROTECTED = ["/dashboard", "/watchlist", "/alerts", "/settings"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected && !req.auth) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return Response.redirect(url);
  }
  return undefined;
});

export const config = {
  matcher: ["/dashboard/:path*", "/watchlist/:path*", "/alerts/:path*", "/settings/:path*"],
};
