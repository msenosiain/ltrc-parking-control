/*
 * Simple script to generate a production `environment.ts` file for the UI
 * using process.env values at build time (useful for Render deployments).
 *
 * Usage (from project root):
 *   node apps/ui/scripts/generate-env.js > apps/ui/src/environments/environment.prod.generated.ts
 *
 * Then configure your build to copy/rename that file into apps/ui/src/environments/environment.ts
 */

const env = {
  production: true,
  apiBaseUrl:
    process.env.API_BASE_URL ||
    'https://parking-control-be.lostordos.com.ar/api/v1',
  parkingSpaces: Number(process.env.PARKING_SPACES || 80),
  accessTokenKey: process.env.ACCESS_TOKEN_KEY || 'access_token',
  refreshTokenKey: process.env.REFRESH_TOKEN_KEY || 'refresh_token',
};

console.log(`export const environment = ${JSON.stringify(env, null, 2)};`);
