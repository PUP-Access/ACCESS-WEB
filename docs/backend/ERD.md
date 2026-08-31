# Entity Relationship Diagram (ERD)

The following Mermaid diagram outlines the relational database structure needed to support the ACCESS Borrowing System, CMS, and Asset Tracking.

> [!IMPORTANT]
> This schema uses Supabase Auth for authentication. The `Users` (or `public.users`) table extends `auth.users` — passwords are managed entirely by Supabase, NOT stored in your application tables.

```mermaid
erDiagram
    Users ||--o{ BorrowRequests : "makes"
    Users ||--o{ Events : "creates"
    Users ||--o{ Officers : "optionally_linked"
    BorrowRequests ||--|{ BorrowRequestItems : "contains"
    Assets ||--o{ BorrowRequestItems : "included_in"

    Users {
        uuid id PK "References auth.users(id)"
        string email
        string role "Enum: Admin, Organization, Pending"
        string organization_name
        datetime created_at
        datetime updated_at
    }

    Assets {
        uuid id PK
        uuid target_qr_identifier "Unique string for QR generation"
        string name
        string category
        string description
        string image_url "Supabase Storage Public URL"
        boolean is_deleted "Soft delete flag, default false"
        datetime created_at
        datetime updated_at
    }

    Events {
        uuid id PK
        string title
        text content_description
        datetime event_date
        string status "Enum: Draft, Published"
        string image_url "Supabase Storage Public URL"
        uuid created_by FK "References Users(id) [Admin/Officer]"
        datetime created_at
        datetime updated_at
    }

    Officers {
        uuid id PK
        uuid user_id FK "Optional: References Users(id)"
        string full_name
        string email "Contact email for frontend display"
        string position_title "e.g., President, Secretary"
        string department "e.g., Computer Engineering"
        string academic_year "e.g., 2025-2026"
        string image_url "Supabase Storage Public URL"
        int display_order "For ordering on frontend"
        boolean is_active "True if currently serving"
        datetime created_at
        datetime updated_at
    }

    BorrowRequests {
        uuid id PK
        uuid user_id FK "References Users(id) [Organization]"
        string borrower_contact_name "Specific person borrowing"
        string borrower_email
        string borrower_phone
        datetime requested_start_date
        datetime requested_end_date
        string letter_file_url "Supabase Storage Secured/Signed URL"
        string status "Enum: Pending, Approved, Rejected, Active, Returned, Cancelled"
        text rejection_reason "Reason for rejection, null if not rejected"
        uuid reviewed_by FK "References Users(id) [Admin/Officer]"
        datetime reviewed_at
        datetime created_at
        datetime updated_at
    }

    BorrowRequestItems {
        uuid id PK
        uuid borrow_request_id FK
        uuid asset_id FK
    }

    AuditLogs {
        uuid id PK
        uuid user_id FK "Who performed the action"
        string action "e.g., STATUS_CHANGED, REQUEST_APPROVED"
        string entity_type "e.g., Asset, BorrowRequest"
        uuid entity_id
        json state_changes "Delta of changes made"
        datetime created_at
    }
```
