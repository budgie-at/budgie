import type { CategorizeInboxRowInterface } from '@budgie/categorization';

export interface CategorizeInboxMonthGroupInterface {
    readonly month: Date;
    readonly rows: CategorizeInboxRowInterface[];
}
