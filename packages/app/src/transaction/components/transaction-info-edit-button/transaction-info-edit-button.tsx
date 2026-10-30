import { Trans, useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { Text, useWindowDimensions } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { TRANSACTION_INFO_BAR_BUTTON_MAX_FONT_SCALE } from '../../constant/transaction-info-bar-button-max-font-scale.constant';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';

import type { Href } from 'expo-router';

const MIN_HIT_SIZE = 44;

interface Props {
    readonly editHref: Href | null;
}

export const TransactionInfoEditButton = ({ editHref }: Props) => {
    const router = useRouter();
    const { t } = useLingui();
    const { fontScale } = useWindowDimensions();
    const hitSize = MIN_HIT_SIZE * Math.min(fontScale, TRANSACTION_INFO_BAR_BUTTON_MAX_FONT_SCALE);
    const hitAreaStyle = { minHeight: hitSize, minWidth: hitSize };

    if (!isDefined(editHref)) {
        return null;
    }

    const handleEditPress = () => void router.push(editHref);

    return (
        <HapticPressable
            accessibilityRole="button"
            accessibilityLabel={t`Edit transaction`}
            className="items-end justify-center active:scale-100 active:opacity-70"
            style={hitAreaStyle}
            onPress={handleEditPress}
            testID={TransactionInfoPageSelector.EditButton}
        >
            <Text
                maxFontSizeMultiplier={TRANSACTION_INFO_BAR_BUTTON_MAX_FONT_SCALE}
                className="text-[17px] text-default-foreground font-medium"
                testID={TransactionInfoPageSelector.EditButtonLabel}
            >
                <Trans>Edit</Trans>
            </Text>
        </HapticPressable>
    );
};
