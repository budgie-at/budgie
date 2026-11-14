import { useLingui } from '@lingui/react/macro';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { SyncAccountsStep } from '../sync-accounts-step/sync-accounts-step';
import { SyncParkedAccountsSection } from '../sync-parked-accounts-section/sync-parked-accounts-section';

import type { AccountSelectionInterface } from '../../interface/account-selection.interface';
import type { EnableBankingAuthorizationInterface } from '../../interface/enable-banking-authorization.interface';

interface Props {
    readonly accountSelection: AccountSelectionInterface;
    readonly authorization: Pick<EnableBankingAuthorizationInterface, 'bankName' | 'previews'> | null;
}

export const EnableBankingAccountsStep = ({ accountSelection, authorization }: Props) => {
    const { t } = useLingui();
    const missingAccount = t`Missing an account? Link it to your application in Enable Banking, then connect this bank again.`;
    const parkedPreviews = authorization?.previews.filter(preview => preview.isParked) ?? [];

    return (
        <>
            <SyncAccountsStep
                {...accountSelection}
                logo={<BankLogo bankName={authorization?.bankName} size={36} />}
                footer={`${t`Balances and history come from your bank through Enable Banking.`} ${missingAccount}`}
                emptyDescription={missingAccount}
            />
            <SyncParkedAccountsSection
                previews={parkedPreviews}
                footer={t`These accounts already exist in Budgie or use a currency Budgie does not support. To continue an existing account, open it and tap Connect to bank.`}
            />
        </>
    );
};
