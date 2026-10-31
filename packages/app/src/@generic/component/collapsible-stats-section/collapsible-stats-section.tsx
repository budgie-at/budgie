import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { StatsSectionToggleRow } from '../stats-section-toggle-row/stats-section-toggle-row';
import { StatsSection } from '../stats-section/stats-section';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly footnote?: string;
    readonly rows: readonly ReactNode[];
    readonly pinnedRow: ReactNode;
    readonly isExpanded: boolean;
    readonly toggleTestID: string;
    readonly onToggleExpanded: () => void;
}

const COLLAPSED_ROW_COUNT = 8;

export const CollapsibleStatsSection = ({ title, footnote, rows, pinnedRow, isExpanded, toggleTestID, onToggleExpanded }: Props) => {
    const { t } = useLingui();

    const hiddenCount = rows.length - COLLAPSED_ROW_COUNT;
    const visibleRows = isExpanded ? rows : rows.slice(0, COLLAPSED_ROW_COUNT);
    const toggleLabel = isExpanded ? t`Show less` : t({ message: plural(hiddenCount, { one: 'Show # more', other: 'Show # more' }) });

    return (
        <StatsSection title={title} footnote={footnote}>
            {visibleRows}
            {hiddenCount > 0 ? <StatsSectionToggleRow label={toggleLabel} testID={toggleTestID} onPress={onToggleExpanded} /> : null}
            {pinnedRow}
        </StatsSection>
    );
};
