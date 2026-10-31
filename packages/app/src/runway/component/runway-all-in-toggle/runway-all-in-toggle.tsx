import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-font-size-multiplier.constant';
import { RunwayCard } from '../runway-card/runway-card';

interface Props {
    readonly isAllIn: boolean;
    readonly onToggle: () => void;
}

export const RunwayAllInToggle = ({ isAllIn, onToggle }: Props) => {
    const { t } = useLingui();

    return (
        <View className="gap-y-sm">
            <RunwayCard className="min-h-[56px] flex-row items-center gap-x-xl py-md pr-xl pl-3xl">
                <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} className="flex-1 text-[15px] text-primary">
                    <Trans>Include one-offs</Trans>
                </Text>

                <ThemedSwitch accessibilityLabel={t`Include one-offs`} value={isAllIn} onValueChange={onToggle} />
            </RunwayCard>

            <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} className="px-3xl text-xs text-secondary-foreground">
                <Trans>Spreads irregular costs like insurance across the months.</Trans>
            </Text>
        </View>
    );
};
