import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                    })

                    response = NextResponse.next()

                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    // 🔥 USER авах
    const {
        data: { user }
    } = await supabase.auth.getUser()


    // 🔒 ADMIN GUARD
    if (request.nextUrl.pathname.startsWith('/admin')) {
        if (!user) {
            return NextResponse.redirect(
                new URL('/login', request.url)
            )
        }

        // 🔥 ROLE CHECK
        const { data: userRole, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single()

        if (error || !userRole || userRole.role !== 'admin') {
            return NextResponse.redirect(
                new URL('/dashboard', request.url)
            )
        }
    }

    return response
}

// 🔥 matcher
export const config = {
    matcher: ['/admin/:path*'],
}