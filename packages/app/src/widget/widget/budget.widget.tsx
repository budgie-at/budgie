/* eslint-disable max-lines, max-lines-per-function, max-statements, complexity -- expo-widgets serializes the 'widget' function into the extension, so the whole layout must stay in one self-contained function (approved by liaugust) */
import { Capsule, Circle, HStack, Image, Rectangle, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
    background,
    clipShape,
    containerBackground,
    fixedSize,
    font,
    foregroundStyle,
    frame,
    lineLimit,
    layoutPriority,
    minimumScaleFactor,
    monospacedDigit,
    multilineTextAlignment,
    accessibilityElement,
    accessibilityLabel,
    offset,
    opacity,
    padding,
    privacySensitive,
    shapes,
    widgetURL
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import { WidgetNameEnum } from '../enum/widget-name.enum';

import type { WidgetBarOptionsInterface } from '../interface/widget-bar-options.interface';
import type { WidgetBudgetSnapshotInterface } from '../interface/widget-budget-snapshot.interface';
import type { WidgetSnapshotStringsInterface } from '../interface/widget-snapshot-strings.interface';

interface Props {
    readonly isEmpty: boolean;
    readonly budget: WidgetBudgetSnapshotInterface;
    readonly strings: WidgetSnapshotStringsInterface;
    readonly budgetUrl: string;
    readonly createBudgetUrl: string;
}

const Budget = (props: Props, environment: WidgetEnvironment) => {
    'widget';

    const isDark = environment.colorScheme === 'dark';
    const isAccented = environment.widgetRenderingMode === 'accented';
    const isMedium = environment.widgetFamily === 'systemMedium';
    const metric = {
        cellCount: 40,
        minimumOverflowCells: 1,
        onPaceTolerance: 0.0125,
        labelEdgeCells: 5,
        labelCellWidth: 3.5,
        limitLabelEdgeCells: 6,
        tickOverhang: 6,
        labelLift: 6,
        categoryBarWidth: 150,
        categoryBarHeight: 5,
        minimumOverflowWidth: 6,
        sideColumnWidth: 150,
        barHeight: 6,
        barSlotHeight: 12,
        tightScale: 0.85,
        categoryTitleScale: 0.9,
        maskedBarOpacity: 0.45,
        skeletonOpacity: 0.25,
        reservedOpacity: 0.3,
        accentedReservedOpacity: 0.5,
        darkWithinLimitOpacity: 0.35,
        darkPaceFaintOpacity: 0.4,
        lightPaceFaintOpacity: 0.55,
        accentedTrackOpacity: 0.15,
        smallDiscOpacity: 0.16,
        mediumDiscOpacity: 0.12,
        mediumDiscSize: 64,
        perDayInlineLength: 10,
        heroScale: 0.7,
        projectedSkeletonWidth: 64,
        averageSkeletonWidth: 44,
        noteSkeletonWidth: 84
    };
    const themedColor = (accented: string, dark: string, light: string) => {
        if (isAccented) {
            return accented;
        }

        return isDark ? dark : light;
    };
    const themedOpacity = (accented: number, dark: number, light: number) => {
        if (isAccented) {
            return accented;
        }

        return isDark ? dark : light;
    };
    const fill = {
        positive: isDark ? '#30D158' : '#10B981',
        warning: '#F0B100',
        destructive: isDark ? '#FF453A' : '#EF4444'
    };
    const ink = {
        positive: isDark ? '#30D158' : '#047857',
        warning: isDark ? '#F0B100' : '#9A6700',
        destructive: isDark ? '#FF5A4F' : '#DC2626'
    };
    const statusSymbol = {
        positive: 'checkmark.circle.fill',
        warning: 'exclamationmark.circle.fill',
        destructive: 'exclamationmark.triangle.fill'
    } as const;
    const accentedOpacity = { positive: 0.7, warning: 1, destructive: 1 };
    const backgroundColor = isDark ? '#1C1C1E' : 'white';
    const trackColor = themedColor('white', '#3A3A3C', '#E5E5EA');
    const trackOpacity = isAccented ? metric.accentedTrackOpacity : 1;
    const overFaintOpacity = isAccented ? 0.5 : 0.35;
    const withinLimitOpacity = themedOpacity(overFaintOpacity, metric.darkWithinLimitOpacity, 1);
    const lightWithinLimitColor = '#F4C2BE';
    const paceFaintOpacity = themedOpacity(0.5, metric.darkPaceFaintOpacity, metric.lightPaceFaintOpacity);
    const secondaryInk = themedColor('secondary', '#A1A1A6', '#6B6B70');
    const fillColor = (key: keyof typeof fill) => (isAccented ? 'white' : fill[key]);
    const inkColor = (key: keyof typeof ink) => (isAccented ? 'white' : ink[key]);
    const toneOpacity = (key: keyof typeof fill) => (isAccented ? accentedOpacity[key] : 1);
    const withinLimitColor = (color: string) => (isAccented || isDark ? color : lightWithinLimitColor);
    const flexibleFrame = (height: number) => frame({ minWidth: 0, maxWidth: Infinity, minHeight: height, maxHeight: height });
    const style = {
        capsuleClip: [clipShape('capsule')],
        markerLabel: (labelOffset: ReturnType<typeof offset>) => [
            font({ size: 11, weight: 'semibold' }),
            foregroundStyle(secondaryInk),
            fixedSize(),
            labelOffset
        ],
        cell: (color: string, height: number, cellOpacity: number) => [foregroundStyle(color), opacity(cellOpacity), flexibleFrame(height)],
        gap: (height: number) => [foregroundStyle('clear'), frame({ width: 2, height })],
        column: (height: number, alignment: 'leading' | 'trailing' | 'center') => [
            frame({ minWidth: 0, maxWidth: Infinity, minHeight: height, maxHeight: height, alignment })
        ],
        tickHalo: (height: number, shift: number) => [
            foregroundStyle(backgroundColor),
            frame({ width: 4, height }),
            offset({ x: 2 * shift })
        ],
        tick: (height: number, shift: number) => [foregroundStyle('primary'), frame({ width: 2, height }), offset({ x: shift })],
        segment: (color: string, segmentOpacity: number, width: number) => [
            foregroundStyle(color),
            opacity(segmentOpacity),
            frame({ width, height: metric.categoryBarHeight })
        ],
        cta: [
            font({ size: 14, weight: 'semibold' }),
            foregroundStyle(isDark ? 'black' : 'white'),
            lineLimit(1),
            minimumScaleFactor(0.8),
            padding({ horizontal: 14, vertical: 7 }),
            background(isDark ? 'white' : 'black', shapes.capsule())
        ],
        disc: (discOpacity: number, size: number) => [
            foregroundStyle(fillColor('positive')),
            opacity(discOpacity),
            frame({ width: size, height: size })
        ],
        emptyTitle: [
            font({ size: isMedium ? 17 : 15, weight: 'semibold' }),
            foregroundStyle('primary'),
            lineLimit(2),
            minimumScaleFactor(metric.tightScale),
            multilineTextAlignment(isMedium ? 'leading' : 'center')
        ],
        emptySubtitle: [font({ size: 13, weight: 'medium' }), foregroundStyle(secondaryInk), lineLimit(2), padding({ top: 4 })],
        emptyText: [frame({ maxWidth: Infinity, alignment: 'leading' })],
        emptyAction: [padding({ top: 12 })],
        statusRow: [frame({ height: 18, alignment: 'leading' })],
        statusIcon: (iconOpacity: number) => [opacity(iconOpacity), frame({ width: 16, height: 16 })],
        statusLabel: [font({ size: 13, weight: 'semibold' }), foregroundStyle('primary'), lineLimit(1), minimumScaleFactor(0.8)],
        hero: (color: string) => [
            font({ size: 34, weight: 'bold', design: 'rounded' }),
            foregroundStyle(color),
            lineLimit(1),
            minimumScaleFactor(metric.heroScale),
            privacySensitive(true),
            frame({ height: 41, alignment: 'leading' })
        ],
        caption: (lines: number) => [
            font({ size: 13, weight: 'medium' }),
            foregroundStyle(secondaryInk),
            lineLimit(lines),
            minimumScaleFactor(0.75),
            privacySensitive(true)
        ],
        emphasis: (scale: number) => [
            font({ size: 12, weight: 'semibold' }),
            monospacedDigit(),
            foregroundStyle('primary'),
            lineLimit(1),
            minimumScaleFactor(scale),
            layoutPriority(1),
            privacySensitive(true)
        ],
        emphasisLine: [
            font({ size: 12, weight: 'semibold' }),
            monospacedDigit(),
            foregroundStyle('primary'),
            lineLimit(1),
            fixedSize(),
            privacySensitive(true)
        ],
        detail: (scale: number) => [
            font({ size: 12, weight: 'medium' }),
            foregroundStyle(secondaryInk),
            lineLimit(1),
            minimumScaleFactor(scale)
        ],
        detailLine: [font({ size: 11, weight: 'medium' }), foregroundStyle(secondaryInk), lineLimit(1)],
        reserved: [
            font({ size: 11, weight: 'medium' }),
            foregroundStyle(secondaryInk),
            lineLimit(1),
            minimumScaleFactor(metric.tightScale),
            padding({ top: 2 })
        ],
        spacerGap: [foregroundStyle('clear'), frame({ height: 6 })],
        summary: [frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'topLeading' })],
        barSlot: (slotOpacity: number) => [opacity(slotOpacity), frame({ height: metric.barSlotHeight })],
        skeleton: (width: number, height: number, lineHeight: number) => [
            foregroundStyle(secondaryInk),
            opacity(metric.skeletonOpacity),
            frame({ width, height }),
            frame({ height: lineHeight, alignment: 'leading' })
        ],
        sideColumn: (bottomPadding: number) => [
            frame({ width: metric.sideColumnWidth, alignment: 'leading' }),
            frame({ maxHeight: Infinity, alignment: 'topLeading' }),
            padding({ bottom: bottomPadding })
        ],
        sideHeader: [
            font({ size: 12, weight: 'semibold' }),
            foregroundStyle(secondaryInk),
            lineLimit(1),
            minimumScaleFactor(metric.tightScale),
            frame({ height: 18, alignment: 'leading' })
        ],
        statBlock: (index: number) => [padding({ top: index === 0 ? 0 : 12 })],
        statLabel: [
            font({ size: 12, weight: 'medium' }),
            foregroundStyle(secondaryInk),
            lineLimit(1),
            minimumScaleFactor(metric.tightScale)
        ],
        statValue: (index: number) => [
            font({ size: index === 0 ? 17 : 13, weight: 'semibold', design: 'rounded' }),
            foregroundStyle('primary'),
            lineLimit(1),
            minimumScaleFactor(0.8),
            privacySensitive(true)
        ],
        statNote: (color: string) => [
            font({ size: 12, weight: 'medium' }),
            foregroundStyle(color),
            lineLimit(1),
            minimumScaleFactor(0.8),
            privacySensitive(true)
        ],
        categoriesHeaderRow: [frame({ height: 18 })],
        categoriesTitle: [
            font({ size: 12, weight: 'semibold' }),
            foregroundStyle(secondaryInk),
            lineLimit(1),
            minimumScaleFactor(metric.tightScale),
            layoutPriority(1)
        ],
        categoryTitle: [font({ size: 12 }), foregroundStyle('primary'), lineLimit(1), minimumScaleFactor(metric.categoryTitleScale)],
        categoryProgress: (tone: keyof typeof ink) => [
            font({ size: 12, weight: 'semibold' }),
            monospacedDigit(),
            foregroundStyle(tone === 'positive' ? secondaryInk : inkColor(tone)),
            privacySensitive(true)
        ],
        toneOpacity: (tone: keyof typeof fill) => [opacity(toneOpacity(tone))]
    };

    const cell = (key: string, color: string, height: number, cellOpacity: number) => (
        <Rectangle key={key} modifiers={style.cell(color, height, cellOpacity)} />
    );

    const markerRow = (height: number, markerIndex: number, label: string, labelOffset: ReturnType<typeof offset>) => (
        <HStack spacing={0}>
            {Array.from({ length: metric.cellCount }, (_cell, index) => (
                <ZStack key={`label-${index}`} modifiers={style.column(height, 'center')}>
                    {index === markerIndex ? <Text modifiers={style.markerLabel(labelOffset)}>{label}</Text> : null}
                </ZStack>
            ))}
        </HStack>
    );

    const limitBar = (color: string, height: number, limitRatio: number, tickLabel: string | null) => {
        const overCells = Math.max(metric.minimumOverflowCells, Math.round((1 - limitRatio) * metric.cellCount));
        const limitIndex = metric.cellCount - overCells;
        const limitTrack = (
            <HStack spacing={0} modifiers={style.capsuleClip}>
                {Array.from({ length: limitIndex }, (_cell, index) =>
                    cell(`within-${index}`, withinLimitColor(color), height, withinLimitOpacity)
                )}
                <Rectangle modifiers={style.gap(height)} />
                {Array.from({ length: overCells }, (_cell, index) => cell(`over-${index}`, color, height, 1))}
            </HStack>
        );

        if (tickLabel === null) {
            return limitTrack;
        }

        const labelHeight = height + metric.tickOverhang;
        const labelShift = -Math.max(0, limitIndex - (metric.cellCount - metric.limitLabelEdgeCells)) * metric.labelCellWidth;

        return (
            <ZStack>
                {limitTrack}
                {markerRow(labelHeight, limitIndex, tickLabel, offset({ x: labelShift, y: -(labelHeight / 2 + metric.labelLift) }))}
            </ZStack>
        );
    };

    const bar = (ratio: number, color: string, height: number, options: WidgetBarOptionsInterface) => {
        if (options.limitRatio !== null) {
            return limitBar(color, height, options.limitRatio, options.tickLabel);
        }

        const { cellCount } = metric;
        const clampedRatio = Math.min(Math.max(ratio, 0), 1);
        const flooredCells = Math.floor(clampedRatio * cellCount);
        const tickIndex = options.tickRatio === null ? -1 : Math.min(cellCount, Math.max(0, Math.round(options.tickRatio * cellCount)));
        const isNearPace = options.tickRatio !== null && Math.abs(clampedRatio - options.tickRatio) <= metric.onPaceTolerance;
        const isUnderPace = options.tickRatio !== null && clampedRatio < options.tickRatio;
        const pacedCells = isUnderPace ? Math.min(flooredCells, tickIndex - 1) : Math.max(Math.round(clampedRatio * cellCount), tickIndex);
        const tickedCells = isNearPace && !options.isPaceSplit ? tickIndex : pacedCells;
        const filledCells = tickIndex < 0 ? flooredCells : tickedCells;
        const reservedCells = Math.min(cellCount, filledCells + Math.round(options.reservedRatio * cellCount));
        const fractionalOpacity = tickIndex < 0 ? clampedRatio * cellCount - flooredCells : 0;
        const reservedOpacity = isAccented ? metric.accentedReservedOpacity : metric.reservedOpacity;

        const cellAt = (index: number) => {
            if (tickIndex < 0 && index === filledCells && fractionalOpacity > 0) {
                return cell(`cell-${index}`, color, height, fractionalOpacity);
            }

            if (index >= reservedCells) {
                return cell(`cell-${index}`, trackColor, height, trackOpacity);
            }

            if (index >= filledCells) {
                return cell(`cell-${index}`, color, height / 2, reservedOpacity);
            }

            return options.isPaceSplit && index < tickIndex
                ? cell(`cell-${index}`, color, height, paceFaintOpacity)
                : cell(`cell-${index}`, color, height, 1);
        };
        const track = (
            <HStack spacing={0} modifiers={style.capsuleClip}>
                {Array.from({ length: cellCount }, (_cell, index) => cellAt(index))}
            </HStack>
        );

        if (tickIndex < 0) {
            return track;
        }

        const tickHeight = height + metric.tickOverhang;
        const labelShift =
            Math.max(0, metric.labelEdgeCells - tickIndex) * metric.labelCellWidth -
            Math.max(0, tickIndex - (cellCount - metric.labelEdgeCells)) * metric.labelCellWidth;
        const isEndTick = tickIndex === cellCount;
        const tickCell = Math.min(tickIndex, cellCount - 1);
        const tickShift = isEndTick ? 1 : -1;
        const tickColumn = style.column(tickHeight, isEndTick ? 'trailing' : 'leading');

        return (
            <ZStack>
                {track}
                <HStack spacing={0}>
                    {Array.from({ length: cellCount }, (_cell, index) => (
                        <ZStack key={`tick-${index}`} modifiers={tickColumn}>
                            {index === tickCell ? <Capsule modifiers={style.tickHalo(tickHeight, tickShift)} /> : null}
                            {index === tickCell ? <Capsule modifiers={style.tick(tickHeight, tickShift)} /> : null}
                        </ZStack>
                    ))}
                </HStack>
                {options.tickLabel === null
                    ? null
                    : markerRow(
                          tickHeight,
                          tickCell,
                          options.tickLabel,
                          offset({ x: labelShift, y: -(tickHeight / 2 + metric.labelLift) })
                      )}
            </ZStack>
        );
    };

    const categoryBar = (ratio: number, limitRatio: number | null, color: string) => {
        const { categoryBarWidth, categoryBarHeight } = metric;

        if (limitRatio !== null) {
            const withinWidth = Math.min((categoryBarWidth - 2) * limitRatio, categoryBarWidth - 2 - metric.minimumOverflowWidth);

            return (
                <HStack spacing={2}>
                    <Capsule modifiers={style.segment(withinLimitColor(color), withinLimitOpacity, withinWidth)} />
                    <Capsule modifiers={style.segment(color, 1, categoryBarWidth - 2 - withinWidth)} />
                </HStack>
            );
        }

        return (
            <ZStack alignment="leading">
                <Capsule modifiers={style.segment(trackColor, trackOpacity, categoryBarWidth)} />
                {ratio > 0 ? <Capsule modifiers={style.segment(color, 1, Math.max(categoryBarHeight, categoryBarWidth * ratio))} /> : null}
            </ZStack>
        );
    };

    const ctaCapsule = <Text modifiers={style.cta}>{props.strings.emptyBudgetAction}</Text>;

    if (props.isEmpty) {
        const title = <Text modifiers={style.emptyTitle}>{props.strings.emptyBudgetTitle}</Text>;
        const emptyContainer = [
            containerBackground(backgroundColor, 'widget'),
            widgetURL(props.createBudgetUrl),
            frame({ maxWidth: Infinity, maxHeight: Infinity })
        ];

        if (isMedium) {
            return (
                <HStack alignment="center" spacing={16} modifiers={emptyContainer}>
                    <VStack alignment="leading" spacing={0} modifiers={style.emptyText}>
                        {title}
                        <Text modifiers={style.emptySubtitle}>{props.strings.emptyBudgetSubtitle}</Text>
                        <VStack modifiers={style.emptyAction}>{ctaCapsule}</VStack>
                    </VStack>
                    <ZStack>
                        <Circle modifiers={style.disc(metric.mediumDiscOpacity, metric.mediumDiscSize)} />
                        <Image systemName="chart.pie.fill" size={30} color={fillColor('positive')} />
                    </ZStack>
                </HStack>
            );
        }

        return (
            <VStack spacing={0} modifiers={emptyContainer}>
                <ZStack>
                    <Circle modifiers={style.disc(metric.smallDiscOpacity, 40)} />
                    <Image systemName="chart.pie.fill" size={19} color={fillColor('positive')} />
                </ZStack>
                <Spacer minLength={6} />
                {title}
                <Spacer minLength={8} />
                {ctaCapsule}
            </VStack>
        );
    }

    const { budget } = props;
    const { isMasked, isOverLimit: isOver } = budget;
    const toneFill = fillColor(budget.tone);
    const statusInk = isOver ? inkColor('destructive') : 'primary';
    const heroColor = isMasked ? secondaryInk : statusInk;
    const statusSystemName = isMasked ? 'lock.fill' : statusSymbol[budget.tone];
    const statusColor = isMasked ? secondaryInk : toneFill;
    const captionLines = isMasked ? 2 : 1;
    const isLongPerDay = !isMedium && budget.formattedPerDay.length > metric.perDayInlineLength;
    const isTwoLineFooter = !isMedium && !isMasked && (isOver || isLongPerDay);
    const barSpacing = isTwoLineFooter ? 8 : 20;
    const overTickLabel = isMedium ? props.strings.limit : null;
    const daysLeftSuffix = `· ${budget.formattedDaysLeft}`;
    const status = (
        <HStack spacing={5} modifiers={style.statusRow}>
            <Image systemName={statusSystemName} size={13} color={statusColor} modifiers={style.statusIcon(toneOpacity(budget.tone))} />
            <Text modifiers={style.statusLabel}>{budget.statusLabel}</Text>
        </HStack>
    );
    const twoLineFooter = (primary: string, primaryModifiers: ReturnType<typeof style.detail>) => (
        <VStack alignment="leading" spacing={1}>
            <Text modifiers={primaryModifiers}>{primary}</Text>
            <Text modifiers={style.detailLine}>{budget.formattedDaysLeft}</Text>
        </VStack>
    );
    const inlineFooter = (primary: string, primaryScale: number, detailScale: number) => (
        <HStack alignment="firstTextBaseline" spacing={3}>
            <Text modifiers={style.emphasis(primaryScale)}>{primary}</Text>
            <Text modifiers={style.detail(detailScale)}>{daysLeftSuffix}</Text>
        </HStack>
    );
    const paceFooter = isLongPerDay
        ? twoLineFooter(budget.formattedPerDay, style.emphasis(0.8))
        : inlineFooter(budget.formattedPerDay, 0.8, 0.75);
    const unmaskedOverFooter = isMedium
        ? inlineFooter(budget.formattedSpent, metric.tightScale, 0.8)
        : twoLineFooter(budget.formattedSpent, style.emphasisLine);
    const overFooter = isMasked ? <Text modifiers={style.detail(0.8)}>{budget.formattedDaysLeft}</Text> : unmaskedOverFooter;
    const maskedBar = (
        <VStack modifiers={style.barSlot(metric.maskedBarOpacity)}>
            {bar(Math.round(budget.elapsedRatio * metric.cellCount) / metric.cellCount, secondaryInk, metric.barHeight, {
                tickRatio: null,
                limitRatio: null,
                tickLabel: null,
                isPaceSplit: false,
                reservedRatio: 0
            })}
        </VStack>
    );
    const paceBar = (
        <VStack modifiers={style.barSlot(toneOpacity(budget.tone))}>
            {bar(budget.spentRatio, toneFill, metric.barHeight, {
                tickRatio: budget.elapsedRatio,
                limitRatio: isOver ? budget.limitRatio : null,
                tickLabel: isOver ? overTickLabel : props.strings.today,
                isPaceSplit: budget.tone === 'warning',
                reservedRatio: budget.reservedRatio
            })}
        </VStack>
    );
    const summary = (
        <VStack alignment="leading" spacing={0} modifiers={style.summary}>
            {status}
            <Rectangle modifiers={style.spacerGap} />
            <Text modifiers={style.hero(heroColor)}>{budget.formattedAmount}</Text>
            <Text modifiers={style.caption(captionLines)}>{budget.caption}</Text>
            <Spacer minLength={barSpacing} />
            {isMasked ? maskedBar : paceBar}
            <Spacer minLength={7} />
            {isMasked || isOver ? overFooter : paceFooter}
            {isMedium && budget.formattedReserved !== '' ? <Text modifiers={style.reserved}>{budget.formattedReserved}</Text> : null}
        </VStack>
    );
    const accessibilityText = isMedium ? `${budget.accessibilitySummary} ${budget.accessibilityDetail}` : budget.accessibilitySummary;
    const container = [
        containerBackground(backgroundColor, 'widget'),
        widgetURL(props.budgetUrl),
        frame({ maxWidth: Infinity, maxHeight: Infinity }),
        accessibilityElement('ignore'),
        accessibilityLabel(accessibilityText)
    ];

    if (!isMedium) {
        return <VStack modifiers={container}>{summary}</VStack>;
    }

    const periodHeader = <Text modifiers={style.sideHeader}>{budget.formattedPeriod}</Text>;

    const statNote = (stat: (typeof budget.stats)[number]) =>
        stat.note === null ? null : (
            <Text modifiers={style.statNote(inkColor(stat.isNoteNegative ? 'destructive' : 'positive'))}>{stat.note}</Text>
        );
    const maskedStatValue = (index: number) =>
        index === 0 ? (
            <Capsule modifiers={style.skeleton(metric.projectedSkeletonWidth, 12, 21)} />
        ) : (
            <Capsule modifiers={style.skeleton(metric.averageSkeletonWidth, 9, 16)} />
        );
    const maskedStatNote = (index: number) =>
        index === 0 ? <Capsule modifiers={style.skeleton(metric.noteSkeletonWidth, 9, 15)} /> : null;

    if (isMasked || budget.categories.length === 0) {
        return (
            <HStack alignment="top" spacing={16} modifiers={container}>
                {summary}
                <VStack alignment="leading" spacing={0} modifiers={style.sideColumn(2)}>
                    {periodHeader}
                    <Spacer minLength={6} />
                    {budget.stats.map((stat, index) => (
                        <VStack key={stat.label} alignment="leading" spacing={1} modifiers={style.statBlock(index)}>
                            <Text modifiers={style.statLabel}>{stat.label}</Text>
                            {isMasked ? maskedStatValue(index) : <Text modifiers={style.statValue(index)}>{stat.value}</Text>}
                            {isMasked ? maskedStatNote(index) : statNote(stat)}
                        </VStack>
                    ))}
                </VStack>
            </HStack>
        );
    }

    return (
        <HStack alignment="top" spacing={16} modifiers={container}>
            {summary}
            <VStack alignment="leading" spacing={0} modifiers={style.sideColumn(3)}>
                <HStack spacing={6} modifiers={style.categoriesHeaderRow}>
                    <Text modifiers={style.categoriesTitle}>{props.strings.categoriesTitle}</Text>
                    <Spacer minLength={0} />
                    <Text modifiers={style.detailLine}>{budget.formattedHiddenCategories}</Text>
                </HStack>
                {budget.categories.map(category => (
                    <VStack key={category.title} alignment="leading" spacing={4}>
                        <Spacer minLength={7} />
                        <HStack spacing={6}>
                            <Text modifiers={style.categoryTitle}>{category.title}</Text>
                            <Spacer minLength={4} />
                            {isAccented && category.tone !== 'positive' ? (
                                <Image systemName={statusSymbol[category.tone]} size={10} color="white" />
                            ) : null}
                            <Text modifiers={style.categoryProgress(category.tone)}>{category.formattedProgress}</Text>
                        </HStack>
                        <VStack modifiers={style.toneOpacity(category.tone)}>
                            {categoryBar(category.ratio, category.limitRatio, fillColor(category.tone))}
                        </VStack>
                    </VStack>
                ))}
            </VStack>
        </HStack>
    );
};

export default createWidget(WidgetNameEnum.BUDGET, Budget);
