import { Trans } from '@lingui/react/macro';

export const FeaturePagePlaidVsMonobankTable = () => (
    <div className="overflow-x-auto">
        <table className="w-full text-sm border border-border/60 rounded-lg">
            <thead className="bg-muted/40">
                <tr>
                    <th className="text-left p-3">
                        <Trans>Concern</Trans>
                    </th>
                    <th className="text-left p-3">
                        <Trans>Plaid-based app</Trans>
                    </th>
                    <th className="text-left p-3">
                        <Trans>Budgie + Monobank</Trans>
                    </th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
                <tr>
                    <td className="p-3 font-medium">
                        <Trans>Token control</Trans>
                    </td>
                    <td className="p-3">
                        <Trans>Plaid-managed credential vault</Trans>
                    </td>
                    <td className="p-3">
                        <Trans>Your token, in your keystore</Trans>
                    </td>
                </tr>
                <tr>
                    <td className="p-3 font-medium">
                        <Trans>FX preserved</Trans>
                    </td>
                    <td className="p-3">
                        <Trans>Often dropped or recomputed</Trans>
                    </td>
                    <td className="p-3">
                        <Trans>Original FX kept per leg</Trans>
                    </td>
                </tr>
                <tr>
                    <td className="p-3 font-medium">
                        <Trans>Counter-IBAN stored</Trans>
                    </td>
                    <td className="p-3">
                        <Trans>Rarely surfaced</Trans>
                    </td>
                    <td className="p-3">
                        <Trans>Yes — enables transfer-pair detection</Trans>
                    </td>
                </tr>
                <tr>
                    <td className="p-3 font-medium">
                        <Trans>Aggregator middleman</Trans>
                    </td>
                    <td className="p-3">
                        <Trans>Plaid (or similar) sees every transaction</Trans>
                    </td>
                    <td className="p-3">
                        <Trans>None — Budgie talks to Monobank directly</Trans>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
);
