import { AccountTypeEnum } from '@budgie/contracts';

import type { CreateAccountTypeTintInterface } from '../interface/create-account-type-tint.interface';

export const CREATE_ACCOUNT_TYPE_TINT: Partial<Record<AccountTypeEnum, CreateAccountTypeTintInterface>> = {
    [AccountTypeEnum.BANK]: { tileClassName: 'bg-[#007AFF]/15 dark:bg-[#0A84FF]/25', glyphClassName: 'text-[#007AFF] dark:text-[#0A84FF]' },
    [AccountTypeEnum.CASH]: { tileClassName: 'bg-[#34C759]/15 dark:bg-[#30D158]/25', glyphClassName: 'text-[#248A3D] dark:text-[#30D158]' },
    [AccountTypeEnum.CRYPTO]: {
        tileClassName: 'bg-[#FF9500]/15 dark:bg-[#FF9F0A]/25',
        glyphClassName: 'text-[#C93400] dark:text-[#FF9F0A]'
    },
    [AccountTypeEnum.STOCKS]: {
        tileClassName: 'bg-[#FF2D55]/15 dark:bg-[#FF375F]/25',
        glyphClassName: 'text-[#D30F45] dark:text-[#FF375F]'
    },
    [AccountTypeEnum.DEBT]: { tileClassName: 'bg-[#FF3B30]/15 dark:bg-[#FF453A]/25', glyphClassName: 'text-[#D70015] dark:text-[#FF453A]' },
    [AccountTypeEnum.DEPOSIT]: {
        tileClassName: 'bg-[#AF52DE]/15 dark:bg-[#BF5AF2]/25',
        glyphClassName: 'text-[#8944AB] dark:text-[#BF5AF2]'
    }
};
