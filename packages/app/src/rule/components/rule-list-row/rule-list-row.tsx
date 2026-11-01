import { RuleActionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { TONAL_DISC_BACKGROUND } from '../../../@generic/constant/tonal-disc-background.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { RULE_ACTION_TYPE } from '../../constant/rule-action-type.constant';
import { useRuleRowSummary } from '../../hooks/use-rule-row-summary.hook';
import { RulesPageSelector } from '../../selector/rules-page.selector';
import { RuleListRowTrigger } from '../rule-list-row-trigger/rule-list-row-trigger';

import type { RuleWithActionsRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly rule: RuleWithActionsRelationsEntityInterface;
    readonly index: number;
    readonly isLast: boolean;
    readonly hasOverlap: boolean;
    readonly onOpen: (rule: RuleWithActionsRelationsEntityInterface) => void;
    readonly onToggle: (rule: RuleWithActionsRelationsEntityInterface, enabled: boolean) => void;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const RuleListRow = ({ rule, index, isLast, hasOverlap, onOpen, onToggle }: Props) => {
    const { t } = useLingui();
    const { primaryOutcome, secondaryOutcome, triggerPrefix, triggerValue, extraConditionsLabel, accessibilityLabel } =
        useRuleRowSummary(rule);
    const isFirst = index === 0;
    const firstAction = rule.actions.at(0);
    const actionMeta = RULE_ACTION_TYPE[firstAction?.type ?? RuleActionTypeEnum.SET_CATEGORY];
    const categoryIcon = firstAction?.type === RuleActionTypeEnum.SET_CATEGORY ? firstAction.category?.icon : null;
    const titleClassName = rule.enabled
        ? 'shrink text-[17px] font-semibold text-primary'
        : 'shrink text-[17px] font-semibold text-secondary-foreground';
    const containerClassName = cn('overflow-hidden', 'bg-surface-row', isFirst && 'rounded-t-3xl', isLast && 'rounded-b-3xl');
    const chipIcon = categoryIcon ?? actionMeta.icon;
    const pressableClassName = cn(
        'flex-1',
        'flex-row',
        'items-center',
        'gap-x-xl',
        'pl-3xl',
        'active:opacity-60',
        hasOverlap && 'min-h-[64px]',
        hasOverlap && 'py-md',
        !hasOverlap && 'h-[64px]'
    );

    const handleOpen = () => void onOpen(rule);
    const handleToggle = (enabled: boolean) => void onToggle(rule, enabled);

    return (
        <View className={containerClassName} style={CONTINUOUS_CORNERS}>
            {isFirst ? null : <View className="absolute top-0 right-0 left-[72px] h-hairline bg-surface-separator" pointerEvents="none" />}

            <View className="flex-row items-center">
                <HapticPressable
                    testID={RulesPageSelector.RuleCard(index)}
                    onPress={handleOpen}
                    accessibilityRole="button"
                    accessibilityLabel={accessibilityLabel}
                    accessibilityHint={t`Opens the rule editor`}
                    className={pressableClassName}
                >
                    <View className={cn(!rule.enabled && 'opacity-40')}>
                        <CircleIcon
                            icon={chipIcon}
                            variant={actionMeta.variant}
                            size={40}
                            iconSize={20}
                            radius={20}
                            border={false}
                            className={TONAL_DISC_BACKGROUND[actionMeta.variant]}
                        />
                    </View>

                    <View className="min-w-0 flex-1 gap-y-xxs">
                        <View testID={RulesPageSelector.RuleCardActions(index)} className="flex-row items-baseline">
                            <Text className={titleClassName} numberOfLines={1}>
                                {primaryOutcome}
                            </Text>
                            {isNotEmptyString(secondaryOutcome) ? (
                                <Text className="shrink-0 text-[17px] text-secondary-foreground" numberOfLines={1}>
                                    {secondaryOutcome}
                                </Text>
                            ) : null}
                        </View>
                        <RuleListRowTrigger
                            prefix={triggerPrefix}
                            value={triggerValue}
                            extraLabel={extraConditionsLabel}
                            testID={RulesPageSelector.RuleCardConditions(index)}
                        />
                        {hasOverlap ? (
                            <Text className="text-[13px] leading-[18px] text-warning-foreground" numberOfLines={1}>
                                {t`Same trigger as a rule above`}
                            </Text>
                        ) : null}
                    </View>
                </HapticPressable>

                <View className="pl-lg pr-3xl">
                    <ThemedSwitch
                        testID={RulesPageSelector.RuleCardEnabledSwitch(index)}
                        value={rule.enabled}
                        onValueChange={handleToggle}
                        accessibilityLabel={t`Enable rule: ${primaryOutcome}`}
                    />
                </View>
            </View>
        </View>
    );
};
