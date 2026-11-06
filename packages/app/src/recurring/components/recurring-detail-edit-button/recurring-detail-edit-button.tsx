import { Trans, useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { Text, useWindowDimensions } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { TRANSACTION_INFO_BAR_BUTTON_MAX_FONT_SCALE } from '../../../transaction/constant/transaction-info-bar-button-max-font-scale.constant';
import { RecurringDetailSelector } from '../recurring-detail-content/recurring-detail.selector';

interface Props {
    readonly seriesId: number;
}

const MIN_HIT_SIZE = 44;

export const RecurringDetailEditButton = ({ seriesId }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const { fontScale } = useWindowDimensions();
    const hitSize = MIN_HIT_SIZE * Math.min(fontScale, TRANSACTION_INFO_BAR_BUTTON_MAX_FONT_SCALE);
    const hitAreaStyle = { minHeight: hitSize, minWidth: hitSize };

    const handleEdit = () => void router.push({ pathname: '/recurring/[id]/edit', params: { id: String(seriesId) } });

    return (
        <HapticPressable
            accessibilityRole="button"
            accessibilityLabel={t`Edit recurring payment`}
            className="items-end justify-center active:scale-100 active:opacity-70"
            style={hitAreaStyle}
            onPress={handleEdit}
            testID={RecurringDetailSelector.EditButton}
        >
            <Text
                maxFontSizeMultiplier={TRANSACTION_INFO_BAR_BUTTON_MAX_FONT_SCALE}
                className="text-[17px] font-medium text-default-foreground"
            >
                <Trans>Edit</Trans>
            </Text>
        </HapticPressable>
    );
};
