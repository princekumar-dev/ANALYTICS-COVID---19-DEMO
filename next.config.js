/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  // Ensure Turbopack resolves the workspace root to this project directory.
  // This prevents Next from inferring the wrong root when multiple lockfiles
  // exist on the machine (see warning in dev server logs).
  turbopack: {
    root: __dirname,
  },
}

module.exports = nextConfig
