import {
  CanActivate,
  ExecutionContext,
  Injectable,
  RawBodyRequest,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SIGNATURE_HEADER, SignatureService } from './signature.service';

@Injectable()
export class SignatureGuard implements CanActivate {
  constructor(private readonly signatureService: SignatureService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<RawBodyRequest<Request>>();

    const signature = request.header(SIGNATURE_HEADER);
    const rawBody = request.rawBody;

    if (!signature || !rawBody?.length) {
      throw new UnauthorizedException('missing signature');
    }

    if (!this.signatureService.verify(rawBody, signature)) {
      throw new UnauthorizedException('invalid signature');
    }

    return true;
  }
}
