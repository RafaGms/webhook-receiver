import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { SignatureService } from './signature.service';

describe('SignatureService', () => {
  const secret = 'test_secret_with_enough_length';
  let service: SignatureService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SignatureService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => secret },
        },
      ],
    }).compile();

    service = moduleRef.get(SignatureService);
  });

  it('accepts a signature generated with the shared secret', () => {
    const rawBody = Buffer.from(
      '{"eventId":"evt_1","type":"payment.succeeded"}',
    );

    expect(service.verify(rawBody, service.sign(rawBody))).toBe(true);
  });

  it('rejects a tampered payload', () => {
    const original = Buffer.from('{"eventId":"evt_1","data":{"amount":4990}}');
    const tampered = Buffer.from('{"eventId":"evt_1","data":{"amount":1}}');

    expect(service.verify(tampered, service.sign(original))).toBe(false);
  });

  it('rejects a signature with a different length instead of throwing', () => {
    const rawBody = Buffer.from('{"eventId":"evt_1"}');

    expect(service.verify(rawBody, 'deadbeef')).toBe(false);
  });
});
