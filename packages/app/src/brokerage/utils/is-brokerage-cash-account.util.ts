import { AccountTypeEnum, InstrumentTypeEnum } from '@budgie/contracts';

import type { AccountAssociationEnum, AccountWithInstrumentEntityInterface } from '@budgie/contracts';

export const isBrokerageCashAccount = (
    account: Pick<AccountWithInstrumentEntityInterface, 'type' | AccountAssociationEnum.INSTRUMENT>
): boolean => account.type === AccountTypeEnum.STOCKS && account.instrument.type === InstrumentTypeEnum.FIAT;
