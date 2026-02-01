import { defineMiddleware } from "astro:middleware";

import {
  createSupabaseServerInstance,
  supabaseClient,
} from "../db/supabase.client.ts";

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
  const isPublicPath = PUBLIC_PATHS.some((path) =>
    context.url.pathname === path || context.url.pathname.startsWith(path)
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
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({
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

  // Check role-based access for admin routes
  if (context.url.pathname.startsWith("/admin")) {
    if (!context.locals.user) {
      return new Response("Forbidden: Authentication required", {
        status: 403,
      });
    }

    const isUsersRoute = context.url.pathname.startsWith("/admin/users");

    if (isUsersRoute) {
      // /admin/users requires ADMINISTRATOR role only
      if (context.locals.user.role !== "ADMINISTRATOR") {
        return new Response("Forbidden: Administrator role required", {
          status: 403,
        });
      }
    } else {
      // Other /admin routes require ADMINISTRATOR or HR
      if (
        context.locals.user.role !== "ADMINISTRATOR" &&
        context.locals.user.role !== "HR"
      ) {
        return new Response("Forbidden: You don't have access to this page", {
          status: 403,
        });
      }
    }
  }

  return next();
});
