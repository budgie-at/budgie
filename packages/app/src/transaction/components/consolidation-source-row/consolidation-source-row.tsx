import { TransactionConsolidationTypeEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { isNotEmptyString } from '@rnw-community/shared';

import { TransactionPickerRow } from '../transaction-picker-row/transaction-picker-row';

import type { ConsolidationSourceRowPropsInterface } from '../../interface/consolidation-source-row-props.interface';
import type { TransactionPickerItemInterface } from '../../interface/transaction-picker-item.interface';
import type { ConsolidationSourceRowInterface } from '@budgie/contracts';

const ANIMATION_STAGGER_MS = 60;
const ANIMATION_STAGGER_MAX_INDEX = 4;
const ANIMATION_DURATION_MS = 280;
const getSourceTitle = (source: ConsolidationSourceRowInterface): string => {
    if (isNotEmptyString(source.sourceTitle)) {
        return source.sourceTitle;
    }

    if (isNotEmptyString(source.sourceComment)) {
        return source.sourceComment;
    }

    return t`Original transaction`;
};

const getSourceDisplayType = (
    source: ConsolidationSourceRowInterface,
    consolidationType: TransactionConsolidationTypeEnum | null
): TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME => {
    if (consolidationType === TransactionConsolidationTypeEnum.REFUND) {
        return source.sourceType === TransactionTypeEnum.INCOME ? TransactionTypeEnum.INCOME : TransactionTypeEnum.EXPENSE;
    }

    return source.entryType === TransactionEntryTypeEnum.CREDIT ? TransactionTypeEnum.INCOME : TransactionTypeEnum.EXPENSE;
};

const mapSourceToPickerItem = (
    source: ConsolidationSourceRowInterface,
    consolidationType: TransactionConsolidationTypeEnum | null
): TransactionPickerItemInterface => ({
    id: source.sourceTransactionId,
    type: getSourceDisplayType(source, consolidationType),
    title: getSourceTitle(source),
    operatedAt: new Date(source.sourceOperatedAtMs),
    amount: source.amount,
    accountTitle: source.accountTitle,
    currencySymbol: source.currencySymbol,
    categoryTitle: source.categoryTitle,
    categoryIcon: source.categoryIcon,
    isRecommended: false
});

export const ConsolidationSourceRow = ({ source, index, consolidationType, testID }: ConsolidationSourceRowPropsInterface) => {
    const staggerIndex = Math.min(index, ANIMATION_STAGGER_MAX_INDEX);
    const item = mapSourceToPickerItem(source, consolidationType);

    return (
        <Animated.View
            entering={FadeIn.delay(staggerIndex * ANIMATION_STAGGER_MS).duration(ANIMATION_DURATION_MS)}
            layout={LinearTransition}
            testID={testID}
        >
            <TransactionPickerRow item={item} testID={testID} />
        </Animated.View>
    );
};
