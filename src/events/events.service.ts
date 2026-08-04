import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event, EventStatus } from './event.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly repository: Repository<Event>,
  ) {}

  record(
    eventId: string,
    type: string,
    payload: Record<string, unknown>,
  ): Promise<Event> {
    const event = this.repository.create({
      eventId,
      type,
      payload,
      status: EventStatus.Received,
    });

    return this.repository.save(event);
  }

  markDuplicate(event: Event): Promise<Event> {
    event.status = EventStatus.Duplicate;

    return this.repository.save(event);
  }

  findById(id: string): Promise<Event | null> {
    return this.repository.findOneBy({ id });
  }

  findByEventId(eventId: string): Promise<Event[]> {
    return this.repository.find({
      where: { eventId },
      order: { receivedAt: 'DESC' },
    });
  }
}
