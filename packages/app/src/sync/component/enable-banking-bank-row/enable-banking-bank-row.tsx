import { useLingui } from '@lingui/react/macro';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { EnableBankingBankLogo } from '../enable-banking-bank-logo/enable-banking-bank-logo';

import type { EnableBankingBankInterface } from '@budgie/sync';

interface Props {
    readonly bank: EnableBankingBankInterface;
    readonly onSelect: (bank: EnableBankingBankInterface) => void;
}

const REGIONAL_INDICATOR_OFFSET = 127397;
const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/u;

export const EnableBankingBankRow = ({ bank, onSelect }: Props) => {
    const { t } = useLingui();
    const countryCode = bank.country.toUpperCase();
    const flag = String.fromCodePoint(...Array.from(countryCode, letter => letter.charCodeAt(0) + REGIONAL_INDICATOR_OFFSET));
    const country = COUNTRY_CODE_PATTERN.test(countryCode) ? `${flag} ${countryCode}` : bank.country;
    const subtitle = bank.isBeta ? t`${country} · Beta` : country;

    const handlePress = () => {
        onSelect(bank);
    };

    return <GroupedListRow left={<EnableBankingBankLogo name={bank.name} />} title={bank.name} subtitle={subtitle} onPress={handlePress} />;
};
