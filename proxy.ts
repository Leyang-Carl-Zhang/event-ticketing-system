import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

function getRequiredRole(pathname: string): "ORGANIZER" | "STAFF" | "ATTENDEE" | null {
  if (pathname.startsWith("/dashboard")) return "ORGANIZER";
  if (pathname.startsWith("/staff")) return "STAFF";
  if (pathname === "/my-tickets" || pathname.startsWith("/my-tickets/")) {
    return "ATTENDEE";
  }
  return null;
}

export async function proxy(request: NextRequest) {
  const role = getRequiredRole(request.nextUrl.pathname);
  if (!role) return NextResponse.next();

  const session = await getSessionFromRequest(request);
  if (!session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  if (session.role !== role) {
    const login = new URL("/login", request.url);
    login.searchParams.set("from", request.nextUrl.pathname);
    login.searchParams.set("error", "forbidden");
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/staff/:path*", "/my-tickets/:path*"],
};
