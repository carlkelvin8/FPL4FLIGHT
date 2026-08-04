import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

const STATIC_FILE_PATTERN = /\.(png|jpg|jpeg|svg|gif|webp|ico|css|js|woff2?|ttf|eot)$/;

const PUBLIC_PATHS = ["/home"];

export async function middleware(request: NextRequest) {
  if (STATIC_FILE_PATTERN.test(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.includes(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Partial<ResponseCookie>;
          }[],
        ) {
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set(name, value);
            if (options) {
              supabaseResponse.cookies.set(name, value, options);
            } else {
              supabaseResponse.cookies.set(name, value);
            }
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  const metadataRole = user.app_metadata?.role as string | undefined;
  if (metadataRole === "admin") {
    return supabaseResponse;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login|api/auth).*)",
  ],
};
