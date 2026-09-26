import { CategorizeDemoAccept } from '../categorize-demo-accept/categorize-demo-accept';
import { CategorizeDemoCard } from '../categorize-demo-card/categorize-demo-card';
import { CategorizeDemoChip } from '../categorize-demo-chip/categorize-demo-chip';
import { CategorizeDemoDone } from '../categorize-demo-done/categorize-demo-done';
import { CategorizeDemoHeader } from '../categorize-demo-header/categorize-demo-header';
import { CategorizeDemoPlayer } from '../categorize-demo-player/categorize-demo-player';
import { CategorizeDemoRawRow } from '../categorize-demo-raw-row/categorize-demo-raw-row';
import { CategorizeDemoSectionLabel } from '../categorize-demo-section-label/categorize-demo-section-label';
import { CategorizeDemoSuggestion } from '../categorize-demo-suggestion/categorize-demo-suggestion';

import type { ReactNode } from 'react';

interface Props {
    readonly label: string;
    readonly replay: ReactNode;
    readonly children: ReactNode;
}

const CategorizeDemoRoot = ({ label, replay, children }: Props) => (
    <figure aria-label={label} className="m-0 w-full" role="group">
        <CategorizeDemoPlayer replay={replay}>{children}</CategorizeDemoPlayer>
    </figure>
);

export const CategorizeDemo = Object.assign(CategorizeDemoRoot, {
    Accept: CategorizeDemoAccept,
    Card: CategorizeDemoCard,
    Chip: CategorizeDemoChip,
    Done: CategorizeDemoDone,
    Header: CategorizeDemoHeader,
    RawRow: CategorizeDemoRawRow,
    SectionLabel: CategorizeDemoSectionLabel,
    Suggestion: CategorizeDemoSuggestion
});
