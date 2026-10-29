import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxComposition } from '../categorize-inbox-composition/categorize-inbox-composition';

import type { CategorizeInboxListItemType } from '@budgie/categorization';

interface Props {
    readonly items: CategorizeInboxListItemType[];
}

export const CategorizeInboxHero = ({ items }: Props) => {
    const protectAmount = useProtectedAmountLabel();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const { remainingCount } = useCategorizeInboxContext();

    const headers = items.flatMap(item => ('rows' in item ? [] : [item]));
    const totalBaseAmount = headers.reduce((total, header) => total + (header.totalBaseAmount ?? 0), 0);
    const amountText = protectAmount(convertFromMicroUnits(totalBaseAmount), defaultInstrument.symbol);

    return (
        <View className="gap-y-4xl pb-5xl pt-xl">
            <View className="gap-y-xs">
                <Text className="text-primary text-7xl font-semibold tabular-nums" numberOfLines={1} adjustsFontSizeToFit>
                    {remainingCount}
                </Text>
                <Text className="text-secondary-foreground text-sm" numberOfLines={1}>
                    <Trans>to sort</Trans>
                    {` · ${amountText}`}
                </Text>
            </View>

            <CategorizeInboxComposition headers={headers} />
        </View>
    );
};
