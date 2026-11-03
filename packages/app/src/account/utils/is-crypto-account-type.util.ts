import { AccountTypeEnum } from '@budgie/contracts';

export const isCryptoAccountType = (type: AccountTypeEnum): boolean =>
    type === AccountTypeEnum.CRYPTO || type === AccountTypeEnum.CRYPTO_SYNC;
