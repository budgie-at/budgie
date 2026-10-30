import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { useCategorizeInboxIncludedTotal } from '../../hook/use-categorize-inbox-included-total.hook';
import { CategorizeInboxPaymentsScreenSelector } from '../categorize-inbox-payments-screen/categorize-inbox-payments-screen.selector';
import { CategorizeInboxPrimaryBar } from '../categorize-inbox-primary-bar/categorize-inbox-primary-bar';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxPaymentsBar = ({ cluster }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const { count, totalLabel } = useCategorizeInboxIncludedTotal(cluster);

    const handleDone = (): void => void router.back();

    const paymentsLabel = t({ message: plural(count, { one: 'Use # payment', other: 'Use # payments' }) });
    const label = isDefined(totalLabel) ? `${paymentsLabel} · ${totalLabel}` : paymentsLabel;

    return <CategorizeInboxPrimaryBar label={label} testID={CategorizeInboxPaymentsScreenSelector.DoneButton} onPress={handleDone} />;
};
