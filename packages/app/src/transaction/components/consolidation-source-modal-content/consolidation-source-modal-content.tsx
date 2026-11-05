import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { ScrollView, Text, View } from 'react-native';

import { EmptyFn, isDefined, isEmptyArray } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { FormsheetHeader } from '../../../@generic/component/formsheet-header/formsheet-header';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { useRevertConsolidation } from '../../hook/use-revert-consolidation.hook';
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
    const { sources, consolidationType, hasError, isLoading, retry } = useGetConsolidationSourcesQuery(transactionId);
    const revertConsolidation = useRevertConsolidation(transactionId, onRevertSuccess);

    const showEmptyState = isEmptyArray(sources) && !hasError;
    const showRevert = isDefined(consolidationType);
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
                contentContainerClassName="grow pb-2xl"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <FormsheetHeader size="md" title={t`Source transactions`} />
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
                        />
                    ) : null}

                    <View className="px-xl">{sourceRows}</View>
                </LoadingContent>
            </ScrollView>

            <View className="px-xl pb-xl">
                <View className="flex-row gap-x-md">
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
                            content={t`Separate`}
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
