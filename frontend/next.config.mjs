/** Frontend-only app: all /api requests are forwarded to the Python service. */
const config = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination:
          (process.env.PYTHON_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '') +
          '/api/:path*',
      },
    ];
  },
};

export default config;
