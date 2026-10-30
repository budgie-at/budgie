import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { Trans } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { useCategorizeInboxMatchedAccount } from '../../hook/use-categorize-inbox-matched-account.hook';
import { getCategorizeInboxJarName } from '../../utils/get-categorize-inbox-jar-name.util';
import { CategorizeInboxGroupAlreadyTrackedOption } from '../categorize-inbox-group-already-tracked-option/categorize-inbox-group-already-tracked-option';
import { CategorizeInboxGroupLabelOption } from '../categorize-inbox-group-label-option/categorize-inbox-group-label-option';
import { CategorizeInboxGroupLearnedTransferOption } from '../categorize-inbox-group-learned-transfer-option/categorize-inbox-group-learned-transfer-option';
import { CategorizeInboxGroupMoreLabelsOption } from '../categorize-inbox-group-more-labels-option/categorize-inbox-group-more-labels-option';
import { CategorizeInboxGroupMoveToCashOption } from '../categorize-inbox-group-move-to-cash-option/categorize-inbox-group-move-to-cash-option';
import { CategorizeInboxGroupTransferOption } from '../categorize-inbox-group-transfer-option/categorize-inbox-group-transfer-option';
import { CategorizeInboxOptionCard } from '../categorize-inbox-option-card/categorize-inbox-option-card';
import { CategorizeInboxOptionSectionTitle } from '../categorize-inbox-option-section-title/categorize-inbox-option-section-title';

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

    const leadLabelOptions = labelOptions.filter(option => option.isBestMatch);
    const otherLabelOptions = labelOptions.filter(option => !option.isBestMatch);
    const otherOptionsHeading =
        isLeadTransfer || isLearnedMatch || isNotEmptyArray(leadLabelOptions) ? (
            <CategorizeInboxOptionSectionTitle>
                <Trans>Other options</Trans>
            </CategorizeInboxOptionSectionTitle>
        ) : null;

    const leadTransfer = isLeadTransfer ? <CategorizeInboxGroupTransferOption cluster={cluster} isLead /> : null;
    const trailingTransfer = isLeadTransfer ? null : <CategorizeInboxGroupTransferOption cluster={cluster} isLead={false} />;
    const cashOptions = isCash ? (
        <>
            <CategorizeInboxGroupMoveToCashOption cluster={cluster} />
            <CategorizeInboxGroupAlreadyTrackedOption cluster={cluster} />
        </>
    ) : null;

    return (
        <View>
            <CategorizeInboxOptionSectionTitle>
                <Trans>What is it?</Trans>
            </CategorizeInboxOptionSectionTitle>

            <View className="gap-y-md">
                <CategorizeInboxGroupLearnedTransferOption cluster={cluster} />
                {leadTransfer}
                {leadLabelOptions.map(option => (
                    <CategorizeInboxGroupLabelOption key={option.label.id} cluster={cluster} {...option} />
                ))}
            </View>
            {otherOptionsHeading}
            <CategorizeInboxOptionCard>
                {cashOptions}
                {otherLabelOptions.map(option => (
                    <CategorizeInboxGroupLabelOption key={option.label.id} cluster={cluster} {...option} />
                ))}
                <CategorizeInboxGroupMoreLabelsOption cluster={cluster} />
                {trailingTransfer}
            </CategorizeInboxOptionCard>
        </View>
    );
};
