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
    readonly deltaColorLight: string;
    readonly deltaColorDark: string;
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

    const deltaColor = environment.colorScheme === 'dark' ? props.deltaColorDark : props.deltaColorLight;

    const runwayColor = props.runway?.isPositive === true ? colors.positive : colors.warning;
    const runwaySymbol = props.runway?.isPositive === true ? 'chart.line.uptrend.xyaxis' : 'chart.line.downtrend.xyaxis';

    const title = <Text modifiers={[font({ size: 13 }), foregroundStyle(colors.secondary)]}>{props.netWorthTitle}</Text>;

    const total = (
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
    );

    const delta = (
        <HStack spacing={4} modifiers={[privacySensitive(true)]}>
            <Text modifiers={[font({ size: 12 }), foregroundStyle(deltaColor)]}>{props.netWorth.formattedDelta}</Text>
            <Text modifiers={[font({ size: 12 }), foregroundStyle(colors.secondary)]}>{props.thisMonth}</Text>
        </HStack>
    );

    const runway =
        props.runway === null ? null : (
            <HStack spacing={4} modifiers={[privacySensitive(true)]}>
                <Image systemName={runwaySymbol} size={11} color={runwayColor} />
                <Text
                    modifiers={[
                        font({ size: 12, weight: 'medium' }),
                        foregroundStyle(runwayColor),
                        minimumScaleFactor(0.6),
                        lineLimit(1)
                    ]}
                >
                    {props.runway.label}
                </Text>
            </HStack>
        );

    if (environment.widgetFamily === 'systemMedium') {
        return (
            <VStack
                alignment="leading"
                spacing={10}
                modifiers={[containerBackground(colors.background, 'widget'), widgetURL(props.homeUrl)]}
            >
                <HStack alignment="top" spacing={12}>
                    <VStack alignment="leading" spacing={3}>
                        {title}
                        {total}
                        {delta}
                    </VStack>
                    <Spacer minLength={8} />
                    {runway}
                </HStack>
                <VStack spacing={5}>
                    {props.netWorth.accountTypes.map(accountType => (
                        <HStack key={accountType.label} spacing={6}>
                            <Text modifiers={[font({ size: 11 }), foregroundStyle(colors.secondary), lineLimit(1)]}>
                                {accountType.label}
                            </Text>
                            <Spacer minLength={4} />
                            <Text
                                modifiers={[
                                    font({ size: 11, weight: 'medium' }),
                                    foregroundStyle(colors.primary),
                                    lineLimit(1),
                                    minimumScaleFactor(0.7),
                                    privacySensitive(true)
                                ]}
                            >
                                {accountType.formattedTotal}
                            </Text>
                        </HStack>
                    ))}
                </VStack>
                <Spacer />
            </VStack>
        );
    }

    return (
        <VStack
            alignment="leading"
            spacing={6}
            modifiers={[containerBackground(colors.background, 'widget'), widgetURL(props.homeUrl)]}
        >
            {title}
            {total}
            {runway}
            <Spacer />
        </VStack>
    );
};

export default createWidget('NetWorth', NetWorth);
