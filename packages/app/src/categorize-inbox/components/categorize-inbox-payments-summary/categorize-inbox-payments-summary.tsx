import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { useCategorizeInboxAmountLabel } from '../../hook/use-categorize-inbox-amount-label.hook';
import { getCategorizeInboxDefaultAmount } from '../../utils/get-categorize-inbox-default-amount.util';
import { CategorizeInboxPaymentsSelectAll } from '../categorize-inbox-payments-select-all/categorize-inbox-payments-select-all';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxPaymentsSummary = ({ cluster }: Props) => {
    const { includedRows } = useCategorizeInboxContext();
    const amountLabel = useCategorizeInboxAmountLabel();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);

    const included = includedRows(cluster);
    const includedCount = included.length;
    const rowCount = cluster.rows.length;
    const total = getCategorizeInboxDefaultAmount(included, defaultInstrument);
    const totalLabel = isDefined(total) ? ` · ${amountLabel(total, defaultInstrument.symbol)}` : '';

    return (
        <View className="flex-row items-center justify-between gap-x-md px-3xl pt-xl">
            <Text className="flex-1 text-secondary-foreground text-[15px] tabular-nums" numberOfLines={1}>
                <Text className="text-primary font-semibold">
                    <Trans>
                        {includedCount} of {rowCount} selected
                    </Trans>
                </Text>
                {totalLabel}
            </Text>
            <CategorizeInboxPaymentsSelectAll cluster={cluster} />
        </View>
    );
};
