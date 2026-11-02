import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Keeps the admin's Supabase session fresh and sends signed-out visitors to the sign-in page.
 * This is a convenience, not the security boundary: every admin page and action checks the
 * session and admin membership on the server, and the database enforces RLS.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (process.env.KAITEN_MODE !== "live" || !url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = !!data?.claims?.sub;
  const onLogin = request.nextUrl.pathname === "/admin/login";

  if (!signedIn && !onLogin) {
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  if (signedIn && onLogin) return NextResponse.redirect(new URL("/admin", request.url));
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
