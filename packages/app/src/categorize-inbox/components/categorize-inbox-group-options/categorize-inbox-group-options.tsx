import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { useCategorizeInboxMatchedAccount } from '../../hook/use-categorize-inbox-matched-account.hook';
import { getCategorizeInboxJarName } from '../../utils/get-categorize-inbox-jar-name.util';
import { CategorizeInboxGroupAlreadyTrackedOption } from '../categorize-inbox-group-already-tracked-option/categorize-inbox-group-already-tracked-option';
import { CategorizeInboxGroupChoosePaymentsOption } from '../categorize-inbox-group-choose-payments-option/categorize-inbox-group-choose-payments-option';
import { CategorizeInboxGroupLabelOption } from '../categorize-inbox-group-label-option/categorize-inbox-group-label-option';
import { CategorizeInboxGroupLearnedTransferOption } from '../categorize-inbox-group-learned-transfer-option/categorize-inbox-group-learned-transfer-option';
import { CategorizeInboxGroupMoreLabelsOption } from '../categorize-inbox-group-more-labels-option/categorize-inbox-group-more-labels-option';
import { CategorizeInboxGroupMoveToCashOption } from '../categorize-inbox-group-move-to-cash-option/categorize-inbox-group-move-to-cash-option';
import { CategorizeInboxGroupTagsOption } from '../categorize-inbox-group-tags-option/categorize-inbox-group-tags-option';
import { CategorizeInboxGroupTransferOption } from '../categorize-inbox-group-transfer-option/categorize-inbox-group-transfer-option';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxGroupOptions = ({ cluster }: Props) => {
    const { strategy, learnedTransferAccountIds } = useCategorizeInboxContext();
    const matchedAccount = useCategorizeInboxMatchedAccount(cluster);

    const jarName = getCategorizeInboxJarName(cluster.displayTitle);
    const isLearnedMatch = isDefined(matchedAccount) && learnedTransferAccountIds.get(jarName ?? '') === matchedAccount.id;
    const isLeadTransfer = !isLearnedMatch && (isDefined(jarName) || isDefined(matchedAccount));
    const isCash = cluster.section === CategorizeInboxSectionEnum.CASH_WITHDRAWALS;
    const isConfident = cluster.section === CategorizeInboxSectionEnum.CONFIDENT;
    const labelOptions = cluster.candidateLabelIds
        .map(labelId => strategy?.labelsById.get(labelId))
        .filter(isDefined)
        .map((label, index) => ({ label, isBestMatch: isConfident && index === 0 }));

    const leadTransfer = isLeadTransfer ? <CategorizeInboxGroupTransferOption cluster={cluster} isLead /> : null;
    const trailingTransfer = isLeadTransfer ? null : <CategorizeInboxGroupTransferOption cluster={cluster} isLead={false} />;
    const cashOptions = isCash ? (
        <>
            <CategorizeInboxGroupMoveToCashOption cluster={cluster} />
            <CategorizeInboxGroupAlreadyTrackedOption cluster={cluster} />
        </>
    ) : null;

    return (
        <View className="pt-xl">
            <Text className="text-primary pb-md text-lg font-semibold">
                <Trans>What is it?</Trans>
            </Text>

            <CategorizeInboxGroupLearnedTransferOption cluster={cluster} />
            {leadTransfer}
            {cashOptions}
            {labelOptions.map(option => (
                <CategorizeInboxGroupLabelOption key={option.label.id} cluster={cluster} {...option} />
            ))}
            <CategorizeInboxGroupMoreLabelsOption cluster={cluster} />
            {trailingTransfer}

            <Text className="pb-xs pt-6xl text-xs font-medium uppercase tracking-wider text-secondary-foreground">
                <Trans>Refine</Trans>
            </Text>
            <CategorizeInboxGroupTagsOption cluster={cluster} />
            <CategorizeInboxGroupChoosePaymentsOption cluster={cluster} />
        </View>
    );
};
