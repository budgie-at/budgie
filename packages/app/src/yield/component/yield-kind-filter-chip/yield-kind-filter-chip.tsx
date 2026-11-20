import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { testID } from '../../../@generic/utils/test-id.util';
import { YIELD_GROUP_LABEL } from '../../constant/yield-group-label.constant';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

import type { YieldGroupEnum } from '@budgie/market';

interface Props {
    readonly group: YieldGroupEnum;
}

const continuousBorder = { borderCurve: 'continuous' as const };

export const YieldKindFilterChip = ({ group }: Props) => {
    const { t } = useLingui();

    const label = t(YIELD_GROUP_LABEL[group]);
    const accessibilityLabel = t`Remove ${label} filter`;

    const handleClear = () => void router.setParams({ group: '' });

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            onPress={handleClear}
            className="min-h-[44px] flex-row items-center self-start"
            {...testID(PassiveIncomeSelector.ClearFilter, 'kind')}
        >
            <View
                className="flex-row items-center gap-x-xs rounded-full border border-secondary-corner bg-secondary-background px-sm py-xs"
                style={continuousBorder}
            >
                <Text className="text-xs font-semibold text-primary" maxFontSizeMultiplier={2}>
                    {label}
                </Text>
                <Icon icon={UserIconNameEnum.X} size={12} className="text-secondary-foreground" />
            </View>
        </Pressable>
    );
};
