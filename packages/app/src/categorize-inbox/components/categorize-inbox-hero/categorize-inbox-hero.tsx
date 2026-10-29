import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
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
    const subtitle = isDefined(worthAmount) ? t`to sort, worth ${worthText}` : t`to sort`;

    return (
        <View className="gap-y-xl pb-5xl pt-xl">
            <Text numberOfLines={2}>
                <Text className="text-6xl font-bold tracking-tight text-primary tabular-nums">{remainingCount}</Text>
                <Text className="text-md text-secondary-foreground">{` ${subtitle}`}</Text>
            </Text>

            <View className="gap-y-md">
                <CategorizeInboxPileBar />

                <CategorizeInboxPileLegend />
            </View>
        </View>
    );
};
