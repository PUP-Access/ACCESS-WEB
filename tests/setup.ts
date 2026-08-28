import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Automatically cleanup after each React Testing Library test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Setup mock environment variables for tests
process.env.NEXT_PUBLIC_SITE_URL = "https://pupaccess.org";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-service-role-key";
process.env.RESEND_API_KEY = "re_mock_resend_api_key";

// Mock Next.js navigation & cache
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => "/"),
  redirect: vi.fn((url: string) => {
    const error = new Error(`NEXT_REDIRECT: ${url}`);
    (error as unknown as { digest: string }).digest = `NEXT_REDIRECT;replace;${url};307;`;
    throw error;
  }),
  notFound: vi.fn(() => {
    const error = new Error("NEXT_NOT_FOUND");
    (error as unknown as { digest: string }).digest = "NEXT_NOT_FOUND";
    throw error;
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
