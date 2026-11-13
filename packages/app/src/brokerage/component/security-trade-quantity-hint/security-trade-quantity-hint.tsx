import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { useFormState, useWatch } from 'react-hook-form';
import { AccessibilityInfo, Text } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { BrokerageSelector } from '../../selector/brokerage.selector';

import type { SecurityTradeFormValues } from '../../constant/security-trade-form-schema.constant';

interface Props {
    readonly maxQuantity: number | null;
}

export const SecurityTradeQuantityHint = ({ maxQuantity }: Props) => {
    const { t } = useLingui();
    const quantity = useWatch<SecurityTradeFormValues, 'quantity'>({ name: 'quantity' });
    const { errors } = useFormState<SecurityTradeFormValues>({ name: 'quantity' });

    const serverError = errors.quantity?.type === 'server' ? (errors.quantity.message ?? '') : '';
    const heldQuantity = maxQuantity ?? 0;
    const overHoldingError = t({ message: plural(heldQuantity, { one: 'Only # share held', other: 'Only # shares held' }) });
    const error = isDefined(maxQuantity) && quantity > maxQuantity ? overHoldingError : serverError;

    useEffect(() => {
        if (isNotEmptyString(error)) {
            AccessibilityInfo.announceForAccessibility(error);
        }
    }, [error]);

    return (
        <Text
            className="-mb-[26px] h-[26px] px-3xl pt-[6px] text-[13px] leading-[18px] text-destructive-foreground"
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1}
            accessibilityLiveRegion="polite"
            testID={BrokerageSelector.QuantityHint}
        >
            {error}
        </Text>
    );
};
