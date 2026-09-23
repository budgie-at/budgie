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

import type { WidgetPaletteInterface } from '../interface/widget-palette.interface';

interface Props {
    readonly palette: WidgetPaletteInterface;
    readonly expense: string;
    readonly income: string;
    readonly transfer: string;
    readonly expenseUrl: string;
    readonly incomeUrl: string;
    readonly transferUrl: string;
    readonly homeUrl: string;
    readonly glyphPath: string;
}

const QuickAdd = (props: Props, environment: WidgetEnvironment) => {
    'widget';

    const colors = environment.colorScheme === 'dark' ? props.palette.dark : props.palette.light;
    const tileBackground = `${colors.secondary}1F`;
    const fill = Infinity;

    const tiles = [
        { title: props.expense, symbolName: 'minus.circle', destination: props.expenseUrl },
        { title: props.income, symbolName: 'plus.circle', destination: props.incomeUrl },
        { title: props.transfer, symbolName: 'arrow.left.arrow.right', destination: props.transferUrl }
    ] as const;

    let glyph = <Image systemName="app.fill" size={22} color={colors.primary} />;
    if (props.glyphPath !== '') {
        glyph = <Image uiImage={props.glyphPath} size={28} color={colors.primary} />;
    }

    return (
        <VStack
            spacing={6}
            modifiers={[containerBackground(colors.background, 'widget'), widgetURL(props.expenseUrl)]}
        >
            <HStack spacing={6}>
                {tiles.slice(0, 2).map(tile => (
                    <Link key={tile.destination} destination={tile.destination}>
                        <VStack
                            spacing={5}
                            modifiers={[frame({ maxWidth: fill, maxHeight: fill }), background(tileBackground), cornerRadius(12)]}
                        >
                            <Image systemName={tile.symbolName} size={19} color={colors.primary} />
                            <Text modifiers={[font({ size: 11 }), foregroundStyle(colors.secondary), lineLimit(1), minimumScaleFactor(0.7)]}>
                                {tile.title}
                            </Text>
                        </VStack>
                    </Link>
                ))}
            </HStack>
            <HStack spacing={6}>
                <Link destination={tiles[2].destination}>
                    <VStack
                        spacing={5}
                        modifiers={[frame({ maxWidth: fill, maxHeight: fill }), background(tileBackground), cornerRadius(12)]}
                    >
                        <Image systemName={tiles[2].symbolName} size={19} color={colors.primary} />
                        <Text modifiers={[font({ size: 11 }), foregroundStyle(colors.secondary), lineLimit(1), minimumScaleFactor(0.7)]}>
                            {tiles[2].title}
                        </Text>
                    </VStack>
                </Link>
                <Link destination={props.homeUrl}>
                    <VStack modifiers={[frame({ maxWidth: fill, maxHeight: fill })]}>{glyph}</VStack>
                </Link>
            </HStack>
        </VStack>
    );
};

export default createWidget('QuickAdd', QuickAdd);
