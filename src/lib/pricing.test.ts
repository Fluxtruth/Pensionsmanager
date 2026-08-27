import { describe, it, expect } from "vitest";
import { calculatePlanInfo, PRICING_PLANS, CUSTOMER_TYPES, ADDON_MODULES } from "./pricing";

describe("Pricing helper logic", () => {
    it("classifies 0-5 rooms as Plan S", () => {
        const plan0 = calculatePlanInfo(0);
        expect(plan0.plan.id).toBe("S");
        expect(plan0.roomsLimit).toBe(5);
        expect(plan0.roomsRemainingInTier).toBe(5);
        expect(plan0.nextPlan?.id).toBe("M");

        const plan3 = calculatePlanInfo(3);
        expect(plan3.plan.id).toBe("S");
        expect(plan3.roomsRemainingInTier).toBe(2);

        const plan5 = calculatePlanInfo(5);
        expect(plan5.plan.id).toBe("S");
        expect(plan5.roomsRemainingInTier).toBe(0);
        expect(plan5.progressPercentage).toBe(100);
    });

    it("classifies 6-15 rooms as Plan M", () => {
        const plan6 = calculatePlanInfo(6);
        expect(plan6.plan.id).toBe("M");
        expect(plan6.roomsLimit).toBe(15);
        expect(plan6.roomsRemainingInTier).toBe(9);
        expect(plan6.nextPlan?.id).toBe("L");

        const plan15 = calculatePlanInfo(15);
        expect(plan15.plan.id).toBe("M");
        expect(plan15.roomsRemainingInTier).toBe(0);
        expect(plan15.progressPercentage).toBe(100);
    });

    it("classifies 16+ rooms as Plan L", () => {
        const plan16 = calculatePlanInfo(16);
        expect(plan16.plan.id).toBe("L");
        expect(plan16.roomsLimit).toBeNull();
        expect(plan16.nextPlan).toBeNull();

        const plan50 = calculatePlanInfo(50);
        expect(plan50.plan.id).toBe("L");
    });

    it("has all required addon modules in locked status", () => {
        expect(ADDON_MODULES).toHaveLength(3);
        const moduleIds = ADDON_MODULES.map(m => m.id);
        expect(moduleIds).toContain("booking-com");
        expect(moduleIds).toContain("ai-assistant");
        expect(moduleIds).toContain("ai-reception");

        ADDON_MODULES.forEach(m => {
            expect(m.status).toBe("locked");
        });
    });

    it("defines the 4 customer types", () => {
        expect(CUSTOMER_TYPES.none.label).toBe("Kein Kunde");
        expect(CUSTOMER_TYPES.test.label).toBe("Testkunde");
        expect(CUSTOMER_TYPES.subscriber.label).toBe("Abonnent");
        expect(CUSTOMER_TYPES.enterprise.label).toBe("Enterprise-Kunde");
    });
});
