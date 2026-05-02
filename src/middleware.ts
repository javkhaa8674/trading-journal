import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    const response = NextResponse.next();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // 🔒 DASHBOARD + ADMIN хамгаална
    const protectedRoutes = ["/dashboard", "/admin"];

    if (protectedRoutes.some((path) => request.nextUrl.pathname.startsWith(path))) {
        if (!user) {
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    // 🔥 ADMIN ROLE CHECK
    if (request.nextUrl.pathname.startsWith("/admin")) {
        const { data: userRole } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user?.id)
            .single();

        if (!userRole || userRole.role !== "admin") {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
    }

    return response;
}

export const config = {
    matcher: ["/dashboard/:path*", "/admin/:path*"],
};