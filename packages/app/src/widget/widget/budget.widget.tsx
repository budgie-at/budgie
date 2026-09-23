import { Gauge, HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
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

import type { WidgetBudgetSnapshotInterface } from '../interface/widget-budget-snapshot.interface';
import type { WidgetPaletteInterface } from '../interface/widget-palette.interface';

interface Props {
    readonly budget: WidgetBudgetSnapshotInterface | null;
    readonly palette: WidgetPaletteInterface;
    readonly budgetTitle: string;
    readonly perDay: string;
    readonly left: string;
    readonly over: string;
    readonly noBudget: string;
    readonly budgetUrl: string;
}

const Budget = (props: Props, environment: WidgetEnvironment) => {
    'widget';

    const colors = environment.colorScheme === 'dark' ? props.palette.dark : props.palette.light;

    if (props.budget === null) {
        return (
            <VStack modifiers={[containerBackground(colors.background, 'widget'), widgetURL(props.budgetUrl)]}>
                <Text modifiers={[font({ size: 13 }), foregroundStyle(colors.secondary)]}>{props.noBudget}</Text>
            </VStack>
        );
    }

    const accent = props.budget.isOverLimit ? colors.destructive : colors.primary;
    const ratio = Math.min(Math.max(props.budget.progressRatio, 0), 1);
    const percent = `${Math.round(props.budget.progressRatio * 100)}%`;
    const suffix = props.budget.isOverLimit ? props.over : props.left;
    const remainingText = `${props.budget.formattedRemaining} ${suffix}`;
    const paceText = `${props.budget.formattedSafePerDay} ${props.perDay} · ${props.budget.formattedDaysLeft}`;
    const categoryRows = props.budget.categories.map(category => ({
        title: category.title,
        percent: `${Math.round(category.progressRatio * 100)}%`,
        color: category.isOverLimit ? colors.destructive : colors.primary
    }));

    const ring = (
        <Gauge
            value={ratio}
            min={0}
            max={1}
            currentValueLabel={
                <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle(accent)]}>{percent}</Text>
            }
            modifiers={[gaugeStyle('circularCapacity'), tint(accent)]}
        />
    );

    const title = <Text modifiers={[font({ size: 13 }), foregroundStyle(colors.secondary)]}>{props.budgetTitle}</Text>;

    if (environment.widgetFamily === 'systemMedium') {
        return (
            <VStack
                alignment="leading"
                spacing={10}
                modifiers={[containerBackground(colors.background, 'widget'), widgetURL(props.budgetUrl)]}
            >
                <HStack alignment="center" spacing={12}>
                    <VStack alignment="leading" spacing={3}>
                        {title}
                        <Text
                            modifiers={[
                                font({ size: 19, weight: 'semibold' }),
                                foregroundStyle(colors.primary),
                                minimumScaleFactor(0.5),
                                lineLimit(1),
                                privacySensitive(true)
                            ]}
                        >
                            {`${props.budget.formattedSpent} / ${props.budget.formattedLimit}`}
                        </Text>
                        <Text
                            modifiers={[
                                font({ size: 11 }),
                                foregroundStyle(colors.secondary),
                                lineLimit(1),
                                minimumScaleFactor(0.7),
                                privacySensitive(true)
                            ]}
                        >
                            {paceText}
                        </Text>
                    </VStack>
                    <Spacer minLength={8} />
                    <VStack modifiers={[frame({ width: 48, height: 48 })]}>{ring}</VStack>
                </HStack>
                <VStack spacing={5}>
                    {categoryRows.map(row => (
                        <HStack key={row.title} spacing={6}>
                            <Text modifiers={[font({ size: 12 }), foregroundStyle(colors.secondary), lineLimit(1)]}>
                                {row.title}
                            </Text>
                            <Spacer />
                            <Text modifiers={[font({ size: 12, weight: 'medium' }), foregroundStyle(row.color)]}>
                                {row.percent}
                            </Text>
                        </HStack>
                    ))}
                </VStack>
                <Spacer />
            </VStack>
        );
    }

    return (
        <HStack
            alignment="top"
            spacing={12}
            modifiers={[containerBackground(colors.background, 'widget'), widgetURL(props.budgetUrl)]}
        >
            <VStack alignment="leading" spacing={6}>
                {title}
                <Text
                    modifiers={[
                        font({ size: 13, weight: 'semibold' }),
                        foregroundStyle(colors.primary),
                        minimumScaleFactor(0.5),
                        lineLimit(1),
                        privacySensitive(true)
                    ]}
                >
                    {remainingText}
                </Text>
                <Text modifiers={[font({ size: 11 }), foregroundStyle(colors.secondary), privacySensitive(true)]}>
                    {`${props.budget.formattedSafePerDay} ${props.perDay}`}
                </Text>
                <Text modifiers={[font({ size: 11 }), foregroundStyle(colors.secondary)]}>
                    {props.budget.formattedDaysLeft}
                </Text>
                <Spacer />
            </VStack>
            <VStack modifiers={[frame({ width: 52, height: 52 })]}>{ring}</VStack>
        </HStack>
    );
};

export default createWidget('Budget', Budget);
