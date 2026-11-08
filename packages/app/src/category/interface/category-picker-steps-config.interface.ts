import type { CategoryPickerParamsInterface } from './category-picker-params.interface';

export interface CategoryPickerStepsConfigInterface extends CategoryPickerParamsInterface {
    readonly onSelect: (categoryId: number) => void;
    readonly onBack: () => void;
    readonly onShowCategory: () => void;
    readonly onShowCreate: () => void;
}
