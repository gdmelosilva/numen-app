import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { isRouteBlocked } from "@/lib/menu-visibility";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  // Bloqueia acesso a /auth exceto /auth/update-password
  if (
    request.nextUrl.pathname.startsWith("/auth") &&
    request.nextUrl.pathname !== "/auth/update-password"
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Permite acesso à página de acesso negado e à rota /main sem bloqueio
  if (request.nextUrl.pathname === "/denied" || request.nextUrl.pathname === "/main") {
    return await updateSession(request);
  }

  // Atualiza sessão normalmente
  const response = await updateSession(request);

  // Obtém usuário autenticado do Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {}, // Não precisa setar cookies aqui
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Busca usuário completo na tabela user
  let fullUser = null;
  if (user) {
    const { data: userData } = await supabase
      .from("user")
      .select(
        "id, email, role, partner_id, is_client, first_name, last_name, is_active"
      )
      .eq("id", user.id)
      .single();
    fullUser = userData;
  }

  // Só bloqueia rota se houver usuário completo
  if (fullUser && isRouteBlocked(request.nextUrl.pathname, fullUser)) {
    return NextResponse.redirect(new URL("/denied", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
