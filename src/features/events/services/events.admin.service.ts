import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { checkRole } from "@/utils/checkRole";
import { rolesForArea } from "@/utils/adminAccess";
import {
  AdminEventsFilterSchema,
  CreateEventSchema,
  EventIdSchema,
  UpdateEventSchema,
} from "../schemas";
import { validateEventImage } from "../utils/image-validation";
import { AppError } from "@/lib/errors";

export type EventsFilter = {
  status?: "Published" | "Draft" | "All";
  page?: number;
  limit?: number;
};

export async function getEventsForAdmin({ status = "All", page = 1, limit = 10 }: EventsFilter = {}) {
  const filters = AdminEventsFilterSchema.parse({ status, page, limit });

  await checkRole({ roles: rolesForArea("events") });
  const supabase = await createSupabaseServerClient();

  const max_rows = Math.min(filters.limit, 50);
  const from = (filters.page - 1) * filters.limit;
  const to = from + max_rows - 1;

  let query = supabase
    .from("Events")
    .select("id, title, content_description, event_date, status, image_url", { count: "exact" });

  if (filters.status !== "All") {
    query = query.eq("status", filters.status);
  }

  query = query
    .order("event_date", { ascending: false })
    .range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data,
    meta: { 
      page: filters.page, 
      limit: filters.limit, 
      total: count ?? 0, 
      totalPages: Math.ceil((count ?? 0) / filters.limit) 
    },
  };
}

export async function getEventForAdminById(id: string) {
  EventIdSchema.parse(id);

  await checkRole({ roles: rolesForArea("events") });
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("Events")
    .select("id, title, content_description, event_date, status, image_url, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new AppError(`Event with id ${id} not found`, 404);
  return data;
}

export async function publishEventById(id: string) {
  EventIdSchema.parse(id);

  await checkRole({ roles: rolesForArea("events") });
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('Events')
    .update({ status: 'Published' })
    .eq('id', id);

  if (error) throw error;
}

export async function unpublishEventById(id: string) {
  EventIdSchema.parse(id);

  await checkRole({ roles: rolesForArea("events") });
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('Events')
    .update({ status: 'Draft' })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteEventById(id: string) {
  EventIdSchema.parse(id);

  await checkRole({ roles: rolesForArea("events") });
  const supabase = await createSupabaseServerClient();

  // Fetch the image_url before deleting
  const { data: event, error: fetchError } = await supabase
    .from("Events")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) throw fetchError;

  // Delete image from storage if it exists
  if (event?.image_url) {
    const path = event.image_url.split("/access_web_assets/")[1]?.split("?")[0];
    if (path) {
      const { error: storageError } = await supabase.storage
        .from("access_web_assets")
        .remove([path]);

      if (storageError) console.error("[deleteEventById] Failed to delete image:", storageError);
    }
  }

  const { data, error } = await supabase
    .from("Events")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export type EventProps = {
  title: string;
  content_description: string;
  event_date?: string;
  status: "Published" | "Draft";
  image_url?: string; 
};

export async function postEvent(event: EventProps) {
  const validatedEvent = CreateEventSchema.parse(event);

  await checkRole({ roles: rolesForArea("events") });
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from("Events")
    .insert({
      title: validatedEvent.title,
      content_description: validatedEvent.content_description,
      event_date: validatedEvent.event_date || null, 
      status: validatedEvent.status ?? "Draft",
      image_url: validatedEvent.image_url,
      created_by: user?.id,
      created_at: new Date().toISOString(),
      updated_at: null
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function uploadEventImage(file: File): Promise<string> {
  const supabase = await createSupabaseServerClient();

  const { mimeType, extension } = await validateEventImage(file);
  const fileName = `${crypto.randomUUID()}.${extension}`;
  const filePath = `events/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("access_web_assets") // replace with your bucket name
    .upload(filePath, file, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
  .from("access_web_assets")
  .getPublicUrl(filePath);

  return data.publicUrl;
}

export type UpdateEventProps = Partial<EventProps>;

export async function editEvent(id: string, event: UpdateEventProps) {
  EventIdSchema.parse(id);

  const validatedEvent = UpdateEventSchema.parse(event);

  await checkRole({ roles: rolesForArea("events") });
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("Events")
    .update({
      ...validatedEvent,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new AppError(`Event with id ${id} not found`, 404);
  return data;
}