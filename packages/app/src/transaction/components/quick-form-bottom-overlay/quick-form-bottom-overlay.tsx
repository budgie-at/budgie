import { TransactionTypeEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { MccInfoRow } from '../mcc-info-row/mcc-info-row';
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
    readonly onSelectCategory: (categoryId: number) => void;
    readonly onSelectTag: (tagId: number) => void;
    readonly onSelectComment: (comment: string) => void;
    readonly onFillPatternAmount: (amount: number) => void;
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
        onFillPatternAmount
    } = props;

    return (
        <View className="absolute bottom-0 left-0 right-0 gap-md">
            <MccInfoRow transactionTitle={transactionTitle} mccCategoryId={mccCategoryId} />
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
    );
};
