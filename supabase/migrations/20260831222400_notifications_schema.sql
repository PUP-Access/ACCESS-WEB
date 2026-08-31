-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS public."Notifications" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public."Users"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public."Notifications" ENABLE ROW LEVEL SECURITY;

-- 3. Select Policy
DROP POLICY IF EXISTS "Admins can select notifications" ON public."Notifications";
CREATE POLICY "Admins can select notifications"
  ON public."Notifications"
  FOR SELECT
  USING (
    exists (
      SELECT 1 FROM public."Users" 
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- 4. Update Policy (Mark as read)
DROP POLICY IF EXISTS "Admins can update notifications" ON public."Notifications";
CREATE POLICY "Admins can update notifications"
  ON public."Notifications"
  FOR UPDATE
  USING (
    exists (
      SELECT 1 FROM public."Users" 
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );


-- 5. Trigger function and trigger for new borrow requests
CREATE OR REPLACE FUNCTION public.notify_on_new_borrow_request()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."Notifications" (title, content, type, link)
  VALUES (
    'New Borrow Request',
    'Borrower ' || NEW.borrower_contact_name || ' requested: ' || COALESCE(NEW.requested_item, 'Gear'),
    'borrow_request',
    '/admin/borrow-requests?status=Pending'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_notify_on_new_borrow_request
  AFTER INSERT ON public."BorrowRequests"
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_borrow_request();

-- 6. Trigger function and trigger for new contact messages
CREATE OR REPLACE FUNCTION public.notify_on_new_contact_message()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."Notifications" (title, content, type, link)
  VALUES (
    'New Contact Message',
    'Inquiry from ' || NEW.full_name || ': ' || substring(NEW.concern from 1 for 60) || CASE WHEN length(NEW.concern) > 60 THEN '...' ELSE '' END,
    'contact_message',
    '/admin/contact-messages'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_notify_on_new_contact_message
  AFTER INSERT ON public."ContactMessages"
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_contact_message();

-- 7. Trigger function and trigger for pending user registrations
CREATE OR REPLACE FUNCTION public.notify_on_pending_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'Pending' AND (TG_OP = 'INSERT' OR OLD.role IS DISTINCT FROM NEW.role) THEN
    INSERT INTO public."Notifications" (title, content, type, link)
    VALUES (
      'Pending Account Approval',
      'User ' || NEW.email || ' (' || COALESCE(NEW.organization_name, 'No Org') || ') is pending approval.',
      'user_registration',
      '/admin/users?role=Pending'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_notify_on_pending_user
  AFTER INSERT OR UPDATE ON public."Users"
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_pending_user();

-- 8. Enable Realtime broadcast for Notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public."Notifications";

