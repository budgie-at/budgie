import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';

export const TRANSACTION_ICON: Record<TransactionTypeEnum, UserIconNameEnum> = {
    [TransactionTypeEnum.TRANSFER]: UserIconNameEnum.ArrowRightLeft,
    [TransactionTypeEnum.INCOME]: UserIconNameEnum.TrendingUp,
    [TransactionTypeEnum.DEBT]: UserIconNameEnum.CreditCard,
    [TransactionTypeEnum.EXPENSE]: UserIconNameEnum.TrendingDown,
    [TransactionTypeEnum.ADJUSTMENT]: UserIconNameEnum.BadgePlus
};
