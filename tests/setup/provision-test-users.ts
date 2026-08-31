import { createTestSupabaseClient } from "../helpers/test-supabase-client";

export const QA_ADMIN_EMAIL = "qa-admin@access-web.test";
export const QA_ADMIN_PASSWORD = "QaAdminTest!2026";
export const QA_BORROWER_EMAIL = "qa-borrower@access-web.test";
export const QA_BORROWER_PASSWORD = "QaBorrowerTest!2026";

async function findUserByEmail(
  supabase: ReturnType<typeof createTestSupabaseClient>,
  email: string
) {
  // Paginate through admin-listed users looking for a matching email —
  // the admin API has no direct getUserByEmail lookup.
  let page = 1;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email === email);
    if (found) return found;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

async function ensureUser(
  supabase: ReturnType<typeof createTestSupabaseClient>,
  email: string,
  password: string,
  role: "Admin" | "Organization"
): Promise<string> {
  let user = await findUserByEmail(supabase, email);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { organization_name: "QA Test Org" },
    });
    if (error) throw error;
    user = data.user;
  }

  if (!user) throw new Error(`Failed to provision test user ${email}`);

  const { error: roleError } = await supabase.from("Users").update({ role }).eq("id", user.id);
  if (roleError) throw roleError;

  return user.id;
}

/** Idempotently ensures both QA test accounts exist with the right roles. Safe to call every run. */
export async function provisionTestUsers() {
  const supabase = createTestSupabaseClient();

  const adminId = await ensureUser(supabase, QA_ADMIN_EMAIL, QA_ADMIN_PASSWORD, "Admin");
  const borrowerId = await ensureUser(supabase, QA_BORROWER_EMAIL, QA_BORROWER_PASSWORD, "Organization");

  return { adminId, borrowerId };
}
