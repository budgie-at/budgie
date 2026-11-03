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

    const account = choice === CategorizeInboxGroupChoiceEnum.LEARNED_TRANSFER ? learnedAccount : matchedAccount;
    const labelId = choice === CategorizeInboxGroupChoiceEnum.ALREADY_TRACKED ? CASH_WITHDRAWAL_TRACKED_CATEGORY_ID : choice;
    const isTransfer = choice === CategorizeInboxGroupChoiceEnum.TRANSFER || choice === CategorizeInboxGroupChoiceEnum.LEARNED_TRANSFER;
    const getButtonLabel = (): string | null => {
        const withTotal = (label: string): string => (isDefined(totalLabel) ? `${label} · ${totalLabel}` : label);
        if (choice === CategorizeInboxGroupChoiceEnum.MOVE_TO_CASH) {
            const cashCount = cashTransactionIds.length;

            return t`Move ${cashCount} to cash`;
        }
        if (isTransfer) {
            const title = account?.title;

            return isDefined(title) ? withTotal(t`Move ${count} to ${title}`) : null;
        }
        const labelTitle =
            choice === CategorizeInboxGroupChoiceEnum.ALREADY_TRACKED
                ? t`Already tracked`
                : strategy?.labelsById.get(isNumber(labelId) ? labelId : 0)?.title;

        return isDefined(labelTitle) ? withTotal(t`File ${count} as ${labelTitle}`) : null;
    };
    const buttonLabel = getButtonLabel();

    const handlePress = (): void => {
        if (choice === CategorizeInboxGroupChoiceEnum.MOVE_TO_CASH) {
            moveToCash(cashTransactionIds);
        } else if (isTransfer && isDefined(account)) {
            transferCluster(cluster, account.id, account.title, true);
        } else if (isNumber(labelId)) {
            assignCluster(cluster, labelId);
        }
        router.dismissTo('/categorize');
    };

    if (!isDefined(choice) || !isDefined(buttonLabel)) {
        return null;
    }

    return (
        <CategorizeInboxPrimaryBar label={buttonLabel} testID={CategorizeInboxGroupScreenSelector.PrimaryButton} onPress={handlePress} />
    );
};
