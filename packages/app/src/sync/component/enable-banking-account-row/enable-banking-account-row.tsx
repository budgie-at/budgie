import { useLingui } from '@lingui/react/macro';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { GroupedListSwitchRow } from '../../../@generic/component/grouped-list-switch-row/grouped-list-switch-row';
import { getAccountIdentityLabel } from '../../utils/get-account-identity-label.util';

import type { SyncAccountPreviewInterface } from '@budgie/sync';

interface Props {
    readonly preview: Pick<SyncAccountPreviewInterface, 'externalId' | 'title' | 'currencyCode' | 'iban' | 'hasSync'>;
    readonly bankName: string | undefined;
    readonly isSelected: boolean;
    readonly onToggle: (externalId: string) => void;
}

export const EnableBankingAccountRow = ({ preview, bankName, isSelected, onToggle }: Props) => {
    const { t } = useLingui();

    const subtitle = preview.hasSync ? t`Already syncing` : getAccountIdentityLabel(preview.currencyCode, preview.iban);
    const handleChange = () => {
        onToggle(preview.externalId);
    };

    return (
        <GroupedListSwitchRow
            left={<BankLogo bankName={bankName} size={36} />}
            title={preview.title}
            subtitle={subtitle}
            value={isSelected}
            switchTestID={preview.externalId}
            onChange={handleChange}
        />
    );
};
