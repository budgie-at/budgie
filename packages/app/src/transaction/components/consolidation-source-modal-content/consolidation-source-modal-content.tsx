import { TransactionConsolidationTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { isDefined, isEmptyArray, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { FormsheetHeader } from '../../../@generic/component/formsheet-header/formsheet-header';
import { ListItemSeparator } from '../../../@generic/component/list-item-separator/list-item-separator';
import { useRevertConsolidation } from '../../hook/use-revert-consolidation.hook';
import { useGetConsolidationSourcesQuery } from '../../query/use-get-consolidation-sources.query';
import { ConsolidationSourceRow } from '../consolidation-source-row/consolidation-source-row';

import { ConsolidationSourceModalSelector } from './consolidation-source-modal-content.selector';

import type { ConsolidationSourceModalContentPropsInterface } from '../../interface/consolidation-source-modal-content-props.interface';

const COMPACT_SOURCE_LIST_LIMIT = 2;

export const ConsolidationSourceModalContent = ({
    transactionId,
    onClose,
    onRevertSuccess
}: ConsolidationSourceModalContentPropsInterface) => {
    const { sources, consolidationType, hasError, isLoading } = useGetConsolidationSourcesQuery(transactionId);
    const revertConsolidation = useRevertConsolidation(transactionId, onRevertSuccess);

    const isRefund = consolidationType === TransactionConsolidationTypeEnum.REFUND;
    const hasSources = isNotEmptyArray(sources);
    const showEmptyState = isEmptyArray(sources) && !isLoading && !hasError;
    const showRevert = isDefined(consolidationType);
    const useCompactSourceList = sources.length <= COMPACT_SOURCE_LIST_LIMIT;
    const useFlexibleContainer = isLoading || showEmptyState || (hasSources && !useCompactSourceList);
    const containerClassName = useFlexibleContainer ? 'flex-1' : '';
    const sourceListContentClassName = isRefund ? 'px-xl pt-3xl pb-2xl' : 'px-xl pt-xl pb-2xl';
    const footerClassName = showRevert ? 'flex-row gap-x-md' : '';
    const sourceRows = sources.map((source, index) => (
        <View key={source.entryId}>
            {isPositiveNumber(index) ? <ListItemSeparator /> : null}
            <ConsolidationSourceRow
                source={source}
                index={index}
                consolidationType={consolidationType}
                testID={ConsolidationSourceModalSelector.Row(index)}
            />
        </View>
    ));

    return (
        <View className={containerClassName}>
            {isRefund ? null : <FormsheetHeader size="md" title={t`Source transactions`} />}

            {hasError ? (
                <Text className="px-xl pb-md pt-xl text-sm text-destructive-foreground">
                    {t`Could not load sources. Please try again.`}
                </Text>
            ) : null}

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator />
                </View>
            ) : null}

            {showEmptyState ? (
                <EmptyState
                    circleIcon={UserIconNameEnum.GitMerge}
                    title={t`No source transactions`}
                    description={t`This consolidated transfer has no moved source entries.`}
                    className="flex-1 px-xl"
                />
            ) : null}

            {hasSources && useCompactSourceList ? <View className={sourceListContentClassName}>{sourceRows}</View> : null}

            {hasSources && !useCompactSourceList ? (
                <ScrollView
                    className="flex-1"
                    contentContainerClassName={sourceListContentClassName}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {sourceRows}
                </ScrollView>
            ) : null}

            <View className="px-xl pb-xl">
                <View className={footerClassName}>
                    <Button
                        content={t`Done`}
                        variant="secondary"
                        size="md"
                        onPress={onClose}
                        testID={ConsolidationSourceModalSelector.DoneButton}
                        className="flex-1"
                    />

                    {showRevert ? (
                        <Button
                            content={t`Revert`}
                            variant="destructive"
                            size="md"
                            leftIcon={UserIconNameEnum.Undo2}
                            onPress={revertConsolidation}
                            testID={ConsolidationSourceModalSelector.RevertButton}
                            className="flex-1"
                        />
                    ) : null}
                </View>
            </View>
        </View>
    );
};
