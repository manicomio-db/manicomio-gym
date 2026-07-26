import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ROLE_HOME: Record<string, string> = {
  socio: "/socio",
  staff: "/staff",
  dueno: "/dueno",
};

function roleAllowed(pathname: string, role: string) {
  if (pathname.startsWith("/socio")) return role === "socio";
  if (pathname.startsWith("/staff")) return role === "staff" || role === "dueno";
  if (pathname.startsWith("/dueno")) return role === "dueno";
  return true;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = ["/socio", "/staff", "/dueno"].some((p) => pathname.startsWith(p));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (isProtected || pathname === "/login" || pathname === "/signup")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role ?? "socio";

    if (isProtected && !roleAllowed(pathname, role)) {
      const url = request.nextUrl.clone();
      url.pathname = ROLE_HOME[role] ?? "/";
      return NextResponse.redirect(url);
    }

    if (pathname === "/login" || pathname === "/signup") {
      const url = request.nextUrl.clone();
      url.pathname = ROLE_HOME[role] ?? "/";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
