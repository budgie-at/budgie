import { View } from 'react-native';

import { MccInfoRow } from '../mcc-info-row/mcc-info-row';
import { SuggestionsContainer } from '../suggestions-container/suggestions-container';

import type { useSimpleQuickFormState } from '../../hook/use-simple-quick-form-state.hook';
import type { TransactionTypeEnum } from '@budgie/contracts';

interface Props {
    readonly transactionType: TransactionTypeEnum;
    readonly aiContext: string;
    readonly isNewTransaction: boolean;
    readonly formState: ReturnType<typeof useSimpleQuickFormState>;
}

export const QuickFormBottomOverlay = ({ transactionType, aiContext, isNewTransaction, formState }: Props) => (
    <View className="absolute bottom-0 left-0 right-0 gap-md">
        <MccInfoRow transactionTitle={formState.title} mccCategoryId={formState.mccCategoryId} />
        <SuggestionsContainer
            isNewTransaction={isNewTransaction}
            isSplitActive={formState.isSplitActive}
            transactionType={transactionType}
            transactionTitle={formState.title}
            categoryId={formState.categoryId}
            isCategoryUserConfirmed={formState.isCategoryUserConfirmed}
            mccCategoryId={formState.mccCategoryId}
            comment={formState.comment}
            aiContext={aiContext}
            accountId={formState.accountId}
            amount={formState.amount}
            hasTagsSelected={formState.hasTagsSelected}
            onSelectCategory={formState.handleSelectCategory}
            onSelectTag={formState.handleSelectTag}
            onSelectComment={formState.handleSelectComment}
            onFillPatternAmount={formState.handleFillPatternAmount}
        />
    </View>
);
