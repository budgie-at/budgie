import { HStack, Image, Link, Text, VStack } from '@expo/ui/swift-ui';
import {
    aspectRatio,
    background,
    containerBackground,
    cornerRadius,
    font,
    foregroundStyle,
    frame,
    lineLimit,
    minimumScaleFactor,
    padding,
    resizable,
    widgetURL
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import { WidgetNameEnum } from '../enum/widget-name.enum';

import type { WidgetLinksInterface } from '../interface/widget-links.interface';
import type { WidgetPaletteInterface } from '../interface/widget-palette.interface';
import type { WidgetSnapshotStringsInterface } from '../interface/widget-snapshot-strings.interface';

interface Props {
    readonly palette: WidgetPaletteInterface;
    readonly strings: WidgetSnapshotStringsInterface;
    readonly links: WidgetLinksInterface;
    readonly glyphPath: string;
}

const QuickAdd = (props: Props, environment: WidgetEnvironment) => {
    'widget';

    const colors = environment.colorScheme === 'dark' ? props.palette.dark : props.palette.light;
    const style = {
        container: [containerBackground(colors.background, 'widget'), widgetURL(props.links.expenseUrl)],
        tile: [frame({ maxWidth: Infinity, maxHeight: Infinity }), background(`${colors.secondary}1F`), cornerRadius(12)],
        logo: [frame({ maxWidth: Infinity, maxHeight: Infinity })],
        label: [font({ size: 11 }), foregroundStyle(colors.secondary), lineLimit(1), minimumScaleFactor(0.6)],
        glyph: [resizable(), aspectRatio({ contentMode: 'fit' }), foregroundStyle(colors.primary), padding({ all: 10 })]
    };
    const tiles = [
        { title: props.strings.expense, symbolName: 'minus.circle', destination: props.links.expenseUrl },
        { title: props.strings.income, symbolName: 'plus.circle', destination: props.links.incomeUrl },
        { title: props.strings.transfer, symbolName: 'arrow.left.arrow.right', destination: props.links.transferUrl }
    ] as const;
    const glyph =
        props.glyphPath === '' ? (
            <Image systemName="app.fill" size={22} color={colors.primary} />
        ) : (
            <Image uiImage={props.glyphPath} modifiers={style.glyph} />
        );

    return (
        <VStack spacing={6} modifiers={style.container}>
            <HStack spacing={6}>
                {tiles.slice(0, 2).map(tile => (
                    <Link key={tile.destination} destination={tile.destination}>
                        <VStack spacing={5} modifiers={style.tile}>
                            <Image systemName={tile.symbolName} size={19} color={colors.primary} />
                            <Text modifiers={style.label}>{tile.title}</Text>
                        </VStack>
                    </Link>
                ))}
            </HStack>
            <HStack spacing={6}>
                <Link destination={tiles[2].destination}>
                    <VStack spacing={5} modifiers={style.tile}>
                        <Image systemName={tiles[2].symbolName} size={19} color={colors.primary} />
                        <Text modifiers={style.label}>{tiles[2].title}</Text>
                    </VStack>
                </Link>
                <Link destination={props.links.homeUrl}>
                    <VStack modifiers={style.logo}>{glyph}</VStack>
                </Link>
            </HStack>
        </VStack>
    );
};

export default createWidget(WidgetNameEnum.QUICK_ADD, QuickAdd);
