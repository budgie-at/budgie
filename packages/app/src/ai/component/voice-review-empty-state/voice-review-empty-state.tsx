import { Trans } from '@lingui/react/macro';
import { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { MAX_CHROME_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-chrome-font-size-multiplier.constant';

interface Props {
    readonly children: ReactNode;
}

const CONTENT_CONTAINER_STYLE = { flexGrow: 1 };

export const VoiceReviewEmptyState = ({ children }: Props) => (
    <>
        <Text
            maxFontSizeMultiplier={MAX_CHROME_FONT_SIZE_MULTIPLIER}
            className="px-xl pt-3xl pb-md text-xl leading-[24px] font-semibold text-primary text-center"
        >
            <Trans>No items to save</Trans>
        </Text>
        <ScrollView className="flex-1" contentContainerStyle={CONTENT_CONTAINER_STYLE}>
            <View className="grow justify-center px-3xl py-xl">
                <Text maxFontSizeMultiplier={MAX_CHROME_FONT_SIZE_MULTIPLIER} className="text-md text-secondary-foreground text-center">
                    <Trans>Tap re-record to try again</Trans>
                </Text>
                {children}
            </View>
        </ScrollView>
    </>
);
