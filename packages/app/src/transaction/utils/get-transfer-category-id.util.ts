import { AccountTypeEnum } from '@budgie/contracts';
import { SystemCategoryIdEnum } from '../../category/enum/system-category-id.enum';

export const getTransferCategoryId = (fromType: AccountTypeEnum, toType: AccountTypeEnum): SystemCategoryIdEnum | null => {
    const isSameType = fromType === toType;

    if (isSameType) {
        if (fromType === AccountTypeEnum.CRYPTO) {
            return SystemCategoryIdEnum.CRYPTO_TRANSFER;
        }

        if (fromType === AccountTypeEnum.STOCKS) {
            return SystemCategoryIdEnum.STOCK_TRANSFER;
        }

        return SystemCategoryIdEnum.CURRENCY_TRANSFER;
    }

    if (toType === AccountTypeEnum.CRYPTO) {
        return SystemCategoryIdEnum.CRYPTO_PURCHASE;
    }

    if (toType === AccountTypeEnum.STOCKS) {
        return SystemCategoryIdEnum.STOCK_PURCHASE;
    }

    if (fromType === AccountTypeEnum.CRYPTO) {
        return SystemCategoryIdEnum.CRYPTO_SALE;
    }

    if (fromType === AccountTypeEnum.STOCKS) {
        return SystemCategoryIdEnum.STOCK_SALE;
    }

    return null;
};
