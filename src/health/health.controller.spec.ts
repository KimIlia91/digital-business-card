import type { HealthCheckService } from '@nestjs/terminus';
import type { DatabaseHealthIndicator } from './database.health.js';
import { HealthController } from './health.controller.js';

type Check = () => Promise<unknown>;

function createController() {
  const isHealthy = vi.fn().mockResolvedValue({ database: { status: 'up' } });
  const check = vi.fn(async (checks: Check[]) => {
    await Promise.all(checks.map((fn) => fn()));
    return { status: 'ok' };
  });
  const controller = new HealthController(
    { check } as unknown as HealthCheckService,
    { isHealthy } as unknown as DatabaseHealthIndicator,
  );
  return { controller, check, isHealthy };
}

describe('HealthController', () => {
  it('does not consult the database for liveness', async () => {
    const { controller, check, isHealthy } = createController();

    await controller.live();

    expect(check).toHaveBeenCalledWith([]);
    expect(isHealthy).not.toHaveBeenCalled();
  });

  it('consults the database for readiness', async () => {
    const { controller, isHealthy } = createController();

    await controller.ready();

    expect(isHealthy).toHaveBeenCalledTimes(1);
    expect(isHealthy).toHaveBeenCalledWith('database');
  });
});
