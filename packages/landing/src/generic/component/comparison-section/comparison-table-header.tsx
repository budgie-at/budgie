import { Trans } from '@lingui/react/macro';

export const ComparisonTableHeader = () => (
    <thead>
        <tr className="border-b border-border">
            <th className="text-left p-4 font-medium text-muted-foreground">
                <Trans>Feature</Trans>
            </th>

            <th className="p-4 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-bold">
                    <Trans>Budgie</Trans>
                </div>
            </th>

            <th className="p-4 text-center font-medium text-muted-foreground">
                <Trans>Cloud Apps</Trans>
            </th>
        </tr>
    </thead>
);
