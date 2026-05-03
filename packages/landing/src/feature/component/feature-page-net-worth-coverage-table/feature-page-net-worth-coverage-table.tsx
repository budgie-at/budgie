
import { Trans } from '@lingui/react/macro';

export const FeaturePageNetWorthCoverageTable = () => (
    <div className="overflow-x-auto">
        <table className="w-full text-sm border border-border/60 rounded-lg">
            <thead className="bg-muted/40">
                <tr>
                    <th className="text-left p-3">
                        <Trans>Concern</Trans>
                    </th>
                    <th className="text-left p-3">
                        <Trans>Most expense apps</Trans>
                    </th>
                    <th className="text-left p-3">
                        <Trans>Budgie</Trans>
                    </th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
                <tr>
                    <td className="p-3 font-medium">
                        <Trans>Asset coverage</Trans>
                    </td>
                    <td className="p-3">
                        <Trans>Bank only</Trans>
                    </td>
                    <td className="p-3">
                        <Trans>Bank + cash + crypto + stocks + ETFs + debt</Trans>
                    </td>
                </tr>
                <tr>
                    <td className="p-3 font-medium">
                        <Trans>FX support</Trans>
                    </td>
                    <td className="p-3">
                        <Trans>One currency, often hardcoded</Trans>
                    </td>
                    <td className="p-3">
                        <Trans>Per-account currency, daily auto-conversion</Trans>
                    </td>
                </tr>
                <tr>
                    <td className="p-3 font-medium">
                        <Trans>Liability accounts</Trans>
                    </td>
                    <td className="p-3">
                        <Trans>Treated as expenses</Trans>
                    </td>
                    <td className="p-3">
                        <Trans>First-class — subtract from net worth</Trans>
                    </td>
                </tr>
                <tr>
                    <td className="p-3 font-medium">
                        <Trans>Time series</Trans>
                    </td>
                    <td className="p-3">
                        <Trans>Spending only</Trans>
                    </td>
                    <td className="p-3">
                        <Trans>Net worth trendline alongside</Trans>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
);
