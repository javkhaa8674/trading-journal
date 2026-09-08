import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["192.168.1.36"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gyrjwcibuipjztqgjuwb.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
