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

    // Check if user exists and has required role
    if (
      profileError ||
      !currentUserProfile ||
      (currentUserProfile.role !== "ADMINISTRATOR" &&
        currentUserProfile.role !== "HR")
    ) {
      // Redirect to home page or return 403
      return new Response("Forbidden: You don't have access to this page", {
        status: 403,
      });
    }
  }

  return next();
});
