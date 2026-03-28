import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return {
    name: "Nova Finance",
    short_name: "Nova",
    description: "Your personal finance command center",
    start_url: `${base}/budget-plan/`,
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    icons: [
      {
        src: `${base}/favicon.ico`,
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
