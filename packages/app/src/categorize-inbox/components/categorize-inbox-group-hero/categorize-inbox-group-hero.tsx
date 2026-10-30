import { useAtomValue } from '@effect/atom-react/Hooks';
import { Plural } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useCategorizeInboxAmountLabel } from '../../hook/use-categorize-inbox-amount-label.hook';
import { getCategorizeInboxClusterTotal } from '../../utils/get-categorize-inbox-cluster-total.util';
import { CategorizeInboxGroupFinding } from '../categorize-inbox-group-finding/categorize-inbox-group-finding';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxGroupHero = ({ cluster }: Props) => {
    const protectAmount = useCategorizeInboxAmountLabel();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);

    const { amount, symbol, sign } = getCategorizeInboxClusterTotal(cluster, defaultInstrument.symbol);

    return (
        <View className="items-center gap-y-sm px-3xl pb-xs pt-md">
            <Text
                className="text-primary text-[40px] leading-[48px] font-semibold tracking-[-1px] tabular-nums"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
            >
                {`${sign}${protectAmount(amount, symbol)}`}
            </Text>
            <Text className="text-secondary-foreground text-center text-[15px] leading-[20px]" numberOfLines={1}>
                <Plural value={cluster.rows.length} one="# payment" other="# payments" />
                {' · '}
                <CategorizeInboxGroupFinding cluster={cluster} />
            </Text>
        </View>
    );
};
