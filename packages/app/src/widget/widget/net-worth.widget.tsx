import { HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
    containerBackground,
    font,
    foregroundStyle,
    lineLimit,
    minimumScaleFactor,
    privacySensitive,
    widgetURL
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { WidgetNetWorthSnapshotInterface } from '../interface/widget-net-worth-snapshot.interface';
import type { WidgetPaletteInterface } from '../interface/widget-palette.interface';
import type { WidgetRunwaySnapshotInterface } from '../interface/widget-runway-snapshot.interface';

interface Props {
    readonly netWorth: WidgetNetWorthSnapshotInterface | null;
    readonly runway: WidgetRunwaySnapshotInterface | null;
    readonly palette: WidgetPaletteInterface;
    readonly netWorthTitle: string;
    readonly thisMonth: string;
    readonly empty: string;
    readonly homeUrl: string;
}

const NetWorth = (props: Props, environment: WidgetEnvironment) => {
    'widget';

    const colors = environment.colorScheme === 'dark' ? props.palette.dark : props.palette.light;

    if (props.netWorth === null) {
        return (
            <VStack modifiers={[containerBackground(colors.background, 'widget'), widgetURL(props.homeUrl)]}>
                <Text modifiers={[font({ size: 13 }), foregroundStyle(colors.secondary)]}>{props.empty}</Text>
            </VStack>
        );
    }

    const deltaColor =
        props.netWorth.deltaDirection === 'UP'
            ? colors.positive
            : props.netWorth.deltaDirection === 'DOWN'
              ? colors.destructive
              : colors.secondary;

    return (
        <VStack
            alignment="leading"
            spacing={6}
            modifiers={[containerBackground(colors.background, 'widget'), widgetURL(props.homeUrl)]}
        >
            <Text modifiers={[font({ size: 13 }), foregroundStyle(colors.secondary)]}>{props.netWorthTitle}</Text>

            <Text
                modifiers={[
                    font({ size: 22, weight: 'semibold' }),
                    foregroundStyle(colors.primary),
                    minimumScaleFactor(0.6),
                    lineLimit(1),
                    privacySensitive(true)
                ]}
            >
                {props.netWorth.formattedTotal}
            </Text>

            <HStack spacing={4} modifiers={[privacySensitive(true)]}>
                <Text modifiers={[font({ size: 12 }), foregroundStyle(deltaColor)]}>{props.netWorth.formattedDelta}</Text>
                <Text modifiers={[font({ size: 12 }), foregroundStyle(colors.secondary)]}>{props.thisMonth}</Text>
            </HStack>

            {props.runway === null ? null : (
                <HStack spacing={4} modifiers={[privacySensitive(true)]}>
                    <Image
                        systemName={props.runway.isPositive ? 'chart.line.uptrend.xyaxis' : 'chart.line.downtrend.xyaxis'}
                        size={11}
                        color={props.runway.isPositive ? colors.positive : colors.warning}
                    />
                    <Text
                        modifiers={[
                            font({ size: 12, weight: 'medium' }),
                            foregroundStyle(props.runway.isPositive ? colors.positive : colors.warning),
                            minimumScaleFactor(0.6),
                            lineLimit(1)
                        ]}
                    >
                        {props.runway.label}
                    </Text>
                </HStack>
            )}

            <Spacer />
        </VStack>
    );
};

export default createWidget('NetWorth', NetWorth);
