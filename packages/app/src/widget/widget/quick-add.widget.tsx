import { HStack, Image, Link, Text, VStack } from '@expo/ui/swift-ui';
import {
    background,
    containerBackground,
    cornerRadius,
    font,
    foregroundStyle,
    frame,
    lineLimit,
    minimumScaleFactor,
    widgetURL
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import { WidgetNameEnum } from '../enum/widget-name.enum';

import type { WidgetLinksInterface } from '../interface/widget-links.interface';
import type { WidgetSnapshotStringsInterface } from '../interface/widget-snapshot-strings.interface';

interface Props {
    readonly strings: WidgetSnapshotStringsInterface;
    readonly links: WidgetLinksInterface;
}

const QuickAdd = (props: Props, environment: WidgetEnvironment) => {
    'widget';

    const backgroundColor = environment.colorScheme === 'dark' ? 'black' : 'white';
    const style = {
        container: [containerBackground(backgroundColor, 'widget'), widgetURL(props.links.homeUrl)],
        tile: [frame({ maxWidth: Infinity, maxHeight: Infinity }), background('#8080801F'), cornerRadius(14)],
        label: [font({ size: 12 }), foregroundStyle('secondary'), lineLimit(1), minimumScaleFactor(0.6)]
    };
    const tiles = [
        { title: props.strings.expense, symbolName: 'minus.circle', destination: props.links.expenseUrl },
        { title: props.strings.income, symbolName: 'plus.circle', destination: props.links.incomeUrl },
        { title: props.strings.transfer, symbolName: 'arrow.left.arrow.right', destination: props.links.transferUrl }
    ] as const;

    return (
        <HStack spacing={8} modifiers={style.container}>
            {tiles.map(tile => (
                <Link key={tile.destination} destination={tile.destination}>
                    <VStack spacing={6} modifiers={style.tile}>
                        <Image systemName={tile.symbolName} size={22} color="primary" />
                        <Text modifiers={style.label}>{tile.title}</Text>
                    </VStack>
                </Link>
            ))}
        </HStack>
    );
};

export default createWidget(WidgetNameEnum.QUICK_ADD, QuickAdd);
