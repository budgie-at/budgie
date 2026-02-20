import { RuleConditionFieldEnum, RuleConditionMatchTypeEnum, RuleConditionOperatorEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { SuggestRuleSelectors } from '../../../@e2e/selectors/suggest-rule.selector';
import { Button } from '../../../@generic/component/button/button';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { useMatchingTransactions } from '../../hooks/use-matching-transactions.hook';
import { SuggestRuleDataInterface } from '../../interface/suggest-rule-data.interface';
import { ruleEngineService } from '../../service/rule-engine.service';
import { ruleService } from '../../service/rule.service';
import { buildRuleInputFromPrefill } from '../../util/build-rule-input-from-prefill.util';
import { getSuggestRuleFieldValue } from '../../util/get-suggest-rule-field-value.util';
import { MatchingTransactionList } from '../matching-transaction-list/matching-transaction-list';

type SuggestRuleConditionField = RuleConditionFieldEnum.TITLE | RuleConditionFieldEnum.COMMENT | RuleConditionFieldEnum.MCC_CODE;

interface ProgressState {
    readonly processed: number;
    readonly total: number;
}

interface Props {
    readonly suggestRuleData: SuggestRuleDataInterface;
    readonly selectedFields: SuggestRuleConditionField[];
    readonly onCreateRule: () => void;
    readonly onBack: () => void;
}

// eslint-disable-next-line max-lines-per-function, max-statements -- Apply modal with matching transactions, toggle, and rule creation
export const SuggestRuleApplyModalContent = (props: Props) => {
    const { suggestRuleData, selectedFields, onCreateRule, onBack } = props;

    const { bottom } = useSafeAreaInsets();

    const [applyToExisting, setApplyToExisting] = useState(false);
    const [transactionLimit, setTransactionLimit] = useState<number | undefined>();
    const [isCreating, setIsCreating] = useState(false);
    const [isApplying, setIsApplying] = useState(false);
    const [progress, setProgress] = useState<ProgressState | null>(null);

    const conditions = selectedFields.flatMap(field => {
        const value = getSuggestRuleFieldValue(field, suggestRuleData);

        if (!isDefined(value)) {
            return [];
        }

        return { field, operator: RuleConditionOperatorEnum.CONTAINS, value, secondaryValue: null };
    });

    const {
        transactions: matchingTransactions,
        count: matchingCount,
        isLoading: isCountLoading
    } = useMatchingTransactions({
        conditions,
        conditionMatchType: RuleConditionMatchTypeEnum.ALL,
        enabled: selectedFields.length > 0,
        ...(isDefined(transactionLimit) && { limit: transactionLimit })
    });

    const handleCreateRule = async () => {
        setIsCreating(true);
        try {
            const prefillData = {
                conditions: selectedFields.flatMap(field => {
                    const value = getSuggestRuleFieldValue(field, suggestRuleData);

                    return isDefined(value) ? { field, value } : [];
                }),
                categoryId: suggestRuleData.categoryId,
                tagIds: suggestRuleData.tagIds,
                applyToExisting
            };

            const input = buildRuleInputFromPrefill(prefillData);
            const rule = await ruleService.create(input);

            if (applyToExisting) {
                setIsApplying(true);
                const handleProgress = (processed: number, total: number) => {
                    setProgress({ processed, total });
                };
                await ruleEngineService.applyRuleToMatchingTransactions(rule.id, handleProgress);
                setIsApplying(false);
            }

            onCreateRule();
        } catch (error: unknown) {
            Toast.show({
                type: 'error',
                text1: t`Could not create rule`,
                text2: getErrorMessage(error)
            });
        } finally {
            setIsCreating(false);
            setIsApplying(false);
            setProgress(null);
        }
    };

    const isBusy = isCreating || isApplying;
    const displayMatchingCount = matchingCount ?? 0;
    const processed = progress?.processed ?? 0;
    const total = progress?.total ?? 0;
    const buttonText = applyToExisting ? t`Create & update` : t`Create Rule`;
    const handleCreate = () => void handleCreateRule();

    const handleShowAllTransactions = () => {
        const totalCount = matchingCount ?? 0;
        setTransactionLimit(totalCount);
    };
    const footerStyle = { paddingBottom: bottom };

    const countDisplay = isCountLoading ? (
        <View className="flex-row items-center gap-x-sm">
            <ActivityIndicator size="small" />
            <Text className="text-sm text-secondary-foreground">
                <Trans>Checking transactions...</Trans>
            </Text>
        </View>
    ) : (
        <>
            <Text className="text-sm text-primary font-medium">
                <Trans>{displayMatchingCount} matching transactions</Trans>
            </Text>
            <Text className="text-xs text-secondary-foreground">
                <Trans>Update them too?</Trans>
            </Text>
        </>
    );

    const progressDisplay = isDefined(progress) ? (
        <View className="flex-row items-center justify-center gap-x-sm">
            <ActivityIndicator size="small" />
            <Text className="text-sm text-secondary-foreground">
                <Trans>
                    Updating {processed}/{total}...
                </Trans>
            </Text>
        </View>
    ) : null;

    return (
        /* jscpd:ignore-start - FormSheet suggest-rule modal layout pattern */
        <View className="flex-1">
            <ScrollView
                testID={SuggestRuleSelectors.Modal}
                className="flex-1"
                contentContainerClassName="px-xl pt-4xl pb-xl gap-y-lg"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Text className="text-primary font-medium text-xl">
                    <Trans>Quick rule</Trans>
                </Text>
                {/* jscpd:ignore-end */}
                <View className="flex-row items-center justify-between gap-x-lg">
                    <View className="flex-1 gap-y-xxs">{countDisplay}</View>
                    <ThemedSwitch
                        testID={SuggestRuleSelectors.ApplyToExistingToggle}
                        value={applyToExisting}
                        onValueChange={setApplyToExisting}
                    />
                </View>
                <MatchingTransactionList
                    transactions={matchingTransactions}
                    totalCount={displayMatchingCount}
                    onShowAll={handleShowAllTransactions}
                />
            </ScrollView>

            <View className="px-xl pb-xl gap-y-md" style={footerStyle}>
                {progressDisplay}
                <View className="flex-row gap-x-md">
                    <Button className="flex-1" variant="ghost" onPress={onBack} disabled={isBusy} content={t`Back`} />
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
