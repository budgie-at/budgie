import type { AccountAssociationEnum, AccountWithInstrumentEntityInterface } from '@budgie/contracts';

export interface AccountHeroValueInterface {
    readonly balance: number;
    readonly account: Pick<AccountWithInstrumentEntityInterface, 'type' | AccountAssociationEnum.INSTRUMENT>;
}
