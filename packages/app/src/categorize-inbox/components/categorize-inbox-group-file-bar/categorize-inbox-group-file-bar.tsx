import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { useCategorizeInboxAmountLabel } from '../../hook/use-categorize-inbox-amount-label.hook';
import { getCategorizeInboxDefaultAmount } from '../../utils/get-categorize-inbox-default-amount.util';
import { CategorizeInboxGroupScreenSelector } from '../categorize-inbox-group-screen/categorize-inbox-group-screen.selector';
import { CategorizeInboxPrimaryBar } from '../categorize-inbox-primary-bar/categorize-inbox-primary-bar';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
    readonly labelId: number;
    readonly labelTitle: string;
}

export const CategorizeInboxGroupFileBar = ({ cluster, labelId, labelTitle }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const amountLabel = useCategorizeInboxAmountLabel();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const { includedRows, assignCluster } = useCategorizeInboxContext();

    const handlePress = (): void => {
        assignCluster(cluster, labelId);
        router.dismissTo('/categorize');
    };

    const included = includedRows(cluster);
    const count = included.length;
    const total = getCategorizeInboxDefaultAmount(included, defaultInstrument);
    const totalLabel = isDefined(total) ? amountLabel(total, defaultInstrument.symbol) : null;
    const label = isDefined(totalLabel) ? t`File ${count} as ${labelTitle} · ${totalLabel}` : t`File ${count} as ${labelTitle}`;

    return <CategorizeInboxPrimaryBar label={label} testID={CategorizeInboxGroupScreenSelector.PrimaryButton} onPress={handlePress} />;
};
