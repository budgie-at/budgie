import type { WidgetNetWorthSnapshotInterface } from './widget-net-worth-snapshot.interface';
import type { WidgetPaletteInterface } from './widget-palette.interface';
import type { WidgetSnapshotStringsInterface } from './widget-snapshot-strings.interface';

export interface WidgetSnapshotInterface {
    readonly version: number;
    readonly generatedAtMs: number;
    readonly locale: string;
    readonly strings: WidgetSnapshotStringsInterface;
    readonly palette: WidgetPaletteInterface;
    readonly netWorth: WidgetNetWorthSnapshotInterface | null;
}
