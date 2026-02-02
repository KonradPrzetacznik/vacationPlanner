import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance, supabaseClient } from "../db/supabase.client.ts";
import { hasAccessToPath, type Role } from "../lib/permissions.ts";

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/forgot-password",
  "/set-password",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/set-password",
];

export const onRequest = defineMiddleware(async (context, next) => {
  // Create SSR-compatible Supabase client
  const supabase = createSupabaseServerInstance({
    cookies: context.cookies,
    headers: context.request.headers,
  });

  // Store supabase client in locals (keep for backward compatibility)
  context.locals.supabase = supabaseClient;

  // Check if current path is public
  const isPublicPath = PUBLIC_PATHS.some(
    (path) => context.url.pathname === path || context.url.pathname.startsWith(path)
  );

  // Get user session from Supabase Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Fetch user profile with role from database
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, email")
      .eq("id", user.id)
      .single();

    if (profile && !profileError) {
      // Store user data in locals
      context.locals.user = {
        id: profile.id,
        email: profile.email,
        role: profile.role,
      };
    } else {
      // User exists in auth.users but not in profiles table
      // Create profile if it doesn't exist
      const { error: insertError } = await supabase.from("profiles").insert({
        id: user.id,
        email: user.email || "",
        first_name: "",
        last_name: "",
        role: "EMPLOYEE", // Default role
      });

      if (!insertError) {
        context.locals.user = {
          id: user.id,
          email: user.email || "",
          role: "EMPLOYEE",
        };
      }
    }
  }

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicPath) {
    return context.redirect("/login");
  }

  // If user is authenticated and trying to access login page, redirect to home
  if (user && context.url.pathname === "/login") {
    return context.redirect("/");
  }

  // Check role-based access for protected routes
  if (user && context.locals.user) {
    const userRole = context.locals.user.role as Role;
    const pathname = context.url.pathname;

    // Skip access check for public paths and API routes
    if (!isPublicPath && !pathname.startsWith("/api/")) {
      if (!hasAccessToPath(pathname, userRole)) {
        return new Response("Forbidden: You don't have access to this page", {
          status: 403,
        });
      }
    }
  }

  return next();
});
