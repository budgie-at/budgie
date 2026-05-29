import { BANK_FEE_CATEGORY_TITLE } from '@budgie/contracts';

import { categoryRepository } from '../../@generic/drizzle/db/db';

export const resolveBankFeeCategoryId = async (): Promise<number | null> =>
    categoryRepository.getDefaultCategoryIdByTitle(BANK_FEE_CATEGORY_TITLE);
