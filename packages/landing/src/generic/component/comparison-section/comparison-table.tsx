import { Trans } from '@lingui/react/macro';

import { ComparisonTableBody } from './comparison-table-body';
import { ComparisonTableHeader } from './comparison-table-header';

export const ComparisonTable = () => (
    <div className="max-w-4xl">
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <ComparisonTableHeader />
                <ComparisonTableBody />
            </table>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
            <Trans>Cloud Apps include Mint, Emma, Snoop, and similar services that store your data on their servers.</Trans>
        </p>
    </div>
);
