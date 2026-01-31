import { defineMiddleware } from "astro:middleware";

import { supabaseClient, DEFAULT_USER_ID } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.supabase = supabaseClient;

  // Check if the route is protected (starts with /admin)
  if (context.url.pathname.startsWith("/admin")) {
    // Fetch current user profile with role
    const { data: currentUserProfile, error: profileError } =
      await context.locals.supabase
        .from("profiles")
        .select("id, role")
        .eq("id", DEFAULT_USER_ID)
        .single();

    if (profileError || !currentUserProfile) {
      return new Response("Forbidden: You don't have access to this page", {
        status: 403,
      });
    }

    // Define role requirements for specific routes
    const isUsersRoute = context.url.pathname.startsWith("/admin/users");

    if (isUsersRoute) {
      // /admin/users requires ADMINISTRATOR role only
      if (currentUserProfile.role !== "ADMINISTRATOR") {
        return new Response("Forbidden: Administrator role required", {
          status: 403,
        });
      }
    } else {
      // Other /admin routes require ADMINISTRATOR or HR
      if (
        currentUserProfile.role !== "ADMINISTRATOR" &&
        currentUserProfile.role !== "HR"
      ) {
        return new Response("Forbidden: You don't have access to this page", {
          status: 403,
        });
      }
    }
  }

  return next();
});
