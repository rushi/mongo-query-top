/** @type {import('next').NextConfig} */

const PORT = process.env.PORT_API || 3000;
console.log(`⏩ Using API port: ${PORT}`);

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
