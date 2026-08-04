import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SignatureGuard } from './signature.guard';
import { SignatureService } from './signature.service';

describe('SignatureGuard', () => {
  const rawBody = Buffer.from('{"eventId":"evt_1","type":"payment.succeeded"}');
  let signatureService: SignatureService;
  let guard: SignatureGuard;

  const contextWith = (request: unknown): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
    }) as ExecutionContext;

  const requestWith = (signature?: string) => ({
    rawBody,
    header: () => signature,
  });

  beforeEach(() => {
    signatureService = new SignatureService({
      getOrThrow: () => 'test_secret_with_enough_length',
    } as never);
    guard = new SignatureGuard(signatureService);
  });

  it('lets a correctly signed request through', () => {
    const context = contextWith(requestWith(signatureService.sign(rawBody)));

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects a request without the signature header', () => {
    const context = contextWith(requestWith(undefined));

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('rejects a signature that does not match the raw body', () => {
    const context = contextWith(
      requestWith(signatureService.sign(Buffer.from('{"eventId":"evt_2"}'))),
    );

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
