import type { CategorizeInboxSectionEnum, CategorizeInboxRowInterface } from '@budgie/categorization';

export interface CategorizeInboxFindingInputInterface {
    readonly rows: readonly Pick<CategorizeInboxRowInterface, 'operatedAt'>[];
    readonly section: CategorizeInboxSectionEnum;
}
