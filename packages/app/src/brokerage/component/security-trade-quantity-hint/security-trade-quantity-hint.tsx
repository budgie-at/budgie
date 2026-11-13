import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { useFormState, useWatch } from 'react-hook-form';
import { AccessibilityInfo, Text } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';
import { BrokerageSelector } from '../../selector/brokerage.selector';

import type { SecurityTradeFormValues } from '../../constant/security-trade-form-schema.constant';

interface Props {
    readonly maxQuantity: number;
}

export const SecurityTradeQuantityHint = ({ maxQuantity }: Props) => {
    const { t } = useLingui();
    const quantity = useWatch<SecurityTradeFormValues, 'quantity'>({ name: 'quantity' });
    const { errors } = useFormState<SecurityTradeFormValues>({ name: 'quantity' });

    const serverError = errors.quantity?.type === 'server' ? (errors.quantity.message ?? '') : '';
    const overHoldingError = t({ message: plural(maxQuantity, { one: 'Only # share held', other: 'Only # shares held' }) });
    const error = quantity > maxQuantity ? overHoldingError : serverError;
    const isError = isNotEmptyString(error);
    const toneClassName = isError ? 'text-destructive-foreground' : 'text-secondary-foreground';
    const label = isError ? error : t({ message: plural(maxQuantity, { one: 'Up to # share', other: 'Up to # shares' }) });

    useEffect(() => {
        if (isNotEmptyString(error)) {
            AccessibilityInfo.announceForAccessibility(error);
        }
    }, [error]);

    return (
        <Text
            className={cn('min-h-[18px] px-3xl pt-md text-[13px] leading-[18px]', toneClassName)}
            accessibilityLiveRegion="polite"
            testID={BrokerageSelector.QuantityHint}
        >
            {label}
        </Text>
    );
};
