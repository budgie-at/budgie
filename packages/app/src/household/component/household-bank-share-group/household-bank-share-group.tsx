import { useLingui } from '@lingui/react/macro';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { getInstitutionAccountTitle } from '../../../account/utils/get-institution-account-title.util';
import { getInstitutionTitle } from '../../../account/utils/get-institution-title.util';
import { HouseholdAccountShareGroupRow } from '../household-account-share-group-row/household-account-share-group-row';

import type { HouseholdAccountShareGroupInterface } from '../../interface/household-account-share-group.interface';

interface Props extends Pick<HouseholdAccountShareGroupInterface, 'groupNumber' | 'accounts'> {
    readonly groupKey: string;
    readonly integration: NonNullable<HouseholdAccountShareGroupInterface['integration']>;
}

export const HouseholdBankShareGroup = ({ groupKey, integration, groupNumber, accounts }: Props) => {
    const { t } = useLingui();

    const title = getInstitutionTitle(t, integration.provider, integration.label, groupNumber);
    const displayAccounts = accounts.map(account => ({
        ...account,
        title: getInstitutionAccountTitle(account.title, integration.provider)
    }));

    return (
        <HouseholdAccountShareGroupRow
            groupKey={groupKey}
            title={title}
            left={<BankLogo bankProvider={integration.provider} bankName={integration.label ?? title} size={36} />}
            accounts={displayAccounts}
        />
    );
};
