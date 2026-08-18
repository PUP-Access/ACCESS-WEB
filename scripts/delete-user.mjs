import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        process.env[key] = val;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const targetEmail = "z.charlesnudalo6@gmail.com".toLowerCase().trim();

async function main() {
  console.log(`Searching for data associated with: ${targetEmail}`);

  // 1. Check public.Users table
  const { data: publicUsers, error: usersErr } = await supabase
    .from("Users")
    .select("*")
    .ilike("email", targetEmail);

  if (usersErr) {
    console.error("Error checking Users table:", usersErr.message);
  } else {
    console.log(`Found ${publicUsers?.length || 0} matching record(s) in public.Users.`);
  }

  // 2. Check public.BorrowRequests table
  const { data: borrowRequests, error: borrowErr } = await supabase
    .from("BorrowRequests")
    .select("id, borrower_email, requested_item, status")
    .ilike("borrower_email", targetEmail);

  if (borrowErr) {
    console.error("Error checking BorrowRequests table:", borrowErr.message);
  } else {
    console.log(`Found ${borrowRequests?.length || 0} matching record(s) in public.BorrowRequests.`);
  }

  // 3. Check public.ContactMessages table
  const { data: contactMessages, error: contactErr } = await supabase
    .from("ContactMessages")
    .select("id, email, subject")
    .ilike("email", targetEmail);

  if (contactErr) {
    console.error("Error checking ContactMessages table:", contactErr.message);
  } else {
    console.log(`Found ${contactMessages?.length || 0} matching record(s) in public.ContactMessages.`);
  }

  // 4. Check auth.users
  const { data: authUsersData, error: authErr } = await supabase.auth.admin.listUsers();
  let authUsers = [];
  if (authErr) {
    console.error("Error checking Auth users:", authErr.message);
  } else {
    authUsers = (authUsersData?.users || []).filter(
      (u) => u.email?.toLowerCase().trim() === targetEmail
    );
    console.log(`Found ${authUsers.length} matching record(s) in Supabase Auth.`);
  }

  // If user IDs exist from public.Users or Auth, check if they own other records
  const userIds = [
    ...(publicUsers || []).map((u) => u.id),
    ...authUsers.map((u) => u.id),
  ].filter(Boolean);

  const uniqueUserIds = [...new Set(userIds)];
  console.log("Associated User IDs:", uniqueUserIds);

  // Perform Deletions
  // Delete from BorrowRequests
  if (borrowRequests && borrowRequests.length > 0) {
    const { error: delBorrowErr } = await supabase
      .from("BorrowRequests")
      .delete()
      .ilike("borrower_email", targetEmail);

    if (delBorrowErr) {
      console.error("Error deleting from BorrowRequests:", delBorrowErr.message);
    } else {
      console.log(`✓ Successfully deleted ${borrowRequests.length} record(s) from BorrowRequests.`);
    }
  }

  // Also delete BorrowRequests by user_id if any
  for (const uid of uniqueUserIds) {
    const { error: delUidBorrowErr } = await supabase
      .from("BorrowRequests")
      .delete()
      .eq("user_id", uid);
    if (!delUidBorrowErr) {
      console.log(`✓ Cleaned up any remaining BorrowRequests by user_id: ${uid}`);
    }
  }

  // Delete from ContactMessages
  if (contactMessages && contactMessages.length > 0) {
    const { error: delContactErr } = await supabase
      .from("ContactMessages")
      .delete()
      .ilike("email", targetEmail);

    if (delContactErr) {
      console.error("Error deleting from ContactMessages:", delContactErr.message);
    } else {
      console.log(`✓ Successfully deleted ${contactMessages.length} record(s) from ContactMessages.`);
    }
  }

  // Delete from public.Users
  if (publicUsers && publicUsers.length > 0) {
    const { error: delUsersErr } = await supabase
      .from("Users")
      .delete()
      .ilike("email", targetEmail);

    if (delUsersErr) {
      console.error("Error deleting from Users:", delUsersErr.message);
    } else {
      console.log(`✓ Successfully deleted ${publicUsers.length} record(s) from public.Users.`);
    }
  }

  // Delete from Supabase Auth
  for (const authUser of authUsers) {
    const { error: delAuthErr } = await supabase.auth.admin.deleteUser(authUser.id);
    if (delAuthErr) {
      console.error(`Error deleting Auth user ${authUser.id}:`, delAuthErr.message);
    } else {
      console.log(`✓ Successfully deleted user from Supabase Auth (ID: ${authUser.id}).`);
    }
  }

  console.log(`\nAll records associated with ${targetEmail} have been completely removed.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
