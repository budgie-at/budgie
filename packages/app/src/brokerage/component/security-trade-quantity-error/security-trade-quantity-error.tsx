import { useEffect } from 'react';
import { AccessibilityInfo, Text } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { BrokerageSelector } from '../../selector/brokerage.selector';

interface Props {
    readonly message: string;
}

export const SecurityTradeQuantityError = ({ message }: Props) => {
    useEffect(() => {
        if (isNotEmptyString(message)) {
            AccessibilityInfo.announceForAccessibility(message);
        }
    }, [message]);

    return (
        <Text
            className="min-h-[18px] px-3xl pt-md text-[13px] leading-[18px] text-destructive-foreground"
            accessibilityLiveRegion="polite"
            testID={BrokerageSelector.QuantityError}
        >
            {message}
        </Text>
    );
};
