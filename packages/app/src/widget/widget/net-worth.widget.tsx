import { HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
    containerBackground,
    frame,
    font,
    foregroundStyle,
    lineLimit,
    minimumScaleFactor,
    privacySensitive,
    widgetURL
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import { WidgetNameEnum } from '../enum/widget-name.enum';

import type { WidgetNetWorthSnapshotInterface } from '../interface/widget-net-worth-snapshot.interface';
import type { WidgetRunwaySnapshotInterface } from '../interface/widget-runway-snapshot.interface';
import type { WidgetSnapshotStringsInterface } from '../interface/widget-snapshot-strings.interface';

interface Props {
    readonly isEmpty: boolean;
    readonly netWorth: WidgetNetWorthSnapshotInterface;
    readonly runway: WidgetRunwaySnapshotInterface;
    readonly strings: WidgetSnapshotStringsInterface;
    readonly homeUrl: string;
}

const NetWorth = (props: Props, environment: WidgetEnvironment) => {
    'widget';

    const backgroundColor = environment.colorScheme === 'dark' ? 'black' : 'white';
    const runwayColor = props.runway.isPositive ? 'green' : 'orange';
    const runwaySymbol = props.runway.isPositive ? 'chart.line.uptrend.xyaxis' : 'chart.line.downtrend.xyaxis';
    const style = {
        container: [
            containerBackground(backgroundColor, 'widget'),
            widgetURL(props.homeUrl),
            frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'topLeading' })
        ],
        caption: [font({ size: 13 }), foregroundStyle('secondary')],
        total: [
            font({ size: 22, weight: 'semibold' }),
            foregroundStyle('primary'),
            minimumScaleFactor(0.6),
            lineLimit(1),
            privacySensitive(true)
        ],
        delta: [font({ size: 12 }), foregroundStyle(props.netWorth.deltaColor)],
        detail: [font({ size: 12 }), foregroundStyle('secondary')],
        sensitive: [privacySensitive(true)],
        runway: [font({ size: 12, weight: 'medium' }), foregroundStyle(runwayColor), minimumScaleFactor(0.6), lineLimit(1)],
        rowLabel: [font({ size: 11 }), foregroundStyle('secondary'), lineLimit(1)],
        rowValue: [font({ size: 11, weight: 'medium' }), foregroundStyle('primary'), lineLimit(1), privacySensitive(true)]
    };

    if (props.isEmpty) {
        return (
            <VStack modifiers={style.container}>
                <Text modifiers={style.caption}>{props.strings.empty}</Text>
            </VStack>
        );
    }

    const title = <Text modifiers={style.caption}>{props.strings.netWorthTitle}</Text>;
    const total = <Text modifiers={style.total}>{props.netWorth.formattedTotal}</Text>;
    const delta = (
        <HStack spacing={4} modifiers={style.sensitive}>
            <Text modifiers={style.delta}>{props.netWorth.formattedDelta}</Text>
            <Text modifiers={style.detail}>{props.strings.thisMonth}</Text>
        </HStack>
    );
    const runway =
        props.runway.label === '' ? null : (
            <HStack spacing={4} modifiers={style.sensitive}>
                <Image systemName={runwaySymbol} size={11} color={runwayColor} />
                <Text modifiers={style.runway}>{props.runway.label}</Text>
            </HStack>
        );

    if (environment.widgetFamily === 'systemMedium') {
        return (
            <VStack alignment="leading" spacing={10} modifiers={style.container}>
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
                            <Text modifiers={style.rowLabel}>{accountType.label}</Text>
                            <Spacer minLength={4} />
                            <Text modifiers={style.rowValue}>{accountType.formattedTotal}</Text>
                        </HStack>
                    ))}
                </VStack>
                <Spacer />
            </VStack>
        );
    }

    return (
        <VStack alignment="leading" spacing={6} modifiers={style.container}>
            {title}
            {total}
            {runway}
            <Spacer />
        </VStack>
    );
};

export default createWidget(WidgetNameEnum.NET_WORTH, NetWorth);
