import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { ENABLE_BANKING_COUNTRY_NAME } from '../../constant/enable-banking-country-name.constant';

import { EnableBankingBankRowSelector } from './enable-banking-bank-row.selector';

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
    const countryName = ENABLE_BANKING_COUNTRY_NAME[countryCode];
    const countryLabel = isDefined(countryName) ? t(countryName) : countryCode;
    const country = COUNTRY_CODE_PATTERN.test(countryCode) ? `${flag} ${countryLabel}` : bank.country;
    const subtitle = bank.isBeta ? t`${country} · Beta` : country;

    const handlePress = () => {
        onSelect(bank);
    };

    return (
        <GroupedListRow
            left={<BankLogo bankName={bank.name} size={36} />}
            title={bank.name}
            subtitle={subtitle}
            onPress={handlePress}
            testID={EnableBankingBankRowSelector.Row(bank.name)}
        />
    );
};
