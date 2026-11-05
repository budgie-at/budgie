import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';

interface Props {
    readonly isLoading: boolean;
}

export const ConvertToTransferHeader = ({ isLoading }: Props) => {
    const { t } = useLingui();
    const accessibilityState = { busy: isLoading };

    return (
        <View accessible accessibilityRole="header" accessibilityLabel={t`Convert to Transfer`} accessibilityState={accessibilityState}>
            <LoadingContent isLoading={isLoading}>
                <Text
                    maxFontSizeMultiplier={2}
                    className="text-primary px-5xl pt-xl pb-lg text-center text-[17px] leading-[22px] font-semibold"
                >
                    <Trans>Convert to Transfer</Trans>
                </Text>
            </LoadingContent>
        </View>
    );
};
