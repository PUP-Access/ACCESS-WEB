import { vi } from "vitest";

export interface MockQueryBuilder {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  ilike: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  then: (resolve: (val: unknown) => unknown) => Promise<unknown>;
}

export function createMockQueryBuilder(resolvedValue: { data: unknown; error: unknown; count?: number | null } = { data: null, error: null, count: null }): MockQueryBuilder {
  const builder = {} as MockQueryBuilder;

  builder.select = vi.fn().mockImplementation(() => builder);
  builder.insert = vi.fn().mockImplementation(() => builder);
  builder.update = vi.fn().mockImplementation(() => builder);
  builder.delete = vi.fn().mockImplementation(() => builder);
  builder.eq = vi.fn().mockImplementation(() => builder);
  builder.neq = vi.fn().mockImplementation(() => builder);
  builder.ilike = vi.fn().mockImplementation(() => builder);
  builder.or = vi.fn().mockImplementation(() => builder);
  builder.order = vi.fn().mockImplementation(() => builder);
  builder.range = vi.fn().mockImplementation(() => builder);
  builder.single = vi.fn().mockImplementation(() => Promise.resolve(resolvedValue));
  builder.maybeSingle = vi.fn().mockImplementation(() => Promise.resolve(resolvedValue));
  
  // Make the builder thenable so `await query` resolves to resolvedValue
  builder.then = (resolve: (val: unknown) => unknown) => Promise.resolve(resolvedValue).then(resolve);

  return builder;
}

export function createMockSupabaseClient() {
  const mockTableBuilders: Record<string, MockQueryBuilder> = {};

  const getOrCreateBuilder = (table: string) => {
    if (!mockTableBuilders[table]) {
      mockTableBuilders[table] = createMockQueryBuilder();
    }
    return mockTableBuilders[table];
  };

  const client = {
    from: vi.fn().mockImplementation((table: string) => getOrCreateBuilder(table)),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({
        error: null,
      }),
      updateUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      admin: {
        generateLink: vi.fn().mockResolvedValue({
          data: { properties: { action_link: "https://example.com/confirm" } },
          error: null,
        }),
        deleteUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: "avatars/test.png" }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: "https://storage.example.com/avatars/test.png" },
        }),
      }),
    },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    }),
    removeChannel: vi.fn().mockResolvedValue("ok"),
    _builders: mockTableBuilders,
    _setTableResult: (table: string, result: { data: unknown; error: unknown; count?: number | null }) => {
      mockTableBuilders[table] = createMockQueryBuilder(result);
    },
  };

  return client;
}
