import { AccountTypeEnum } from '@budgie/contracts';

export const P2P_FIAT_BANK_ACCOUNT_TYPE_SQL = [AccountTypeEnum.BANK, AccountTypeEnum.BANK_SYNC, AccountTypeEnum.SAVINGS]
    .map(accountType => `'${accountType}'`)
    .join(',');
