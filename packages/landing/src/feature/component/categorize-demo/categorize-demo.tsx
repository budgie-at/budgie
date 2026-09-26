import { CategorizeDemoAccept } from '../categorize-demo-accept/categorize-demo-accept';
import { CategorizeDemoCard } from '../categorize-demo-card/categorize-demo-card';
import { CategorizeDemoChip } from '../categorize-demo-chip/categorize-demo-chip';
import { CategorizeDemoCount } from '../categorize-demo-count/categorize-demo-count';
import { CategorizeDemoHeader } from '../categorize-demo-header/categorize-demo-header';
import { CategorizeDemoPlayer } from '../categorize-demo-player/categorize-demo-player';
import { CategorizeDemoRawRow } from '../categorize-demo-raw-row/categorize-demo-raw-row';
import { CategorizeDemoSectionLabel } from '../categorize-demo-section-label/categorize-demo-section-label';
import { CategorizeDemoSuggestion } from '../categorize-demo-suggestion/categorize-demo-suggestion';

import type { ReactNode } from 'react';

interface Props {
    readonly caption: ReactNode;
    readonly replay: ReactNode;
    readonly children: ReactNode;
}

const CategorizeDemoRoot = ({ caption, replay, children }: Props) => (
    <figure className="m-0 w-full">
        <figcaption className="sr-only">{caption}</figcaption>
        <CategorizeDemoPlayer replay={replay}>{children}</CategorizeDemoPlayer>
    </figure>
);

export const CategorizeDemo = Object.assign(CategorizeDemoRoot, {
    Accept: CategorizeDemoAccept,
    Card: CategorizeDemoCard,
    Chip: CategorizeDemoChip,
    Count: CategorizeDemoCount,
    Header: CategorizeDemoHeader,
    RawRow: CategorizeDemoRawRow,
    SectionLabel: CategorizeDemoSectionLabel,
    Suggestion: CategorizeDemoSuggestion
});
