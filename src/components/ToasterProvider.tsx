/**
 * Toaster Provider Component
 * Wrapper for Sonner Toaster to use in Astro layout
 */
import { Toaster } from "./ui/sonner";

export function ToasterProvider() {
  return <Toaster position="top-right" richColors />;
}

export default ToasterProvider;

