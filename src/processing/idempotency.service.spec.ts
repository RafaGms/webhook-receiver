import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { IdempotencyService } from './idempotency.service';
import { RedisClient } from './redis.client';

describe('IdempotencyService', () => {
  const ttl = 3600;
  let keys: Set<string>;
  let redis: { set: jest.Mock; del: jest.Mock };
  let service: IdempotencyService;

  beforeEach(async () => {
    keys = new Set<string>();

    redis = {
      set: jest.fn((key: string) => {
        if (keys.has(key)) {
          return Promise.resolve(null);
        }

        keys.add(key);
        return Promise.resolve('OK');
      }),
      del: jest.fn((key: string) => {
        keys.delete(key);
        return Promise.resolve(1);
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        IdempotencyService,
        { provide: RedisClient, useValue: redis },
        { provide: ConfigService, useValue: { getOrThrow: () => ttl } },
      ],
    }).compile();

    service = moduleRef.get(IdempotencyService);
  });

  it('claims an event id with SET NX and a ttl', async () => {
    await service.claim('evt_1');

    expect(redis.set).toHaveBeenCalledWith(
      'idempotency:evt_1',
      '1',
      'EX',
      ttl,
      'NX',
    );
  });

  it('lets only the first delivery of the same event id through', async () => {
    await expect(service.claim('evt_1')).resolves.toBe(true);
    await expect(service.claim('evt_1')).resolves.toBe(false);
    await expect(service.claim('evt_1')).resolves.toBe(false);
  });

  it('does not block a different event id', async () => {
    await expect(service.claim('evt_1')).resolves.toBe(true);
    await expect(service.claim('evt_2')).resolves.toBe(true);
  });

  it('allows a new claim after the key is released', async () => {
    await service.claim('evt_1');
    await service.release('evt_1');

    await expect(service.claim('evt_1')).resolves.toBe(true);
  });
});
