# Automated Testing Guide

This guide covers the testing architecture, test coverage, local execution, Dockerized test execution, and recommended testing workflows for the **PUP ACCESS Web Portal**.

---

## 1. Overview & Architecture

The project uses **Vitest**, **React Testing Library**, and **JSDOM** to provide fast, reliable, and type-safe test execution across unit, integration, component, and security boundary levels.

### Key Features
- **109 Automated Tests across 13 Suites**: 100% passing across unit, integration, component, and adversarial edge-case layers.
- **High Code Coverage**: Over 80%–100% statement coverage across core actions, services, validation schemas, utilities, and components.
- **Dual Runtime Support**: Tests can be run natively on your local machine using `pnpm` or inside a fully isolated, mock-backed **Docker environment**.

---

## 2. Test Suite Structure & Coverage

All test files are organized under the [`tests/`](file:///home/renzarcilla09/Programming/ACCESS-WEB/tests) directory:

```
tests/
├── setup.ts                                          # Global mocks (Next.js navigation, cache, env vars)
├── helpers/
│   └── supabase-mock.ts                              # Strongly typed Supabase query builder & auth mock
└── features/
    ├── auth/
    │   ├── schemas.test.ts                           # Unit: Login, Signup, Forgot/Reset password validation
    │   ├── auth.services.test.ts                     # Unit/Integration: Auth link generation, Resend email dispatch
    │   ├── auth.actions.test.ts                      # Unit/Integration: Server actions, cache revalidation, redirects
    │   ├── components.test.tsx                       # Component: Forms (Login, Register, Reset, Forgot, Logout)
    │   └── proxy.test.ts                             # Feature: Route protection, auth & admin middleware redirects
    ├── profiles/
    │   ├── profile.actions.test.ts                   # Unit/Integration: Name updates, base64 avatar upload, password change
    │   └── EditProfileModal.test.tsx                 # Component: Tab switching, password & photo editing dialog
    ├── admin-users/
    │   ├── checkRole.test.ts                         # Unit: Role verification utility (401/403 guards)
    │   ├── users.admin.service.test.ts               # Unit/Integration: User stats, pagination, search, role updates, delete
    │   ├── users.actions.test.ts                     # Unit/Integration: Admin role update & account deletion actions
    │   └── admin-users-components.test.tsx           # Component: Table, role dropdown, quick approve, delete modal, search
    └── adversarial/
        ├── auth-adversarial.test.ts                  # Security/Edge: Partial registration failures, prefix collision
        └── roles-and-profiles-adversarial.test.ts   # Security/Edge: Strict role equality vs hierarchy, SQL wildcard handling
```

---

## 3. Running Tests Locally

### Prerequisites
- Node.js `20.x` or higher
- `pnpm` (`10.x` or higher)

### Commands

```bash
# 1. Run all test suites once
pnpm test

# 2. Run tests in interactive watch mode (re-runs on file changes)
pnpm test:watch

# 3. Generate a detailed code coverage report
pnpm test:coverage

# 4. Run a specific test file or directory
pnpm vitest run tests/features/auth/
pnpm vitest run tests/features/profiles/
pnpm vitest run tests/features/admin-users/
pnpm vitest run tests/features/adversarial/
```

---

## 4. Running Tests in Docker

The project includes [`docker-compose.test.yml`](file:///home/renzarcilla09/Programming/ACCESS-WEB/docker-compose.test.yml) to spin up an isolated, self-contained test environment.

### Docker Test Architecture
1. **`mailpit-mock`**: Spawns a local [Mailpit](https://github.com/axllent/mailpit) email service on port `8025` (Web UI) and port `1025` (SMTP) to capture and inspect transactional emails without contacting live email services.
2. **`postgres-test`**: Spawns a dedicated PostgreSQL 16 instance with all SQL migration files from `supabase/migrations/` automatically mounted and executed on boot.
3. **`test-runner`**: Runs the entire test suite inside an isolated Docker container on the shared test network.

### Commands

```bash
# 1. Run the entire test suite in Docker
pnpm test:docker
# (Equivalent to: docker compose -f docker-compose.test.yml run --rm test-runner)

# 2. Rebuild the test container after changing dependencies
docker compose -f docker-compose.test.yml build test-runner

# 3. Stop and clean up test containers and networks
docker compose -f docker-compose.test.yml down
```

---

## 5. Local vs. Docker: Which Environment is Better?

| Criteria | Local Environment (`pnpm test`) | Docker Environment (`docker compose ... test-runner`) |
| :--- | :--- | :--- |
| **Speed & Feedback Loop** | **Ultra Fast (~1-2 seconds)** | Slower (~5-10s startup + container overhead) |
| **Interactive Watch Mode** | **Yes (`pnpm test:watch`)** — instant feedback on save | Clunky inside container |
| **Resource Usage** | **Very Lightweight (RAM/CPU minimal)** | Higher (spins up Postgres + Mailpit + Node containers) |
| **Environment Isolation** | Relies on host Node & `node_modules` | **100% Hermetic & Clean (Cleanroom environment)** |
| **Dependency Parity** | Host-dependent | **Guaranteed identical across all OS (Linux/Mac/Windows)** |
| **Integration Services** | Mocked in memory | **Spins up real Postgres + Mailpit mock services** |

---

### Suggested Recommendation

> [!TIP]
> **Use a Hybrid Workflow:**
>
> 1. **Day-to-Day Development (Local `pnpm test:watch` or `pnpm test`)**:
>    - **Best Choice for Dev Velocity.** Use this while developing features and refactoring. Tests run in under 2 seconds and automatically re-run whenever you save a file.
>
> 2. **Pre-Commit / Pre-Push / CI (Docker `pnpm test:docker`)**:
>    - **Best Choice for Validation & Releases.** Use this before submitting PRs, pushing major releases, or inside GitHub Actions CI pipelines to guarantee that the tests run cleanly in an identical, containerized environment regardless of local machine configuration.
