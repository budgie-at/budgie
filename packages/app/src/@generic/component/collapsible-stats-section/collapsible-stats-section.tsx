import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { StatsSectionToggleRow } from '../stats-section-toggle-row/stats-section-toggle-row';
import { StatsSection } from '../stats-section/stats-section';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly footnote?: string;
    readonly rows: readonly ReactNode[];
    readonly toggleTestID: string;
}

const COLLAPSED_ROW_COUNT = 8;

export const CollapsibleStatsSection = ({ title, footnote, rows, toggleTestID }: Props) => {
    const { t } = useLingui();
    const [isExpanded, setIsExpanded] = useState(false);

    const handleToggle = () => void setIsExpanded(current => !current);

    const hiddenCount = rows.length - COLLAPSED_ROW_COUNT;
    const visibleRows = isExpanded ? rows : rows.slice(0, COLLAPSED_ROW_COUNT);
    const toggleLabel = isExpanded ? t`Show less` : t({ message: plural(hiddenCount, { one: 'Show # more', other: 'Show # more' }) });

    return (
        <StatsSection title={title} footnote={footnote}>
            {visibleRows}
            {hiddenCount > 0 ? <StatsSectionToggleRow label={toggleLabel} testID={toggleTestID} onPress={handleToggle} /> : null}
        </StatsSection>
    );
};
