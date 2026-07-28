"use client";

import { EventCard, type EventCardProps } from "@/features/events";
import { RevealStagger } from "./Reveal";

type EventsGridProps = {
  events: EventCardProps[];
};

export default function EventsGrid({ events }: EventsGridProps) {
  if (events.length === 0) {
    return (
      <p className="text-center text-slate-400">No upcoming events.</p>
    );
  }

  return (
    <RevealStagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event.href ?? `${event.title}-${event.date}`} {...event} />
      ))}
    </RevealStagger>
  );
}
