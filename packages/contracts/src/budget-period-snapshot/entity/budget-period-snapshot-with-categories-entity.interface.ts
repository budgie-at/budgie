import type { BudgetPeriodCategorySnapshotEntityInterface } from '../../budget-period-category-snapshot/entity/budget-period-category-snapshot-entity.interface';
import type { BudgetPeriodSnapshotEntityInterface } from './budget-period-snapshot-entity.interface';

export interface BudgetPeriodSnapshotWithCategoriesEntityInterface extends BudgetPeriodSnapshotEntityInterface {
    readonly categories: readonly BudgetPeriodCategorySnapshotEntityInterface[];
}
