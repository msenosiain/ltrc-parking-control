import { Controller, Get } from '@nestjs/common';

/**
 * Health check controller used by external services (e.g. Render) to verify
 * the application is alive. Keeps implementation minimal and returns HTTP 200
 * when the service is healthy.
 */
@Controller('health')
export class HealthController {
  /**
   * Simple GET health check. Returns 200 with a small JSON payload.
   */
  @Get()
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}

