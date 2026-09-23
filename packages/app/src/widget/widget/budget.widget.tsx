import { Gauge, HStack, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
    containerBackground,
    font,
    foregroundStyle,
    frame,
    gaugeStyle,
    lineLimit,
    minimumScaleFactor,
    privacySensitive,
    tint,
    widgetURL
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import { WidgetNameEnum } from '../enum/widget-name.enum';

import type { WidgetBudgetSnapshotInterface } from '../interface/widget-budget-snapshot.interface';
import type { WidgetSnapshotStringsInterface } from '../interface/widget-snapshot-strings.interface';

interface Props {
    readonly isEmpty: boolean;
    readonly budget: WidgetBudgetSnapshotInterface;
    readonly strings: WidgetSnapshotStringsInterface;
    readonly budgetUrl: string;
}

const Budget = (props: Props, environment: WidgetEnvironment) => {
    'widget';

    const backgroundColor = environment.colorScheme === 'dark' ? 'black' : 'white';
    const accent = props.budget.isOverLimit ? 'red' : 'primary';
    const suffix = props.budget.isOverLimit ? props.strings.over : props.strings.left;
    const emphasis = [foregroundStyle('primary'), minimumScaleFactor(0.5), lineLimit(1), privacySensitive(true)];
    const style = {
        container: [
            containerBackground(backgroundColor, 'widget'),
            widgetURL(props.budgetUrl),
            frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'topLeading' })
        ],
        caption: [font({ size: 13 }), foregroundStyle('secondary')],
        remaining: [font({ size: 13, weight: 'semibold' }), ...emphasis],
        amounts: [font({ size: 19, weight: 'semibold' }), ...emphasis],
        detail: [font({ size: 11 }), foregroundStyle('secondary'), privacySensitive(true)],
        plain: [font({ size: 11 }), foregroundStyle('secondary')],
        pace: [font({ size: 11 }), foregroundStyle('secondary'), lineLimit(1), minimumScaleFactor(0.6), privacySensitive(true)],
        rowLabel: [font({ size: 12 }), foregroundStyle('secondary'), lineLimit(1)],
        percent: [font({ size: 12, weight: 'semibold' }), foregroundStyle(accent)],
        ringSmall: [frame({ width: 52, height: 52 })],
        ringMedium: [frame({ width: 48, height: 48 })],
        gauge: [gaugeStyle('circularCapacity'), tint(accent)]
    };

    if (props.isEmpty) {
        return (
            <VStack modifiers={style.container}>
                <Text modifiers={style.caption}>{props.strings.noBudget}</Text>
            </VStack>
        );
    }

    const ratio = Math.min(Math.max(props.budget.progressRatio, 0), 1);
    const categoryRows = props.budget.categories.map(category => ({
        title: category.title,
        percent: category.formattedProgress,
        modifiers: [font({ size: 12, weight: 'medium' }), foregroundStyle(category.isOverLimit ? 'red' : 'primary')]
    }));
    const ring = (
        <ZStack>
            <Gauge value={ratio} min={0} max={1} modifiers={style.gauge} />
            <Text modifiers={style.percent}>{props.budget.formattedProgress}</Text>
        </ZStack>
    );

    if (environment.widgetFamily === 'systemMedium') {
        return (
            <VStack alignment="leading" spacing={10} modifiers={style.container}>
                <HStack alignment="center" spacing={12}>
                    <VStack alignment="leading" spacing={3}>
                        <Text modifiers={style.caption}>{props.strings.budgetTitle}</Text>
                        <Text modifiers={style.amounts}>{`${props.budget.formattedSpent} / ${props.budget.formattedLimit}`}</Text>
                        <Text modifiers={style.pace}>
                            {`${props.budget.formattedSafePerDay} ${props.strings.perDay} · ${props.budget.formattedDaysLeft}`}
                        </Text>
                    </VStack>
                    <Spacer minLength={8} />
                    <VStack modifiers={style.ringMedium}>{ring}</VStack>
                </HStack>
                <VStack spacing={5}>
                    {categoryRows.map(row => (
                        <HStack key={row.title} spacing={6}>
                            <Text modifiers={style.rowLabel}>{row.title}</Text>
                            <Spacer />
                            <Text modifiers={row.modifiers}>{row.percent}</Text>
                        </HStack>
                    ))}
                </VStack>
                <Spacer />
            </VStack>
        );
    }

    return (
        <HStack alignment="top" spacing={12} modifiers={style.container}>
            <VStack alignment="leading" spacing={6}>
                <Text modifiers={style.caption}>{props.strings.budgetTitle}</Text>
                <Text modifiers={style.remaining}>{`${props.budget.formattedRemaining} ${suffix}`}</Text>
                <Text modifiers={style.detail}>{`${props.budget.formattedSafePerDay} ${props.strings.perDay}`}</Text>
                <Text modifiers={style.plain}>{props.budget.formattedDaysLeft}</Text>
                <Spacer />
            </VStack>
            <VStack modifiers={style.ringSmall}>{ring}</VStack>
        </HStack>
    );
};

export default createWidget(WidgetNameEnum.BUDGET, Budget);
