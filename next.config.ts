import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Candidatures tuteurs : CV + justificatif d'emploi (upload multipart).
    // La limite par defaut d'une Server Action est 1 Mo ; on l'augmente.
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;
