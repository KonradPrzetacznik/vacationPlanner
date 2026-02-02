import { describe, it, expect } from "vitest";
import { hasAccessToPath, getAccessibleRoutes, getNavItemsForRole, type Role } from "../../../src/lib/permissions";

describe("permissions - hasAccessToPath", () => {
  describe("ADMINISTRATOR role", () => {
    const role: Role = "ADMINISTRATOR";

    it("should have access to /admin/users", () => {
      expect(hasAccessToPath("/admin/users", role)).toBe(true);
    });

    it("should NOT have access to /admin/settings (HR only)", () => {
      expect(hasAccessToPath("/admin/settings", role)).toBe(false);
    });

    it("should NOT have access to /teams (HR only)", () => {
      expect(hasAccessToPath("/teams", role)).toBe(false);
    });

    it("should NOT have access to /requests (HR and EMPLOYEE)", () => {
      expect(hasAccessToPath("/requests", role)).toBe(false);
    });

    it("should NOT have access to /calendar (HR and EMPLOYEE)", () => {
      expect(hasAccessToPath("/calendar", role)).toBe(false);
    });

    it("should have access to homepage /", () => {
      expect(hasAccessToPath("/", role)).toBe(true);
    });
  });

  describe("HR role", () => {
    const role: Role = "HR";

    it("should NOT have access to /admin/users (ADMINISTRATOR only)", () => {
      expect(hasAccessToPath("/admin/users", role)).toBe(false);
    });

    it("should have access to /admin/settings", () => {
      expect(hasAccessToPath("/admin/settings", role)).toBe(true);
    });

    it("should have access to /teams", () => {
      expect(hasAccessToPath("/teams", role)).toBe(true);
    });

    it("should have access to /requests", () => {
      expect(hasAccessToPath("/requests", role)).toBe(true);
    });

    it("should have access to /requests/new", () => {
      expect(hasAccessToPath("/requests/new", role)).toBe(true);
    });

    it("should have access to /calendar", () => {
      expect(hasAccessToPath("/calendar", role)).toBe(true);
    });

    it("should have access to homepage /", () => {
      expect(hasAccessToPath("/", role)).toBe(true);
    });
  });

  describe("EMPLOYEE role", () => {
    const role: Role = "EMPLOYEE";

    it("should NOT have access to /admin/users", () => {
      expect(hasAccessToPath("/admin/users", role)).toBe(false);
    });

    it("should NOT have access to /admin/settings", () => {
      expect(hasAccessToPath("/admin/settings", role)).toBe(false);
    });

    it("should NOT have access to /teams", () => {
      expect(hasAccessToPath("/teams", role)).toBe(false);
    });

    it("should have access to /requests", () => {
      expect(hasAccessToPath("/requests", role)).toBe(true);
    });

    it("should have access to /requests/new", () => {
      expect(hasAccessToPath("/requests/new", role)).toBe(true);
    });

    it("should NOT have access to /calendar", () => {
      expect(hasAccessToPath("/calendar", role)).toBe(false);
    });

    it("should have access to homepage /", () => {
      expect(hasAccessToPath("/", role)).toBe(true);
    });
  });

  describe("subpaths", () => {
    it("should check access for subpaths correctly", () => {
      expect(hasAccessToPath("/admin/users/123", "ADMINISTRATOR")).toBe(true);
      expect(hasAccessToPath("/admin/users/edit/456", "ADMINISTRATOR")).toBe(true);
      expect(hasAccessToPath("/admin/users/123", "HR")).toBe(false);
      expect(hasAccessToPath("/teams/789/members", "HR")).toBe(true);
      expect(hasAccessToPath("/teams/789/members", "EMPLOYEE")).toBe(false);
    });
  });
});

describe("permissions - getAccessibleRoutes", () => {
  it("should return correct routes for ADMINISTRATOR", () => {
    const routes = getAccessibleRoutes("ADMINISTRATOR");
    expect(routes).toContain("/admin/users");
    expect(routes).not.toContain("/admin/settings");
    expect(routes).not.toContain("/teams");
    expect(routes).not.toContain("/requests");
    expect(routes).not.toContain("/calendar");
  });

  it("should return correct routes for HR", () => {
    const routes = getAccessibleRoutes("HR");
    expect(routes).toContain("/admin/settings");
    expect(routes).toContain("/teams");
    expect(routes).toContain("/requests");
    expect(routes).toContain("/requests/new");
    expect(routes).toContain("/calendar");
    expect(routes).not.toContain("/admin/users");
  });

  it("should return correct routes for EMPLOYEE", () => {
    const routes = getAccessibleRoutes("EMPLOYEE");
    expect(routes).toContain("/requests");
    expect(routes).toContain("/requests/new");
    expect(routes).not.toContain("/calendar");
    expect(routes).not.toContain("/admin/users");
    expect(routes).not.toContain("/admin/settings");
    expect(routes).not.toContain("/teams");
  });
});

describe("permissions - getNavItemsForRole", () => {
  it("should return correct nav items for ADMINISTRATOR", () => {
    const navItems = getNavItemsForRole("ADMINISTRATOR");
    const hrefs = navItems.map((item) => item.href);

    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/admin/users");
    expect(hrefs).not.toContain("/admin/settings");
    expect(hrefs).not.toContain("/teams");
    expect(hrefs).not.toContain("/requests");
    expect(hrefs).not.toContain("/calendar");
  });

  it("should return correct nav items for HR", () => {
    const navItems = getNavItemsForRole("HR");
    const hrefs = navItems.map((item) => item.href);

    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/requests");
    expect(hrefs).toContain("/requests/new");
    expect(hrefs).toContain("/calendar");
    expect(hrefs).toContain("/teams");
    expect(hrefs).toContain("/admin/settings");
    expect(hrefs).not.toContain("/admin/users");
  });

  it("should return correct nav items for EMPLOYEE", () => {
    const navItems = getNavItemsForRole("EMPLOYEE");
    const hrefs = navItems.map((item) => item.href);

    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/requests");
    expect(hrefs).toContain("/requests/new");
    expect(hrefs).not.toContain("/calendar");
    expect(hrefs).not.toContain("/admin/users");
    expect(hrefs).not.toContain("/admin/settings");
    expect(hrefs).not.toContain("/teams");
  });

  it("should return nav items with correct labels", () => {
    const navItems = getNavItemsForRole("EMPLOYEE");
    const requestsItem = navItems.find((item) => item.href === "/requests");

    expect(requestsItem).toBeDefined();
    expect(requestsItem?.label).toBe("Moje Wnioski");
  });

  it("should return nav items with correct roles", () => {
    const navItems = getNavItemsForRole("HR");
    const teamsItem = navItems.find((item) => item.href === "/teams");

    expect(teamsItem).toBeDefined();
    expect(teamsItem?.roles).toEqual(["HR"]);
  });
});
