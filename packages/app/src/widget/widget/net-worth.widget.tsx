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

import { WidgetDeltaDirectionEnum } from '../enum/widget-delta-direction.enum';
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

    if (props === undefined || props.palette === undefined) {
        return (
            <VStack modifiers={[containerBackground('#B00020', 'widget')]}>
                <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle('#FFFFFF')]}>no props</Text>
                <Text modifiers={[font({ size: 9 }), foregroundStyle('#FFFFFF')]}>
                    {Object.keys(props ?? {}).join(',')}
                </Text>
            </VStack>
        );
    }

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

const netWorthWidget = createWidget('NetWorth', NetWorth);

netWorthWidget.updateSnapshot({
    netWorth: {
        formattedTotal: '€1,234.56',
        formattedDelta: '+€78.90',
        deltaDirection: WidgetDeltaDirectionEnum.UP,
        accountTypes: []
    },
    runway: { isPositive: true, label: '+€309/mo' },
    palette: {
        light: {
            background: '#FFFFFF',
            primary: '#111111',
            secondary: '#7A7A7A',
            positive: '#1FA971',
            destructive: '#D92D20',
            warning: '#F79009'
        },
        dark: {
            background: '#000000',
            primary: '#FFFFFF',
            secondary: '#9A9A9A',
            positive: '#3DDC97',
            destructive: '#FF5A5F',
            warning: '#FDB022'
        }
    },
    netWorthTitle: 'Net worth',
    thisMonth: 'this month',
    empty: 'No data yet',
    homeUrl: 'budgie://'
});

export default netWorthWidget;
