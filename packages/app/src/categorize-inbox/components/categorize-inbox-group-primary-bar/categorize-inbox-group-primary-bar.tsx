import { CASH_WITHDRAWAL_TRACKED_CATEGORY_ID } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { isDefined, isNumber } from '@rnw-community/shared';

import { useCategorizeInboxGroupChoiceContext } from '../../context/categorize-inbox-group-choice.context';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxGroupChoiceEnum } from '../../enum/categorize-inbox-group-choice.enum';
import { useCategorizeInboxGroupOptions } from '../../hook/use-categorize-inbox-group-options.hook';
import { useCategorizeInboxIncludedTotal } from '../../hook/use-categorize-inbox-included-total.hook';
import { CategorizeInboxGroupScreenSelector } from '../categorize-inbox-group-screen/categorize-inbox-group-screen.selector';
import { CategorizeInboxPrimaryBar } from '../categorize-inbox-primary-bar/categorize-inbox-primary-bar';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';
import type { AccountEntityInterface } from '@budgie/contracts';
import type { ReactNode } from 'react';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxGroupPrimaryBar = ({ cluster }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const { strategy, moveToCash, assignCluster, transferCluster } = useCategorizeInboxContext();
    const { choice } = useCategorizeInboxGroupChoiceContext();
    const { learnedAccount, matchedAccount, cashTransactionIds } = useCategorizeInboxGroupOptions(cluster);
    const { count, totalLabel } = useCategorizeInboxIncludedTotal(cluster);

    const renderBar = (label: string, commit: () => void): ReactNode => {
        const handlePress = (): void => {
            commit();
            router.dismissTo('/categorize');
        };

        return <CategorizeInboxPrimaryBar label={label} testID={CategorizeInboxGroupScreenSelector.PrimaryButton} onPress={handlePress} />;
    };
    const withTotal = (label: string): string => (isDefined(totalLabel) ? `${label} · ${totalLabel}` : label);
    const renderFileBar = (labelId: number, labelTitle: string | undefined): ReactNode =>
        isDefined(labelTitle) ? renderBar(withTotal(t`File ${count} as ${labelTitle}`), () => void assignCluster(cluster, labelId)) : null;
    const renderTransferBar = ({ id, title }: Pick<AccountEntityInterface, 'id' | 'title'>): ReactNode =>
        renderBar(withTotal(t`Move ${count} to ${title}`), () => void transferCluster(cluster, id, title, true));

    const cashCount = cashTransactionIds.length;
    const bars: Record<CategorizeInboxGroupChoiceEnum, ReactNode> = {
        [CategorizeInboxGroupChoiceEnum.TRANSFER]: isDefined(matchedAccount) ? renderTransferBar(matchedAccount) : null,
        [CategorizeInboxGroupChoiceEnum.LEARNED_TRANSFER]: isDefined(learnedAccount) ? renderTransferBar(learnedAccount) : null,
        [CategorizeInboxGroupChoiceEnum.MOVE_TO_CASH]: renderBar(t`Move ${cashCount} to cash`, () => void moveToCash(cashTransactionIds)),
        [CategorizeInboxGroupChoiceEnum.ALREADY_TRACKED]: renderFileBar(CASH_WITHDRAWAL_TRACKED_CATEGORY_ID, t`Already tracked`)
    };

    if (isNumber(choice)) {
        return renderFileBar(choice, strategy?.labelsById.get(choice)?.title);
    }

    return isDefined(choice) ? bars[choice] : null;
};
