import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Event, EventStatus } from '../events/event.entity';
import { EventsService } from '../events/events.service';
import { PaymentHandlerService } from './payment-handler.service';
import { ReprocessService } from './reprocess.service';

describe('ReprocessService', () => {
  let events: Map<string, Event>;
  let paymentHandler: { handle: jest.Mock };
  let service: ReprocessService;

  const eventWith = (status: EventStatus, error: string | null = null): Event =>
    ({
      id: 'b3f3f0c4-1c2e-4a5b-9a1d-0d5f1a2b3c4d',
      eventId: 'evt_1',
      type: 'payment.succeeded',
      payload: {},
      status,
      error,
      processedAt: null,
      receivedAt: new Date(),
    }) as Event;

  const store = (event: Event): Event => {
    events.set(event.id, event);
    return event;
  };

  beforeEach(async () => {
    events = new Map<string, Event>();
    paymentHandler = { handle: jest.fn().mockResolvedValue(undefined) };

    const eventsService = {
      findById: (id: string) => Promise.resolve(events.get(id) ?? null),
      markProcessed: (event: Event) => {
        event.status = EventStatus.Processed;
        event.error = null;
        event.processedAt = new Date();
        return Promise.resolve(event);
      },
      markFailed: (event: Event, error: string) => {
        event.status = EventStatus.Failed;
        event.error = error;
        return Promise.resolve(event);
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ReprocessService,
        { provide: EventsService, useValue: eventsService },
        { provide: PaymentHandlerService, useValue: paymentHandler },
      ],
    }).compile();

    service = moduleRef.get(ReprocessService);
  });

  it('replays a failed event and marks it as processed', async () => {
    const event = store(eventWith(EventStatus.Failed, 'gateway timeout'));

    const result = await service.reprocess(event.id);

    expect(paymentHandler.handle).toHaveBeenCalledTimes(1);
    expect(result.status).toBe(EventStatus.Processed);
    expect(event.error).toBeNull();
    expect(event.processedAt).not.toBeNull();
  });

  it('keeps the event failed with the new error when the replay fails again', async () => {
    const event = store(eventWith(EventStatus.Failed, 'gateway timeout'));
    paymentHandler.handle.mockRejectedValueOnce(new Error('still unavailable'));

    const result = await service.reprocess(event.id);

    expect(result.status).toBe(EventStatus.Failed);
    expect(result.error).toBe('still unavailable');
  });

  it('refuses to replay an event that already succeeded', async () => {
    const event = store(eventWith(EventStatus.Processed));

    await expect(service.reprocess(event.id)).rejects.toThrow(
      ConflictException,
    );
    expect(paymentHandler.handle).not.toHaveBeenCalled();
  });

  it('refuses to replay a duplicate delivery', async () => {
    const event = store(eventWith(EventStatus.Duplicate));

    await expect(service.reprocess(event.id)).rejects.toThrow(
      ConflictException,
    );
    expect(paymentHandler.handle).not.toHaveBeenCalled();
  });

  it('fails when the event does not exist', async () => {
    await expect(
      service.reprocess('00000000-0000-4000-8000-000000000000'),
    ).rejects.toThrow(NotFoundException);
  });
});
