# System Architecture: Suggestions & Best Practices

Based on the requirements provided, here are some critiques, suggestions, and architectural best practices to ensure the ACCESS system is secure, scalable, and highly maintainable over time.

## 1. Authentication & Security
- **Self-Registration with Admin Approval**: Allowing users to create their own accounts reduces administrative overhead. However, ensure that new accounts default to a restricted role (e.g., "Pending") and require explicit admin approval/role upgrade before they can interact with the borrowing system.
- **Role Dashboard**: Provide admins with a clear dashboard to review pending registrations, verifying the user's organization before granting the "Organization" role.
- **Self-Serve Account Retrieval**: Implement a secure, self-serve password reset flow. When a user forgets their password, they should be able to trigger an email containing a secure, time-limited token link. *Sending passwords in plain text is a severe security vulnerability.*

## 2. Asset & QR Code Strategy
- **Grouped Quantities**: Assets are tracked as one catalog record per item type with a `quantity` count (e.g. one "Folding Chair" record with quantity 20), not as one record per physical unit. There is no per-unit condition or status tracking — every unit of an `Assets` row is assumed functional and borrowable.
- **QR Code Routing**: The QR code data should simply be a URL back to your application, such as `https://access.cea/admin/assets/scan/{uuid}`.
  - When an admin scans it with their phone camera, it opens their browser. 
  - If they are logged in, it instantly shows the asset's current availability and offers one-tap action buttons (e.g., "Mark as Picked Up", "Mark as Returned").

## 3. Handling Borrowing & Availability Conflicts
- **Date Range Overlaps**: When a user selects a date range for items, the backend MUST validate that the requested quantity doesn't exceed the asset's remaining `quantity` after subtracting units already reserved by overlapping Pending/Approved/Active borrow requests for that date range.
- **Database Constraints**: Use robust querying to check availability. *Example logic: An asset is available if (quantity − sum of overlapping reserved quantities) >= the newly requested quantity for the given date range.*

## 4. File Uploads (Request Letters)
- **Supabase Storage**: Use Supabase Storage with two buckets: a `public-media` bucket for Event posters and Officer photos, and a `request-letters` private bucket for uploaded PDF letters. Never store files directly in the database.
- **Database Reference**: Only save the URL/path to the file in your `BorrowRequests` table (`letter_file_url`). Use `createSignedUrl()` for secure, time-limited access to private letters.

## 5. UI/UX Considerations
- **Dynamic Carts**: Treat the item selection process like an eCommerce "Shopping Cart". Users add items to their cart, verify their cart, then "checkout" by providing their dates, specific contact info (Name, Number), and uploading the letter.
- **Responsive Tables/Dashboards**: Ensure the Admin dashboard is highly responsive. Admins might be using tablets or phones while navigating the storage room to release items.

## 6. Email Delivery
- **Transactional Service**: Use a dedicated transactional email service provider (like Resend, SendGrid, Amazon SES, or Postmark) rather than a standard SMTP relay (like Gmail). This prevents emails from landing in spam folders and provides tracking for "Delivered" and "Opened" states.

## 7. Audit & Accountability
- **Audit Logs**: Maintain an `AuditLogs` table. If a projector goes missing, the Admin can view the precise history of who borrowed it, who approved it, and when it was marked returned — for the current month. By product decision, `AuditLogs` is **not** a permanent record: a monthly `pg_cron` job (`purge_old_audit_logs`) deletes every entry (any entity type) once its `created_at` falls in a prior month.
- **Monthly Data Retention**: A separate `pg_cron` job (`purge_old_borrow_requests`) permanently deletes `BorrowRequests`/`BorrowRequestItems` once a request reaches a terminal status (Returned, Rejected, or Cancelled) and a full calendar month has passed since its `updated_at`. Their letter PDFs are also removed from Storage (queued for the app to drain, since `pg_cron` can't call the Storage API directly).
- **Soft Deletes**: If an Asset is broken and thrown away, use a "Soft Delete" strategy (e.g., marking an `is_deleted` flag as true) rather than hard-deleting the row.
