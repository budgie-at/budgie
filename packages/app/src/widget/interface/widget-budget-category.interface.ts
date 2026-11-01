import type { StatusToneType } from '../../@generic/type/status-tone.type';

export interface WidgetBudgetCategoryInterface {
    readonly title: string;
    readonly formattedProgress: string;
    readonly ratio: number;
    readonly limitRatio: number | null;
    readonly tone: StatusToneType;
}
