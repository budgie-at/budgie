import { RulePrefillConditionInterface } from './rule-prefill-condition.interface';

export interface RulePrefillDataInterface {
    readonly conditions: RulePrefillConditionInterface[];
    readonly categoryId: number | null;
    readonly tagIds: number[];
}
