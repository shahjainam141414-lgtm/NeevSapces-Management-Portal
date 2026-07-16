import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/set-password",
  "/auth/callback",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function isProtectedPath(pathname: string) {
  if (pathname === "/") return false;
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/properties") ||
    pathname.startsWith("/users") ||
    pathname.startsWith("/customization") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/settings")
  );
}

async function findAdminProfile(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  email: string,
) {
  const { data: byId } = await supabase
    .from("admin_profiles")
    .select("id, status")
    .eq("id", userId)
    .maybeSingle();

  if (byId) return byId;

  if (!email) return null;

  const { data: byEmail } = await supabase
    .from("admin_profiles")
    .select("id, status")
    .eq("email", email)
    .maybeSingle();

  return byEmail;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({
          request: { headers: request.headers },
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const email = (user?.email ?? "").trim().toLowerCase();
  const forceLogin =
    request.nextUrl.searchParams.get("force_login") === "1" ||
    request.nextUrl.searchParams.get("password_set") === "1";

  // After set-password: never bounce invite session straight to dashboard
  if (user && forceLogin && (pathname === "/login" || pathname === "/register")) {
    await supabase.auth.signOut();
    return response;
  }

  if (user && isProtectedPath(pathname)) {
    const profile = await findAdminProfile(supabase, user.id, email);
    if (!profile || profile.status === "inactive") {
      await supabase.auth.signOut();
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.search = "?error=not_invited";
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (user && (pathname === "/login" || pathname === "/register") && !forceLogin) {
    const profile = await findAdminProfile(supabase, user.id, email);
    if (profile && profile.status !== "inactive") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (!user && isProtectedPath(pathname) && !isPublicPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
