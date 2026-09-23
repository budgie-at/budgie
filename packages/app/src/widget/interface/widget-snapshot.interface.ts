import type { WidgetBudgetSnapshotInterface } from './widget-budget-snapshot.interface';
import type { WidgetNetWorthSnapshotInterface } from './widget-net-worth-snapshot.interface';
import type { WidgetPaletteInterface } from './widget-palette.interface';
import type { WidgetRunwaySnapshotInterface } from './widget-runway-snapshot.interface';
import type { WidgetSnapshotStringsInterface } from './widget-snapshot-strings.interface';
import type { ThemeEnum } from '@budgie/contracts';

export interface WidgetSnapshotInterface {
    readonly version: number;
    readonly generatedAtMs: number;
    readonly locale: string;
    readonly theme: ThemeEnum;
    readonly strings: WidgetSnapshotStringsInterface;
    readonly palette: WidgetPaletteInterface;
    readonly netWorth: WidgetNetWorthSnapshotInterface | null;
    readonly budget: WidgetBudgetSnapshotInterface | null;
    readonly runway: WidgetRunwaySnapshotInterface | null;
}
