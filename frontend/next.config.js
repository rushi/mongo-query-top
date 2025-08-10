/** @type {import('next').NextConfig} */

const PORT = process.env.PORT_API || 3000;

const nextConfig = {
    outputFileTracingRoot: __dirname,
    async rewrites() {
        return [
            {
                source: "/api/mongo/:path*",
                destination: `http://localhost:${PORT}/api/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;
