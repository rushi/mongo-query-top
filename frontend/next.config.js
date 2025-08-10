/** @type {import('next').NextConfig} */
const nextConfig = {
    outputFileTracingRoot: __dirname,
    async rewrites() {
        return [
            {
                source: "/api/mongo/:path*",
                destination: "http://localhost:3000/api/:path*",
            },
        ];
    },
};

module.exports = nextConfig;
