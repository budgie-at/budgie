import { CRYPTO_ACCOUNT_TYPES } from '../../account/constant/crypto-account-types.constant';
import { AccountTypeEnum } from '../../account/enum/account-type.enum';

export const YIELD_POSITION_ACCOUNT_TYPES: readonly AccountTypeEnum[] = [
    AccountTypeEnum.DEPOSIT,
    AccountTypeEnum.SAVINGS,
    ...CRYPTO_ACCOUNT_TYPES,
    AccountTypeEnum.STOCKS
];
