import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { isCategorizeInboxCluster } from '../../type-guard/is-categorize-inbox-cluster.type-guard';
import { getCategorizeInboxDefaultAmount } from '../../utils/get-categorize-inbox-default-amount.util';
import { CategorizeInboxPileBar } from '../categorize-inbox-pile-bar/categorize-inbox-pile-bar';
import { CategorizeInboxPileLegend } from '../categorize-inbox-pile-legend/categorize-inbox-pile-legend';

export const CategorizeInboxHero = () => {
    const { t } = useLingui();
    const protectAmount = useProtectedAmountLabel();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const { items, remainingCount } = useCategorizeInboxContext();

    const worthAmount = getCategorizeInboxDefaultAmount(
        items.filter(isCategorizeInboxCluster).flatMap(cluster => cluster.rows),
        defaultInstrument
    );
    const worthText = isDefined(worthAmount) ? protectAmount(convertFromMicroUnits(worthAmount), defaultInstrument.symbol) : '';
    const countText = t({ message: plural(remainingCount, { one: 'payment to sort', other: 'payments to sort' }) });
    const subtitle = isDefined(worthAmount) ? `${countText} · ${worthText}` : countText;

    return (
        <View className="gap-y-xl pb-lg pt-md">
            <View>
                <Text className="text-5xl font-bold tracking-tight text-primary tabular-nums">{remainingCount}</Text>
                <Text className="text-sm text-secondary-foreground" numberOfLines={1}>
                    {subtitle}
                </Text>
            </View>

            <View className="gap-y-md">
                <CategorizeInboxPileBar />

                <CategorizeInboxPileLegend />
            </View>
        </View>
    );
};
