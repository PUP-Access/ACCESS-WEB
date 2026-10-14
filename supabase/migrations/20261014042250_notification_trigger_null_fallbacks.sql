-- =============================================================================
-- Notification triggers: never build a NULL "content".
--
-- 20260831222400_notifications_schema.sql concatenates nullable columns into
-- Notifications.content (NOT NULL). In Postgres 'text' || NULL is NULL, so:
--   * a BorrowRequests insert without borrower_contact_name, or
--   * a Users row becoming 'Pending' without an email
-- made the AFTER trigger's insert fail, which aborts the originating
-- INSERT/UPDATE itself -- the borrow request / user change is lost.
--
-- Same definitions as before, with COALESCE fallbacks on the nullable columns.
-- notify_on_new_contact_message() is unchanged: full_name and concern are
-- NOT NULL on ContactMessages.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.notify_on_new_borrow_request()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."Notifications" (title, content, type, link)
  VALUES (
    'New Borrow Request',
    'Borrower '
      || COALESCE(NEW.borrower_contact_name, NEW.organization_name, 'Unknown borrower')
      || ' requested: ' || COALESCE(NEW.requested_item, 'Gear'),
    'borrow_request',
    '/admin/borrow-requests?status=Pending'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notify_on_pending_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'Pending' AND (TG_OP = 'INSERT' OR OLD.role IS DISTINCT FROM NEW.role) THEN
    INSERT INTO public."Notifications" (title, content, type, link)
    VALUES (
      'Pending Account Approval',
      'User ' || COALESCE(NEW.email, 'with no email')
        || ' (' || COALESCE(NEW.organization_name, 'No Org') || ') is pending approval.',
      'user_registration',
      '/admin/users?role=Pending'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
