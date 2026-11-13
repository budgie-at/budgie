import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { useFormState, useWatch } from 'react-hook-form';
import { AccessibilityInfo, Text } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';
import { BrokerageSelector } from '../../selector/brokerage.selector';

import type { SecurityTradeFormValues } from '../../constant/security-trade-form-schema.constant';

interface Props {
    readonly maxQuantity: number | null;
    readonly symbol: string;
}

export const SecurityTradeQuantityHint = ({ maxQuantity, symbol }: Props) => {
    const { t } = useLingui();
    const quantity = useWatch<SecurityTradeFormValues, 'quantity'>({ name: 'quantity' });
    const { errors } = useFormState<SecurityTradeFormValues>({ name: 'quantity' });

    const serverError = errors.quantity?.type === 'server' ? (errors.quantity.message ?? '') : '';
    const heldQuantity = maxQuantity ?? 0;
    const overHoldingError = t({ message: plural(heldQuantity, { one: 'Only # share held', other: 'Only # shares held' }) });
    const error = isDefined(maxQuantity) && quantity > maxQuantity ? overHoldingError : serverError;
    const isError = isNotEmptyString(error);
    const toneClassName = isError ? 'text-destructive-foreground' : 'text-secondary-foreground';
    const heldLabel = isDefined(maxQuantity) ? t`You hold ${heldQuantity} ${symbol}` : '';
    const label = isError ? error : heldLabel;

    useEffect(() => {
        if (isNotEmptyString(error)) {
            AccessibilityInfo.announceForAccessibility(error);
        }
    }, [error]);

    return (
        <Text
            className={cn('-mb-[26px] h-[26px] px-3xl pt-md text-[13px] leading-[18px]', toneClassName)}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1}
            accessibilityLiveRegion="polite"
            testID={BrokerageSelector.QuantityHint}
        >
            {label}
        </Text>
    );
};
