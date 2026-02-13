// Supabase middleware for auth session handling
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Check if Supabase is properly configured
function isSupabaseConfigured(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('[Middleware Debug] Checking Supabase config:', { url, key });

    if (!url || !key) {
        console.log('[Middleware Debug] Missing URL or Key - Returning false');
        return false;
    }

    if (url.includes('your_supabase') || key.includes('your_supabase')) {
        console.log('[Middleware Debug] Default placeholder values detected - Returning false');
        return false;
    }

    try {
        new URL(url);
        return true;
    } catch (e) {
        console.log('[Middleware Debug] Invalid URL - Returning false', e);
        return false;
    }
}

export async function updateSession(request: NextRequest) {
    // If Supabase isn't configured, allow all access (using mock auth in client)
    // Mock auth handles everything client-side, so no server-side protection needed
    if (!isSupabaseConfigured()) {
        console.log('[Middleware] Supabase not configured - allowing access (mock auth mode)');
        return NextResponse.next({ request });
    }

    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh session if needed
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Protected routes - redirect to login if not authenticated
    const protectedPaths = ['/feed', '/chat', '/profile', '/moderation'];
    const isProtectedPath = protectedPaths.some(path =>
        request.nextUrl.pathname.startsWith(path)
    );

    if (isProtectedPath && !user) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // Redirect authenticated users away from auth pages
    const authPaths = ['/login', '/signup'];
    const isAuthPath = authPaths.some(path =>
        request.nextUrl.pathname.startsWith(path)
    );

    if (isAuthPath && user) {
        const url = request.nextUrl.clone();
        url.pathname = '/feed';
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}
