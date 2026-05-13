import { MccCategoryEntityInterface } from '@budgie/contracts';

export const formatMccDisplay = (mcc: Pick<MccCategoryEntityInterface, 'mcc' | 'shortDescription'>) =>
    `${mcc.mcc} - ${mcc.shortDescription}`;
