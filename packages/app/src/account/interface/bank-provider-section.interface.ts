import { AccountWithBankSyncEntityInterface, BankSyncStatusEnum, ExternalSourceEnum } from '@budgie/contracts';

interface AccountRowInterface {
    readonly left: AccountWithBankSyncEntityInterface;
    readonly right?: AccountWithBankSyncEntityInterface;
}

interface BankProviderSectionInterface {
    readonly kind: 'bankProvider';
    readonly provider: ExternalSourceEnum;
    readonly data: AccountRowInterface[];
}

export interface BankProviderSectionWithStatusInterface extends BankProviderSectionInterface {
    readonly syncStatus: BankSyncStatusEnum;
}
