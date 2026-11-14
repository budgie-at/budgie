import { useLingui } from '@lingui/react/macro';
import { useEffect, useEffectEvent } from 'react';
import { AccessibilityInfo, Platform, Text } from 'react-native';

interface Props {
    readonly query: string;
}

const FOOTER_MAX_FONT_SIZE_MULTIPLIER = 1.5;

export const CreateSearchNoMatch = ({ query }: Props) => {
    const { t } = useLingui();
    const message = t`No matches for “${query}”. Open the full list to browse by country.`;

    const announceNoMatch = useEffectEvent(() => {
        if (Platform.OS === 'ios') {
            AccessibilityInfo.announceForAccessibility(message);
        }
    });

    useEffect(() => {
        announceNoMatch();
    }, []);

    return (
        <Text
            className="text-secondary-foreground px-3xl pt-md pb-md text-[13px] leading-[18px]"
            maxFontSizeMultiplier={FOOTER_MAX_FONT_SIZE_MULTIPLIER}
            accessibilityLiveRegion="polite"
        >
            {message}
        </Text>
    );
};
