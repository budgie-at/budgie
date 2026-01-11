import { Trans } from '@lingui/react/macro';

import { Motion } from '../motion/motion';

import { ComparisonTableBody } from './comparison-table-body';
import { ComparisonTableHeader } from './comparison-table-header';

const tableInitial = { opacity: 0, y: 30 };
const tableAnimate = { opacity: 1, y: 0 };
const tableTransition = { duration: 0.6, delay: 0.2 };
const viewportOnce = { once: true };

export const ComparisonTable = () => (
    <Motion
        className="max-w-4xl mx-auto"
        initial={tableInitial}
        transition={tableTransition}
        viewport={viewportOnce}
        whileInView={tableAnimate}
    >
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <ComparisonTableHeader />
                <ComparisonTableBody />
            </table>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
            <Trans>Cloud Apps include Mint, Emma, Snoop, and similar services that store your data on their servers.</Trans>
        </p>
    </Motion>
);
