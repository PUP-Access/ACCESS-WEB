import { getPublishedEvents } from "@/features/events/services/events.public.service";
import EventsGrid from "./EventsGrid";
import { Reveal } from "./Reveal";

export default async function EventsSection() {
  const { data: events } = await getPublishedEvents({ status: "all", limit: 9 });

  const cards =
    events?.map((event) => ({
      title: event.title ?? "",
      description: event.content_description ?? "",
      date: event.event_date ? new Date(event.event_date).toLocaleDateString() : "",
      image: event.image_url ?? "/BG-ACCESS.webp",
      href: `/events/${event.id}`,
    })) ?? [];

  return (
    <div id="events" className="landing-section scroll-mt-24 py-20 px-5 sm:px-8 md:px-16 lg:px-24">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="mb-8 text-center text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-widest title-header">
            Events
          </h2>
        </Reveal>

        <EventsGrid events={cards} />
      </div>
    </div>
  );
}
