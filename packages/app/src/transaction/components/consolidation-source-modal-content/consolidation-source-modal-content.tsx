import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { ScrollView, Text, View } from 'react-native';

import { EmptyFn, isDefined, isEmptyArray } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { FormsheetHeader } from '../../../@generic/component/formsheet-header/formsheet-header';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { useRevertConsolidation } from '../../hook/use-revert-consolidation.hook';
import { useSheetFooterLayout } from '../../hook/use-sheet-footer-layout.hook';
import { useGetConsolidationSourcesQuery } from '../../query/use-get-consolidation-sources.query';
import { getTransactionListRowPosition } from '../../utils/get-transaction-list-row-position.util';
import { ConsolidationSourceRow } from '../consolidation-source-row/consolidation-source-row';

import { ConsolidationSourceModalSelector } from './consolidation-source-modal-content.selector';

interface Props {
    readonly transactionId: number;
    readonly onClose: EmptyFn;
    readonly onRevertSuccess: EmptyFn;
}

export const ConsolidationSourceModalContent = ({ transactionId, onClose, onRevertSuccess }: Props) => {
    const isAccessibilityTextSize = useIsAccessibilityTextSize();
    const { sources, consolidationType, hasError, isLoading, retry } = useGetConsolidationSourcesQuery(transactionId);
    const { contentContainerStyle, handleFooterLayout } = useSheetFooterLayout();
    const revertConsolidation = useRevertConsolidation(transactionId, onRevertSuccess);

    const showEmptyState = isEmptyArray(sources) && !hasError;
    const showRevert = isDefined(consolidationType);
    const footerClassName = isAccessibilityTextSize ? 'flex-col gap-y-md' : 'flex-row gap-x-md';
    const buttonClassName = isAccessibilityTextSize ? '' : 'flex-1';
    const sourceRows = sources.map((source, index) => (
        <ConsolidationSourceRow
            key={source.entryId}
            source={source}
            position={getTransactionListRowPosition(index, sources.length)}
            consolidationType={consolidationType}
            testID={ConsolidationSourceModalSelector.Row(index)}
        />
    ));

    return (
        <View className="flex-1">
            <ScrollView
                className="flex-1"
                contentContainerClassName="grow"
                contentContainerStyle={contentContainerStyle}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <FormsheetHeader size="md" title={t`Sources`} description={t`Each source becomes a separate transaction.`} />
                <LoadingContent isLoading={isLoading} containerClassName="flex-1" className="flex-1">
                    {hasError ? (
                        <View className="gap-y-md px-xl py-xl">
                            <Text className="text-sm text-destructive-foreground">{t`Could not load sources. Please try again.`}</Text>
                            <Button content={t`Try again`} onPress={retry} variant="secondary" />
                        </View>
                    ) : null}

                    {showEmptyState ? (
                        <EmptyState
                            circleIcon={UserIconNameEnum.GitMerge}
                            title={t`No source transactions`}
                            description={t`There are no linked transactions to show.`}
                            className="flex-1 px-xl"
                            titleClassName="text-center font-semibold text-primary"
                            descriptionClassName="text-center text-secondary-foreground"
                        />
                    ) : null}

                    <View className="px-xl">{sourceRows}</View>
                </LoadingContent>
            </ScrollView>

            <View
                className="absolute bottom-0 left-0 right-0 bg-grouped-surface px-xl pt-md pb-safe-or-[16px]"
                onLayout={handleFooterLayout}
            >
                <View className={footerClassName}>
                    <Button
                        content={t`Done`}
                        variant="primary"
                        size="md"
                        onPress={onClose}
                        testID={ConsolidationSourceModalSelector.DoneButton}
                        className={buttonClassName}
                    />

                    {showRevert ? (
                        <Button
                            content={t`Separate all`}
                            variant="primary"
                            size="md"
                            onPress={revertConsolidation}
                            testID={ConsolidationSourceModalSelector.RevertButton}
                            className={buttonClassName}
                        />
                    ) : null}
                </View>
            </View>
        </View>
    );
};
