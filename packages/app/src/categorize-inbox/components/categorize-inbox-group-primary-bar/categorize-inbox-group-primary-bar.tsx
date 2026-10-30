import { CASH_WITHDRAWAL_TRACKED_CATEGORY_ID } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { isDefined, isNumber } from '@rnw-community/shared';

import { useCategorizeInboxGroupChoiceContext } from '../../context/categorize-inbox-group-choice.context';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxGroupChoiceEnum } from '../../enum/categorize-inbox-group-choice.enum';
import { useCategorizeInboxGroupOptions } from '../../hook/use-categorize-inbox-group-options.hook';
import { CategorizeInboxGroupFileBar } from '../categorize-inbox-group-file-bar/categorize-inbox-group-file-bar';
import { CategorizeInboxGroupLearnedTransferBar } from '../categorize-inbox-group-learned-transfer-bar/categorize-inbox-group-learned-transfer-bar';
import { CategorizeInboxGroupScreenSelector } from '../categorize-inbox-group-screen/categorize-inbox-group-screen.selector';
import { CategorizeInboxPrimaryBar } from '../categorize-inbox-primary-bar/categorize-inbox-primary-bar';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';
import type { ReactNode } from 'react';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxGroupPrimaryBar = ({ cluster }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const { strategy, moveToCash } = useCategorizeInboxContext();
    const { choice } = useCategorizeInboxGroupChoiceContext();
    const { learnedAccount, cashTransactionIds } = useCategorizeInboxGroupOptions(cluster);

    const handleChooseAccount = (): void => void router.push({ pathname: '/categorize/transfer/[key]', params: { key: cluster.key } });
    const handleMoveToCash = (): void => {
        moveToCash(cashTransactionIds);
        router.dismissTo('/categorize');
    };

    const cashCount = cashTransactionIds.length;
    const labelTitle = isNumber(choice) ? strategy?.labelsById.get(choice)?.title : null;
    const bars: Record<CategorizeInboxGroupChoiceEnum, ReactNode> = {
        [CategorizeInboxGroupChoiceEnum.TRANSFER]: (
            <CategorizeInboxPrimaryBar
                label={t`Choose account`}
                testID={CategorizeInboxGroupScreenSelector.PrimaryButton}
                onPress={handleChooseAccount}
            />
        ),
        [CategorizeInboxGroupChoiceEnum.LEARNED_TRANSFER]: isDefined(learnedAccount) ? (
            <CategorizeInboxGroupLearnedTransferBar cluster={cluster} account={learnedAccount} />
        ) : null,
        [CategorizeInboxGroupChoiceEnum.MOVE_TO_CASH]: (
            <CategorizeInboxPrimaryBar
                label={t`Move ${cashCount} to cash`}
                testID={CategorizeInboxGroupScreenSelector.PrimaryButton}
                onPress={handleMoveToCash}
            />
        ),
        [CategorizeInboxGroupChoiceEnum.ALREADY_TRACKED]: (
            <CategorizeInboxGroupFileBar cluster={cluster} labelId={CASH_WITHDRAWAL_TRACKED_CATEGORY_ID} labelTitle={t`Already tracked`} />
        )
    };

    if (isNumber(choice)) {
        return isDefined(labelTitle) ? <CategorizeInboxGroupFileBar cluster={cluster} labelId={choice} labelTitle={labelTitle} /> : null;
    }

    return isDefined(choice) ? bars[choice] : null;
};
