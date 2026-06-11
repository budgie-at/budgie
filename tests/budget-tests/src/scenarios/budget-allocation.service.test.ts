import { budgetAllocationService } from '@budgie/budget';

describe('budgetAllocationService', () => {
    it('includes synthetic other in planned allocation', () => {
        const allocation = budgetAllocationService.computeAllocation({
            overallLimit: 1000,
            otherLimit: 200,
            categoryLimits: [
                { categoryId: 11, limitAmount: 300 },
                { categoryId: 12, limitAmount: 400 }
            ]
        });

        expect(allocation).toEqual({ allocated: 900, remaining: 100, isOverAllocated: false });
    });

    it('detects over-allocation when categories and synthetic other exceed overall limit', () => {
        const allocation = budgetAllocationService.computeAllocation({
            overallLimit: 1000,
            otherLimit: 250,
            categoryLimits: [
                { categoryId: 11, limitAmount: 500 },
                { categoryId: 12, limitAmount: 400 }
            ]
        });

        expect(allocation).toEqual({ allocated: 1150, remaining: -150, isOverAllocated: true });
    });
});
