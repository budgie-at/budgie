import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxPileBar } from '../categorize-inbox-pile-bar/categorize-inbox-pile-bar';
import { CategorizeInboxPileLegend } from '../categorize-inbox-pile-legend/categorize-inbox-pile-legend';

export const CategorizeInboxHero = () => {
    const { t } = useLingui();
    const protectAmount = useProtectedAmountLabel();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const { items, remainingCount } = useCategorizeInboxContext();

    const baseAmounts = items.flatMap(item => ('rows' in item ? [] : [item.totalBaseAmount])).filter(isDefined);
    const worthText = protectAmount(
        convertFromMicroUnits(baseAmounts.reduce((total, amount) => total + amount, 0)),
        defaultInstrument.symbol
    );
    const subtitle = isNotEmptyArray(baseAmounts) ? t`to sort, worth ${worthText}` : t`to sort`;

    return (
        <View className="gap-y-xl pb-5xl pt-xl">
            <Text numberOfLines={2}>
                <Text className="text-5xl font-bold text-primary tabular-nums">{remainingCount}</Text>
                <Text className="text-md text-secondary-foreground">{` ${subtitle}`}</Text>
            </Text>

            <View className="gap-y-md">
                <CategorizeInboxPileBar />

                <CategorizeInboxPileLegend />
            </View>
        </View>
    );
};
