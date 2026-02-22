import { RuleActionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { SuggestRuleSelectors } from '../../../@e2e/selectors/suggest-rule.selector';
import { Button } from '../../../@generic/component/button/button';
import { Icon } from '../../../@generic/component/icon/icon';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { useGetTagByIdsQuery } from '../../../tag/query/use-get-tag-by-ids.query';
import { useCreateSuggestRule } from '../../hooks/use-create-suggest-rule.hook';
import { useHasConflictingRules } from '../../hooks/use-has-conflicting-rules.hook';
import { SuggestRuleDataInterface } from '../../interface/suggest-rule-data.interface';
import { RuleConflictWarning } from '../rule-conflict-warning/rule-conflict-warning';
import { RuleMatchingCount } from '../rule-matching-count/rule-matching-count';
import { SuggestRuleDescriptionContent } from '../suggest-rule-description-content/suggest-rule-description-content';

interface Props {
    readonly suggestRuleData: SuggestRuleDataInterface;
    readonly onDismiss: () => void;
    readonly onCreateRule: () => void;
}

export const SuggestRuleModalContent = ({ suggestRuleData, onDismiss, onCreateRule }: Props) => {
    const { category } = useGetCategoryByIdQuery(suggestRuleData.categoryId ?? 0);
    const { tags } = useGetTagByIdsQuery(suggestRuleData.tagIds);
    const hasConflict = useHasConflictingRules([RuleActionTypeEnum.SET_CATEGORY]);

    const { applyToExisting, setApplyToExisting, isBusy, progress, matchingCount, isCountLoading, selectedFields, handleCreate } =
        useCreateSuggestRule({ suggestRuleData, onCreateRule });

    const displayMatchingCount = matchingCount ?? 0;
    const buttonText = applyToExisting ? t`Create & update` : t`Create rule`;

    return (
        <View testID={SuggestRuleSelectors.Modal} className="flex-1 justify-between px-4xl pt-4xl pb-4xl gap-y-3xl">
            <View className="gap-y-3xl">
                <View className="flex-row items-center gap-x-md">
                    <Icon icon={UserIconNameEnum.Cog} size={20} className="text-primary" />
                    <Text className="text-primary font-medium text-xl">
                        <Trans>Quick rule</Trans>
                    </Text>
                </View>

                <View className="rounded-3xl bg-secondary-background p-4xl">
                    <SuggestRuleDescriptionContent
                        selectedFields={selectedFields}
                        suggestRuleData={suggestRuleData}
                        category={category ?? null}
                        tags={tags ?? null}
                    />
                </View>

                <View className="flex-row items-center justify-between gap-x-lg">
                    <View className="flex-1 gap-y-xxs">
                        <RuleMatchingCount count={displayMatchingCount} isLoading={isCountLoading} progress={progress} />
                    </View>
                    <ThemedSwitch
                        testID={SuggestRuleSelectors.ApplyToExistingToggle}
                        value={applyToExisting}
                        onValueChange={setApplyToExisting}
                    />
                </View>
                <RuleConflictWarning hasConflict={hasConflict} />
            </View>

            <View>
                <View className="flex-row gap-x-md">
                    <Button className="flex-1" variant="ghost" onPress={onDismiss} disabled={isBusy} content={t`Cancel`} />
                    <Button
                        testID={SuggestRuleSelectors.CreateRuleButton}
                        className="flex-1"
                        content={buttonText}
                        variant="cta"
                        onPress={handleCreate}
                        disabled={isBusy}
                        isLoading={isBusy}
                    />
                </View>
            </View>
        </View>
    );
};
