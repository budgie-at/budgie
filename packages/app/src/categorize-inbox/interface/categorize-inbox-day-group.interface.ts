import type { CategorizeInboxRowInterface } from '@budgie/categorization';

export interface CategorizeInboxDayGroupInterface {
    readonly day: Date;
    readonly rows: CategorizeInboxRowInterface[];
}
