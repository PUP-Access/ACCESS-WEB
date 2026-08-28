-- =============================================================================
-- Final step: Equipments has been fully superseded by Assets + BorrowRequestItems.
-- CASCADE drops its RLS policies automatically (confirmed: no other table has
-- an FK referencing Equipments.id).
-- =============================================================================
DROP TABLE IF EXISTS "Equipments" CASCADE;
