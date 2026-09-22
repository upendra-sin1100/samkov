import { fileURLToPath } from 'node:url';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

/** Frontend-only app: all /api requests are forwarded to the Python service. */
const config = {
  outputFileTracingRoot: fileURLToPath(new URL('../', import.meta.url)),
  webpack(webpackConfig) {
    // Ignore these before Watchpack tries to stat protected Windows files.
    const existing = webpackConfig.watchOptions?.ignored;
    const patterns = (Array.isArray(existing) ? existing : [existing]).filter(Boolean);
    const systemFiles = /(?:^|[\\/])(?:DumpStack\.log(?:\.tmp)?|pagefile\.sys|swapfile\.sys|hiberfil\.sys|System Volume Information|\$RECYCLE\.BIN)(?:[\\/]|$)/i;
    webpackConfig.watchOptions = {
      ...webpackConfig.watchOptions,
      ignored: new RegExp([...patterns.map(pattern => pattern instanceof RegExp ? pattern.source : pattern), systemFiles.source, '[\\\\/]\\.next(?:-dev)?(?:[\\\\/]|$)'].map(pattern => `(?:${pattern})`).join('|'), 'i'),
    };
    return webpackConfig;
  },
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

export default phase => ({ ...config, distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next' });
