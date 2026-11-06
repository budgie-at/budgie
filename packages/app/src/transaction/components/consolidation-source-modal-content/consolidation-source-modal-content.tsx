import { TransactionConsolidationTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { EmptyFn, isDefined, isEmptyArray } from '@rnw-community/shared';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { SheetTitleRow } from '../../../@generic/component/sheet-title-row/sheet-title-row';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { useRevertConsolidation } from '../../hook/use-revert-consolidation.hook';
import { useGetConsolidationSourcesQuery } from '../../query/use-get-consolidation-sources.query';
import { getTransactionListRowPosition } from '../../utils/get-transaction-list-row-position.util';
import { ConsolidationSourceRow } from '../consolidation-source-row/consolidation-source-row';
import { TransactionPickerAction } from '../transaction-picker-action/transaction-picker-action';
import { TransactionPickerContext } from '../transaction-picker-context/transaction-picker-context';
import { TransactionPickerEmpty } from '../transaction-picker-empty/transaction-picker-empty';
import { TransactionPickerFailure } from '../transaction-picker-failure/transaction-picker-failure';
import { TransactionPickerSheet } from '../transaction-picker-sheet/transaction-picker-sheet';

import { ConsolidationSourceModalSelector } from './consolidation-source-modal-content.selector';

interface Props {
    readonly transactionId: number;
    readonly onClose: EmptyFn;
    readonly onRevertSuccess: EmptyFn;
}

export const ConsolidationSourceModalContent = ({ transactionId, onClose, onRevertSuccess }: Props) => {
    const { t } = useLingui();
    const largeText = useIsAccessibilityTextSize();
    const { sources, consolidationType, hasError, isLoading, retry } = useGetConsolidationSourcesQuery(transactionId);
    const revertConsolidation = useRevertConsolidation(transactionId, onRevertSuccess);
    const sourceTitle = consolidationType === TransactionConsolidationTypeEnum.REFUND ? t`Refunds` : t`Sources`;
    const contextLabel = consolidationType === TransactionConsolidationTypeEnum.REFUND ? t`Original expense` : t`Original transaction`;
    const showEmptyState = isEmptyArray(sources) && !hasError;
    const isRevertDisabled = isLoading || hasError || isEmptyArray(sources) || !isDefined(consolidationType);

    const separationAction = (
        <TransactionPickerAction
            label={t`Separate all`}
            onPress={revertConsolidation}
            disabled={isRevertDisabled}
            testID={ConsolidationSourceModalSelector.RevertButton}
        />
    );
    const pinnedFooter = largeText ? null : separationAction;
    const scrollFooter = largeText ? separationAction : null;

    return (
        <TransactionPickerSheet
            testID={ConsolidationSourceModalSelector.Picker}
            header={<SheetTitleRow title={sourceTitle} onClose={onClose} doneTestID={ConsolidationSourceModalSelector.DoneButton} />}
            pinnedFooter={pinnedFooter}
            scrollFooter={scrollFooter}
        >
            <TransactionPickerContext transactionId={transactionId} label={contextLabel} />
            <LoadingContent isLoading={isLoading} containerClassName="grow shrink-0">
                {hasError ? <TransactionPickerFailure onRetry={retry} /> : null}
                {showEmptyState ? (
                    <TransactionPickerEmpty
                        icon={UserIconNameEnum.GitMerge}
                        title={t`No source transactions`}
                        description={t`There are no linked transactions to show.`}
                    />
                ) : null}
                {sources.map((source, index) => (
                    <ConsolidationSourceRow
                        key={source.entryId}
                        source={source}
                        position={getTransactionListRowPosition(index, sources.length)}
                        consolidationType={consolidationType}
                        testID={ConsolidationSourceModalSelector.Row(index)}
                    />
                ))}
            </LoadingContent>
            {isRevertDisabled ? null : (
                <Text dynamicTypeRamp="footnote" className="pt-md text-[13px] text-secondary-foreground">
                    <Trans>Each source becomes a separate transaction.</Trans>
                </Text>
            )}
        </TransactionPickerSheet>
    );
};
