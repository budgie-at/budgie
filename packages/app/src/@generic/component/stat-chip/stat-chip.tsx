import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../constant/footnote-max-font-size-multiplier.constant';
import { Icon } from '../icon/icon';
import { ProtectedText } from '../protected-text/protected-text';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly iconClassName: string;
    readonly value: string;
    readonly label?: string;
    readonly testID?: string;
}

export const StatChip = ({ icon, iconClassName, value, label, testID }: Props) => (
    <View className="min-h-[28px] flex-row items-center gap-x-xs rounded-full bg-grouped-surface-row px-md py-xs" testID={testID}>
        <Icon icon={icon} size={14} className={iconClassName} />
        {isDefined(label) ? (
            <Text maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER} className="text-[13px] text-secondary-foreground">
                {label}
            </Text>
        ) : null}
        <ProtectedText
            maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
            className="text-[13px] font-medium tabular-nums text-primary"
        >
            {value}
        </ProtectedText>
    </View>
);
