import type { AccountTypeEnum } from '../../account/enum/account-type.enum';
import type { InstrumentTypeEnum } from '../../instrument/enum/instrument-type.enum';

export interface YieldPositionRowInterface {
    readonly id: number;
    readonly title: string;
    readonly type: AccountTypeEnum;
    readonly isActive: boolean;
    readonly deletedAt: Date | null;
    readonly interestRate: number | null;
    readonly deadline: Date | null;
    readonly instrumentId: number;
    readonly instrumentCode: string;
    readonly instrumentSymbol: string;
    readonly instrumentType: InstrumentTypeEnum;
}
