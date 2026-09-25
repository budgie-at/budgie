import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useSettingsContext } from '../../../settings/context/settings.context';

import type { CategorizeInboxClusterInterface } from '../../interface/categorize-inbox-cluster.interface';
import type { UserIconNameEnum } from '@budgie/contracts';

interface Props {
    readonly cluster: Pick<CategorizeInboxClusterInterface, 'displayTitle' | 'totalBaseAmount' | 'variantCount'>;
    readonly countText: string;
    readonly icon?: UserIconNameEnum;
}

export const CategorizeInboxClusterSummary = ({ cluster, countText, icon }: Props) => {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();
    const protectAmount = useProtectedAmountLabel();

    const amountText = isDefined(cluster.totalBaseAmount)
        ? protectAmount(convertFromMicroUnits(cluster.totalBaseAmount), defaultInstrument.symbol)
        : '';
    const variantsText =
        cluster.variantCount > 1 ? t({ message: plural(cluster.variantCount, { one: '# variant', other: '# variants' }) }) : '';
    const metaText = [countText, amountText, variantsText].filter(isNotEmptyString).join(' · ');

    return (
        <View className="flex-row items-center gap-x-lg">
            {isDefined(icon) ? <CircleIcon icon={icon} variant="ghost" size={36} iconSize={18} border={false} /> : null}

            <View className="flex-1 gap-y-xxs">
                <Text className="text-primary text-md font-semibold" numberOfLines={1}>
                    {cluster.displayTitle}
                </Text>
                <Text className="text-secondary-foreground text-xs" numberOfLines={1}>
                    {metaText}
                </Text>
            </View>
        </View>
    );
};
