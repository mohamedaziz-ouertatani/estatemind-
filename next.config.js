/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["localhost"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "source.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.mapbox.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "api.mapbox.com",
      },
      { protocol: "https", hostname: "cdn.tayara.tn" },
      { protocol: "https", hostname: "www.tayara.tn" },
      { protocol: "http", hostname: "www.tunisie-annonce.com" },
      { protocol: "http", hostname: "logv31.xiti.com" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Production optimizations
  compress: true,
  poweredByHeader: false,
};

module.exports = nextConfig;
