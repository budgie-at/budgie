import { TransactionTypeEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { RuleDetectionModeEnum } from '../../../rule/enum/rule-detection-mode.enum';
import { SuggestRuleDataInterface } from '../../../rule/interface/suggest-rule-data.interface';
import { UpdateRuleDataInterface } from '../../../rule/interface/update-rule-data.interface';
import { MccInfoRow } from '../mcc-info-row/mcc-info-row';
import { RulePillSlot } from '../rule-pill-slot/rule-pill-slot';
import { SuggestionsContainer } from '../suggestions-container/suggestions-container';

interface Props {
    readonly transactionTitle: string;
    readonly mccCategoryId: number | null;
    readonly isNewTransaction: boolean;
    readonly isSplitActive: boolean;
    readonly transactionType: TransactionTypeEnum;
    readonly categoryId: number | null;
    readonly comment: string;
    readonly aiContext: string;
    readonly accountId: number;
    readonly amount: number;
    readonly hasTagsSelected: boolean;
    readonly ruleDetectionMode: RuleDetectionModeEnum;
    readonly onSelectCategory: (categoryId: number) => void;
    readonly onSelectTag: (tagId: number) => void;
    readonly onSelectComment: (comment: string) => void;
    readonly onFillPatternAmount: (amount: number) => void;
    readonly suggestRuleData?: SuggestRuleDataInterface;
    readonly updateRuleData?: UpdateRuleDataInterface | null;
    readonly matchingRulesCount?: number;
    readonly onRuleCreated?: () => void;
    readonly onDismiss?: () => void;
}

export const QuickFormBottomOverlay = (props: Props) => {
    const {
        transactionTitle,
        mccCategoryId,
        isNewTransaction,
        isSplitActive,
        transactionType,
        categoryId,
        comment,
        aiContext,
        accountId,
        amount,
        hasTagsSelected,
        onSelectCategory,
        onSelectTag,
        onSelectComment,
        onFillPatternAmount,
        ruleDetectionMode,
        suggestRuleData,
        updateRuleData,
        matchingRulesCount,
        onRuleCreated,
        onDismiss
    } = props;

    return (
        <View className="absolute bottom-0 left-0 right-0 gap-md">
            <MccInfoRow transactionTitle={transactionTitle} mccCategoryId={mccCategoryId} />
            <View className="flex-row items-center gap-sm">
                <View className="shrink">
                    <RulePillSlot
                        ruleDetectionMode={ruleDetectionMode}
                        suggestRuleData={suggestRuleData}
                        updateRuleData={updateRuleData}
                        matchingRulesCount={matchingRulesCount}
                        onRuleCreated={onRuleCreated}
                        onDismiss={onDismiss}
                    />
                </View>
                <View className="flex-1">
                    <SuggestionsContainer
                        isNewTransaction={isNewTransaction}
                        isSplitActive={isSplitActive}
                        transactionType={transactionType}
                        transactionTitle={transactionTitle}
                        categoryId={categoryId}
                        mccCategoryId={mccCategoryId}
                        comment={comment}
                        aiContext={aiContext}
                        accountId={accountId}
                        amount={amount}
                        hasTagsSelected={hasTagsSelected}
                        onSelectCategory={onSelectCategory}
                        onSelectTag={onSelectTag}
                        onSelectComment={onSelectComment}
                        onFillPatternAmount={onFillPatternAmount}
                    />
                </View>
            </View>
        </View>
    );
};
