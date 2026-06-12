import withPWA from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  // Disable service worker — it was caching stale JS across deploys
  // and the app requires network access anyway (AI itinerary generation)
  disable: true,
})(nextConfig);
