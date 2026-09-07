import type { NextConfig } from 'next';

const isGithubPages = process.env.GITHUB_PAGES === 'true';
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: isGithubPages ? '/Kursaku' : '',
  assetPrefix: isGithubPages ? '/Kursaku/' : undefined,
};

export default nextConfig;
