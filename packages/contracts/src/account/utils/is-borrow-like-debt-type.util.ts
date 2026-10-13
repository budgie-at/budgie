import { AccountDebtTypeEnum } from '../enum/account-debt-type.enum';

export const isBorrowLikeDebtType = (debtType: AccountDebtTypeEnum): boolean => debtType !== AccountDebtTypeEnum.LENT;
