import { Trans, useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { useCategorizeInboxGroupOptions } from '../../hook/use-categorize-inbox-group-options.hook';
import { CategorizeInboxChoiceRow } from '../categorize-inbox-choice-row/categorize-inbox-choice-row';
import { CategorizeInboxGroupAlreadyTrackedOption } from '../categorize-inbox-group-already-tracked-option/categorize-inbox-group-already-tracked-option';
import { CategorizeInboxGroupLearnedTransferOption } from '../categorize-inbox-group-learned-transfer-option/categorize-inbox-group-learned-transfer-option';
import { CategorizeInboxGroupMoreLabelsOption } from '../categorize-inbox-group-more-labels-option/categorize-inbox-group-more-labels-option';
import { CategorizeInboxGroupMoveToCashOption } from '../categorize-inbox-group-move-to-cash-option/categorize-inbox-group-move-to-cash-option';
import { CategorizeInboxGroupTransferLead } from '../categorize-inbox-group-transfer-lead/categorize-inbox-group-transfer-lead';
import { CategorizeInboxGroupTransferOption } from '../categorize-inbox-group-transfer-option/categorize-inbox-group-transfer-option';
import { CategorizeInboxLeadOption } from '../categorize-inbox-lead-option/categorize-inbox-lead-option';
import { CategorizeInboxOptionCard } from '../categorize-inbox-option-card/categorize-inbox-option-card';
import { CategorizeInboxOptionSectionTitle } from '../categorize-inbox-option-section-title/categorize-inbox-option-section-title';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxGroupOptions = ({ cluster }: Props) => {
    const { learnedAccount, isLeadTransfer, isCash, bestMatchLabel, otherLabels, cashTransactionIds } =
        useCategorizeInboxGroupOptions(cluster);
    const { t } = useLingui();
    const { strategy } = useCategorizeInboxContext();

    const hasTransferLead = isDefined(learnedAccount) || isLeadTransfer;
    const hasLead = hasTransferLead || isDefined(bestMatchLabel);
    const candidateOptions = hasTransferLead ? [] : otherLabels;
    const moreLabelsTitle = isDefined(bestMatchLabel) || isNotEmptyArray(candidateOptions) ? strategy?.moreLabels : strategy?.chooseLabel;
    const otherOptionsHeading = hasLead ? (
        <CategorizeInboxOptionSectionTitle>
            <Trans>Other options</Trans>
        </CategorizeInboxOptionSectionTitle>
    ) : null;

    const learnedTransfer = isDefined(learnedAccount) ? <CategorizeInboxGroupLearnedTransferOption account={learnedAccount} /> : null;
    const leadTransfer = isLeadTransfer ? <CategorizeInboxGroupTransferLead cluster={cluster} /> : null;
    const trailingTransfer = isLeadTransfer ? null : <CategorizeInboxGroupTransferOption cluster={cluster} />;
    const moveToCash = isNotEmptyArray(cashTransactionIds) ? <CategorizeInboxGroupMoveToCashOption /> : null;
    const moreLabels = isDefined(moreLabelsTitle) ? (
        <CategorizeInboxGroupMoreLabelsOption cluster={cluster} title={moreLabelsTitle} />
    ) : null;
    const alreadyTracked = isCash ? <CategorizeInboxGroupAlreadyTrackedOption /> : null;

    return (
        <View>
            <CategorizeInboxOptionSectionTitle>
                <Trans>What is it?</Trans>
            </CategorizeInboxOptionSectionTitle>

            <View className="gap-y-md">
                {learnedTransfer}
                {leadTransfer}
                {isDefined(bestMatchLabel) ? (
                    <CategorizeInboxLeadOption
                        choice={bestMatchLabel.id}
                        icon={bestMatchLabel.icon}
                        title={bestMatchLabel.title}
                        subtitle={t`Best match`}
                    />
                ) : null}
            </View>
            {otherOptionsHeading}
            <CategorizeInboxOptionCard>
                {moveToCash}
                {alreadyTracked}
                {candidateOptions.map(label => (
                    <CategorizeInboxChoiceRow key={label.id} choice={label.id} icon={label.icon} title={label.title} />
                ))}
                {moreLabels}
                {trailingTransfer}
            </CategorizeInboxOptionCard>
        </View>
    );
};
