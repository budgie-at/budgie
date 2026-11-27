import { ConsolidationSourceRowInterface, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';

import { isNotEmptyString } from '@rnw-community/shared';

import { TransactionListRowPositionEnum } from '../../enum/transaction-list-row-position.enum';
import { getConsolidationSourceDisplayType } from '../../utils/get-consolidation-source-display-type.util';
import { getEnableBankingTransactionDisplayTitle } from '../../utils/get-enable-banking-transaction-display-title.util';
import { TransactionPickerRow } from '../transaction-picker-row/transaction-picker-row';

import type { TransactionPickerItemInterface } from '../../interface/transaction-picker-item.interface';

interface Props {
    readonly source: ConsolidationSourceRowInterface;
    readonly position: TransactionListRowPositionEnum;
    readonly consolidationType: TransactionConsolidationTypeEnum | null;
    readonly testID?: string;
}

const getSourceTitle = (source: ConsolidationSourceRowInterface): string => {
    const title = getEnableBankingTransactionDisplayTitle({
        title: source.sourceTitle,
        comment: source.sourceComment,
        externalSource: source.sourceExternalSource
    });

    return isNotEmptyString(title) ? title : t`Original transaction`;
};

const mapSourceToPickerItem = (
    source: ConsolidationSourceRowInterface,
    consolidationType: TransactionConsolidationTypeEnum | null
): TransactionPickerItemInterface => ({
    id: source.sourceTransactionId,
    type: getConsolidationSourceDisplayType(source, consolidationType),
    title: getSourceTitle(source),
    operatedAt: new Date(source.sourceOperatedAtMs),
    amount: source.amount,
    accountTitle: source.accountTitle,
    currencySymbol: source.currencySymbol,
    categoryTitle: source.categoryTitle,
    categoryIcon: source.categoryIcon,
    isRecommended: false
});

export const ConsolidationSourceRow = ({ source, position, consolidationType, testID }: Props) => (
    <TransactionPickerRow item={mapSourceToPickerItem(source, consolidationType)} position={position} testID={testID} />
);
