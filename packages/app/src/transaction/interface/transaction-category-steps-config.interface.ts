import type { CategoryPickerParamsInterface } from '../../category/interface/category-picker-params.interface';

export interface TransactionCategoryStepsConfigInterface extends CategoryPickerParamsInterface {
    readonly onSelect: (categoryId: number) => void;
    readonly onBack: () => void;
    readonly onShowCategory: () => void;
    readonly onShowCreate: () => void;
}
