import { useLingui } from '@lingui/react/macro';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { EnableBankingBankLogo } from '../enable-banking-bank-logo/enable-banking-bank-logo';

import type { EnableBankingBankInterface } from '@budgie/sync';

interface Props {
    readonly bank: EnableBankingBankInterface;
    readonly onSelect: (bank: EnableBankingBankInterface) => void;
}

export const EnableBankingBankRow = ({ bank, onSelect }: Props) => {
    const { t } = useLingui();
    const { country } = bank;
    const subtitle = bank.isBeta ? t`${country} · Beta` : country;

    const handlePress = () => {
        onSelect(bank);
    };

    return (
        <GroupedListRow
            left={<EnableBankingBankLogo logoUrl={bank.logoUrl} />}
            title={bank.name}
            subtitle={subtitle}
            onPress={handlePress}
        />
    );
};
