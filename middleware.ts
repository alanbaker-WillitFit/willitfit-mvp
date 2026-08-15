import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.toLowerCase();
  const isHttp = forwardedProto === "http" || request.nextUrl.protocol === "http:";

  if (!isHttp) return NextResponse.next();

  const target = request.nextUrl.clone();
  target.protocol = "https:";
  return NextResponse.redirect(target, 308);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
