import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { ListItemSeparator } from '../../../@generic/component/list-item-separator/list-item-separator';
import { useGetConsolidationSourcesQuery } from '../../query/use-get-consolidation-sources.query';
import { ConsolidationSourceRow } from '../consolidation-source-row/consolidation-source-row';

import { ConsolidationSourceModalSelector } from './consolidation-source-modal-content.selector';

import type { ConsolidationSourceModalContentPropsInterface } from '../../interface/consolidation-source-modal-content-props.interface';

export const ConsolidationSourceModalContent = ({ transactionId, onClose }: ConsolidationSourceModalContentPropsInterface) => {
    const { sources, hasError, isLoading } = useGetConsolidationSourcesQuery(transactionId);

    const hasSources = isNotEmptyArray(sources);
    const showEmptyState = isEmptyArray(sources) && !isLoading && !hasError;

    return (
        <View className="flex-1">
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
                <View className="flex-1 items-center justify-center">
                    <EmptyState
                        circleIcon={UserIconNameEnum.GitMerge}
                        title={t`No source transactions`}
                        description={t`This consolidated transfer has no moved source entries.`}
                    />
                </View>
            ) : null}

            {hasSources ? (
                <ScrollView
                    className="flex-1"
                    contentContainerClassName="px-xl pt-xl pb-xl"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {sources.map((source, index) => (
                        <View key={source.entryId}>
                            {index > 0 ? <ListItemSeparator /> : null}
                            <ConsolidationSourceRow source={source} index={index} testID={ConsolidationSourceModalSelector.Row(index)} />
                        </View>
                    ))}
                </ScrollView>
            ) : null}

            <View className="px-xl pb-xl">
                <Button
                    content={t`Done`}
                    variant="secondary"
                    size="md"
                    onPress={onClose}
                    testID={ConsolidationSourceModalSelector.DoneButton}
                />
            </View>
        </View>
    );
};
