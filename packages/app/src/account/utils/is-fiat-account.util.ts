import { AccountAssociationEnum, InstrumentTypeEnum } from '@budgie/contracts';

import type { AccountWithInstrumentEntityInterface } from '@budgie/contracts';

export const isFiatAccount = (account: Pick<AccountWithInstrumentEntityInterface, AccountAssociationEnum.INSTRUMENT>): boolean =>
    account.instrument.type === InstrumentTypeEnum.FIAT;
