import { useLingui } from '@lingui/react/macro';
import { useFormState, useWatch } from 'react-hook-form';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { PillButtonFooter } from '../../../@generic/component/pill-button-footer/pill-button-footer';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { SecurityTradeSideEnum } from '../../enum/security-trade-side.enum';
import { BrokerageSelector } from '../../selector/brokerage.selector';

import type { SecurityTradeFormValues } from '../../constant/security-trade-form-schema.constant';

interface Props {
    readonly side: SecurityTradeSideEnum;
    readonly currencySymbol: string;
    readonly maxQuantity: number | null;
    readonly isReady: boolean;
    readonly isLoading: boolean;
    readonly onPress: () => void;
}

export const SecurityTradeSaveFooter = ({ side, currencySymbol, maxQuantity, isReady, isLoading, onPress }: Props) => {
    const { t } = useLingui();
    const [quantity, price, fee] = useWatch<SecurityTradeFormValues, ['quantity', 'price', 'fee']>({ name: ['quantity', 'price', 'fee'] });
    const { isValid } = useFormState<SecurityTradeFormValues>();
    const protectAmount = useProtectedAmountLabel();

    const isBuy = side === SecurityTradeSideEnum.BUY;
    const action = isBuy ? t`Buy` : t`Sell`;
    const total = quantity * price + (isBuy ? fee : -fee);
    const isTotalShown = isPositiveNumber(quantity) && isPositiveNumber(price) && isPositiveNumber(total);
    const isOverHolding = isDefined(maxQuantity) && quantity > maxQuantity;
    const isDisabled = !isReady || !isValid || isOverHolding;
    const label = isTotalShown && !isOverHolding ? `${action} · ${protectAmount(total, currencySymbol)}` : action;

    return (
        <PillButtonFooter
            label={label}
            onPress={onPress}
            isLoading={isLoading}
            isDisabled={isDisabled}
            testID={BrokerageSelector.SaveButton}
        />
    );
};
