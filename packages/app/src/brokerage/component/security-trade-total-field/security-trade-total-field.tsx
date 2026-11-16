import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';

import { isPositiveNumber } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { DEFAULT_DECIMAL_PLACES } from '../../../i18n/constant/default-decimal-places.constant';
import { useLocaleInfo } from '../../../i18n/hook/use-locale-info.hook';
import { roundHalfExpand } from '../../../market-data/utils/round-half-expand.util';
import { SecurityTradeSideEnum } from '../../enum/security-trade-side.enum';
import { BrokerageSelector } from '../../selector/brokerage.selector';
import { calculateSecurityTradeTotal } from '../../utils/calculate-security-trade-total.util';
import { SecurityTradeNumberField } from '../security-trade-number-field/security-trade-number-field';

import type { SecurityTradeFormValues } from '../../constant/security-trade-form-schema.constant';

interface Props {
    readonly side: SecurityTradeSideEnum;
    readonly currencySymbol: string;
    readonly onChange: () => void;
}

export const SecurityTradeTotalField = ({ side, currencySymbol, onChange }: Props) => {
    const { t } = useLingui();
    const { decimalSeparator } = useLocaleInfo();
    const [quantity, price, fee, total] = useWatch<SecurityTradeFormValues, ['quantity', 'price', 'fee', 'total']>({
        name: ['quantity', 'price', 'fee', 'total']
    });

    const isBuy = side === SecurityTradeSideEnum.BUY;
    const derivedTotal = roundHalfExpand(calculateSecurityTradeTotal({ quantity, price, fee }, isBuy), DEFAULT_DECIMAL_PLACES);
    const isDerivedTotalShown = isPositiveNumber(derivedTotal) && !isPositiveNumber(total);
    const placeholder = isDerivedTotalShown ? String(derivedTotal).replace('.', decimalSeparator) : '0';
    const label = isBuy ? t`Total paid` : t`Total received`;

    return (
        <GroupedListSection>
            <SecurityTradeNumberField
                name="total"
                label={`${label} (${currencySymbol})`}
                icon={UserIconNameEnum.Banknote}
                maxDecimals={DEFAULT_DECIMAL_PLACES}
                placeholder={placeholder}
                testID={BrokerageSelector.TotalInput}
                onChange={onChange}
            />
        </GroupedListSection>
    );
};
