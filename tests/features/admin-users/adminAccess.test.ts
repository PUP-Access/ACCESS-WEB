import { describe, it, expect } from "vitest";
import {
  ADMIN_ROLES,
  canAccessArea,
  getAdminAreaForPath,
  getDefaultAdminPath,
  isAdminRole,
  rolesForArea,
} from "@/utils/adminAccess";

describe("adminAccess", () => {
  describe("isAdminRole", () => {
    it("recognizes the four admin-capable roles", () => {
      expect(isAdminRole("Admin")).toBe(true);
      expect(isAdminRole("Tech")).toBe(true);
      expect(isAdminRole("SponsorsPartners")).toBe(true);
      expect(isAdminRole("Govs")).toBe(true);
    });

    it("rejects every other role, including null/undefined", () => {
      expect(isAdminRole("Organization")).toBe(false);
      expect(isAdminRole("Pending")).toBe(false);
      expect(isAdminRole(null)).toBe(false);
      expect(isAdminRole(undefined)).toBe(false);
      expect(isAdminRole("SomeFutureRole")).toBe(false);
    });
  });

  describe("getAdminAreaForPath", () => {
    it("maps bare /admin to the dashboard area", () => {
      expect(getAdminAreaForPath("/admin")).toBe("dashboard");
    });

    it("maps each known admin route to its area", () => {
      expect(getAdminAreaForPath("/admin/content/landing")).toBe("landing");
      expect(getAdminAreaForPath("/admin/content/about")).toBe("about");
      expect(getAdminAreaForPath("/admin/content/about-images")).toBe("about-images");
      expect(getAdminAreaForPath("/admin/content/sponsors-partners")).toBe("sponsors-partners");
      expect(getAdminAreaForPath("/admin/content/officers-template")).toBe("officers-section");
      expect(getAdminAreaForPath("/admin/officers")).toBe("officers");
      expect(getAdminAreaForPath("/admin/content/faqs")).toBe("faqs");
      expect(getAdminAreaForPath("/admin/events")).toBe("events");
      expect(getAdminAreaForPath("/admin/borrow-requests")).toBe("borrow-requests");
      expect(getAdminAreaForPath("/admin/inventory")).toBe("inventory");
      expect(getAdminAreaForPath("/admin/contact-messages")).toBe("contact-messages");
      expect(getAdminAreaForPath("/admin/users")).toBe("users");
      expect(getAdminAreaForPath("/admin/audit-logs")).toBe("audit-logs");
    });

    it("resolves sub-routes to the same area as their parent", () => {
      expect(getAdminAreaForPath("/admin/officers/new")).toBe("officers");
      expect(getAdminAreaForPath("/admin/events/new")).toBe("events");
      expect(getAdminAreaForPath("/admin/events/edit/abc-123")).toBe("events");
      expect(getAdminAreaForPath("/admin/borrow-requests/abc-123")).toBe("borrow-requests");
      expect(getAdminAreaForPath("/admin/audit-logs/export")).toBe("audit-logs");
    });

    it("does not let /admin/content/about-images collide with /admin/content/about", () => {
      expect(getAdminAreaForPath("/admin/content/about-images")).toBe("about-images");
      expect(getAdminAreaForPath("/admin/content/about-images/foo")).toBe("about-images");
    });

    it("returns null for an unrecognized admin path", () => {
      expect(getAdminAreaForPath("/admin/some-future-page")).toBeNull();
    });
  });

  describe("canAccessArea", () => {
    it("lets Admin access every known area, including unrecognized ones would still be denied by null", () => {
      for (const area of ["dashboard", "landing", "users", "audit-logs", "inventory"] as const) {
        expect(canAccessArea("Admin", area)).toBe(true);
      }
    });

    it("scopes Tech to borrow-requests, inventory, and contact-messages only", () => {
      expect(canAccessArea("Tech", "borrow-requests")).toBe(true);
      expect(canAccessArea("Tech", "inventory")).toBe(true);
      expect(canAccessArea("Tech", "contact-messages")).toBe(true);
      expect(canAccessArea("Tech", "dashboard")).toBe(false);
      expect(canAccessArea("Tech", "users")).toBe(false);
      expect(canAccessArea("Tech", "audit-logs")).toBe(false);
      expect(canAccessArea("Tech", "events")).toBe(false);
    });

    it("scopes SponsorsPartners to sponsors-partners and contact-messages only", () => {
      expect(canAccessArea("SponsorsPartners", "sponsors-partners")).toBe(true);
      expect(canAccessArea("SponsorsPartners", "contact-messages")).toBe(true);
      expect(canAccessArea("SponsorsPartners", "inventory")).toBe(false);
      expect(canAccessArea("SponsorsPartners", "landing")).toBe(false);
    });

    it("scopes Govs to landing/about/about-images/officers/officers-section/faqs/events/contact-messages", () => {
      const allowed = [
        "landing",
        "about",
        "about-images",
        "officers",
        "officers-section",
        "faqs",
        "events",
        "contact-messages",
      ] as const;
      for (const area of allowed) {
        expect(canAccessArea("Govs", area)).toBe(true);
      }
      expect(canAccessArea("Govs", "sponsors-partners")).toBe(false);
      expect(canAccessArea("Govs", "inventory")).toBe(false);
      expect(canAccessArea("Govs", "borrow-requests")).toBe(false);
      expect(canAccessArea("Govs", "users")).toBe(false);
      expect(canAccessArea("Govs", "dashboard")).toBe(false);
    });

    it("denies every non-admin role any area at all, including 'dashboard' via a truthy-looking area", () => {
      expect(canAccessArea("Organization", "contact-messages")).toBe(false);
      expect(canAccessArea("Pending", "contact-messages")).toBe(false);
      expect(canAccessArea(null, "contact-messages")).toBe(false);
      expect(canAccessArea(undefined, "dashboard")).toBe(false);
    });

    it("denies access to an unrecognized area (null) for every role except Admin", () => {
      expect(canAccessArea("Admin", null)).toBe(true);
      expect(canAccessArea("Tech", null)).toBe(false);
      expect(canAccessArea("SponsorsPartners", null)).toBe(false);
      expect(canAccessArea("Govs", null)).toBe(false);
    });
  });

  describe("rolesForArea", () => {
    it("returns only Admin for admin-exclusive areas", () => {
      expect(rolesForArea("dashboard")).toEqual(["Admin"]);
      expect(rolesForArea("users")).toEqual(["Admin"]);
      expect(rolesForArea("audit-logs")).toEqual(["Admin"]);
    });

    it("returns Admin + Tech for borrow-requests and inventory", () => {
      expect(rolesForArea("borrow-requests")).toEqual(["Admin", "Tech"]);
      expect(rolesForArea("inventory")).toEqual(["Admin", "Tech"]);
    });

    it("returns Admin + SponsorsPartners for sponsors-partners", () => {
      expect(rolesForArea("sponsors-partners")).toEqual(["Admin", "SponsorsPartners"]);
    });

    it("returns Admin + Govs for a Govs-scoped area", () => {
      expect(rolesForArea("events")).toEqual(["Admin", "Govs"]);
    });

    it("returns all three scoped roles plus Admin for the shared contact-messages area", () => {
      expect(rolesForArea("contact-messages")).toEqual(
        expect.arrayContaining(["Admin", "Tech", "SponsorsPartners", "Govs"])
      );
      expect(rolesForArea("contact-messages")).toHaveLength(4);
    });

    it("stays consistent with ADMIN_ROLES (every returned role is a real admin role)", () => {
      for (const area of ["dashboard", "landing", "inventory", "sponsors-partners"] as const) {
        for (const role of rolesForArea(area)) {
          expect(ADMIN_ROLES).toContain(role);
        }
      }
    });
  });

  describe("getDefaultAdminPath", () => {
    it("sends each admin-capable role to a page it can actually see", () => {
      expect(getDefaultAdminPath("Admin")).toBe("/admin");
      expect(canAccessArea("Tech", getAdminAreaForPath(getDefaultAdminPath("Tech")))).toBe(true);
      expect(
        canAccessArea("SponsorsPartners", getAdminAreaForPath(getDefaultAdminPath("SponsorsPartners")))
      ).toBe(true);
      expect(canAccessArea("Govs", getAdminAreaForPath(getDefaultAdminPath("Govs")))).toBe(true);
    });

    it("sends non-admin roles to /404", () => {
      expect(getDefaultAdminPath("Organization")).toBe("/404");
      expect(getDefaultAdminPath(null)).toBe("/404");
    });
  });
});
