import { Trans } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useCategorizeInboxGroupOptions } from '../../hook/use-categorize-inbox-group-options.hook';
import { CategorizeInboxGroupAlreadyTrackedOption } from '../categorize-inbox-group-already-tracked-option/categorize-inbox-group-already-tracked-option';
import { CategorizeInboxGroupLabelOption } from '../categorize-inbox-group-label-option/categorize-inbox-group-label-option';
import { CategorizeInboxGroupLearnedTransferOption } from '../categorize-inbox-group-learned-transfer-option/categorize-inbox-group-learned-transfer-option';
import { CategorizeInboxGroupMoreLabelsOption } from '../categorize-inbox-group-more-labels-option/categorize-inbox-group-more-labels-option';
import { CategorizeInboxGroupMoveToCashOption } from '../categorize-inbox-group-move-to-cash-option/categorize-inbox-group-move-to-cash-option';
import { CategorizeInboxGroupTransferLead } from '../categorize-inbox-group-transfer-lead/categorize-inbox-group-transfer-lead';
import { CategorizeInboxGroupTransferOption } from '../categorize-inbox-group-transfer-option/categorize-inbox-group-transfer-option';
import { CategorizeInboxOptionCard } from '../categorize-inbox-option-card/categorize-inbox-option-card';
import { CategorizeInboxOptionSectionTitle } from '../categorize-inbox-option-section-title/categorize-inbox-option-section-title';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxGroupOptions = ({ cluster }: Props) => {
    const { learnedAccount, isLeadTransfer, isCash, leadLabelOptions, otherLabelOptions, cashTransactionIds } =
        useCategorizeInboxGroupOptions(cluster);

    const hasTransferLead = isDefined(learnedAccount) || isLeadTransfer;
    const hasLead = hasTransferLead || isNotEmptyArray(leadLabelOptions);
    const candidateOptions = hasTransferLead ? [] : otherLabelOptions;
    const otherOptionsHeading = hasLead ? (
        <CategorizeInboxOptionSectionTitle>
            <Trans>Other options</Trans>
        </CategorizeInboxOptionSectionTitle>
    ) : null;

    const learnedTransfer = isDefined(learnedAccount) ? <CategorizeInboxGroupLearnedTransferOption account={learnedAccount} /> : null;
    const leadTransfer = isLeadTransfer ? <CategorizeInboxGroupTransferLead cluster={cluster} /> : null;
    const trailingTransfer = isLeadTransfer ? null : <CategorizeInboxGroupTransferOption cluster={cluster} />;
    const moveToCash = isNotEmptyArray(cashTransactionIds) ? <CategorizeInboxGroupMoveToCashOption /> : null;
    const alreadyTracked = isCash ? <CategorizeInboxGroupAlreadyTrackedOption /> : null;

    return (
        <View>
            <CategorizeInboxOptionSectionTitle>
                <Trans>What is it?</Trans>
            </CategorizeInboxOptionSectionTitle>

            <View className="gap-y-md">
                {learnedTransfer}
                {leadTransfer}
                {leadLabelOptions.map(option => (
                    <CategorizeInboxGroupLabelOption key={option.label.id} {...option} />
                ))}
            </View>
            {otherOptionsHeading}
            <CategorizeInboxOptionCard>
                {moveToCash}
                {alreadyTracked}
                {candidateOptions.map(option => (
                    <CategorizeInboxGroupLabelOption key={option.label.id} {...option} />
                ))}
                <CategorizeInboxGroupMoreLabelsOption cluster={cluster} />
                {trailingTransfer}
            </CategorizeInboxOptionCard>
        </View>
    );
};
