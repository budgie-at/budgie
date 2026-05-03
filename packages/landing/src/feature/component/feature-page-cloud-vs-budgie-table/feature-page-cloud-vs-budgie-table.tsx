 
import { Trans } from '@lingui/react/macro';

export const FeaturePageCloudVsBudgieTable = () => (
    <div className="overflow-x-auto">
        <table className="w-full text-sm border border-border/60 rounded-lg">
            <thead className="bg-muted/40">
                <tr>
                    <th className="text-left p-3">
                        <Trans>Concern</Trans>
                    </th>
                    <th className="text-left p-3">
                        <Trans>Cloud app</Trans>
                    </th>
                    <th className="text-left p-3">
                        <Trans>Budgie</Trans>
                    </th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
                <tr>
                    <td className="p-3 font-medium">
                        <Trans>Data location</Trans>
                    </td>
                    <td className="p-3">
                        <Trans>Vendor servers + Plaid</Trans>
                    </td>
                    <td className="p-3">
                        <Trans>Your device only</Trans>
                    </td>
                </tr>
                <tr>
                    <td className="p-3 font-medium">
                        <Trans>Works offline</Trans>
                    </td>
                    <td className="p-3">
                        <Trans>Read-only at best</Trans>
                    </td>
                    <td className="p-3">
                        <Trans>Yes, fully</Trans>
                    </td>
                </tr>
                <tr>
                    <td className="p-3 font-medium">
                        <Trans>Account required</Trans>
                    </td>
                    <td className="p-3">
                        <Trans>Yes</Trans>
                    </td>
                    <td className="p-3">
                        <Trans>No</Trans>
                    </td>
                </tr>
                <tr>
                    <td className="p-3 font-medium">
                        <Trans>Subpoena risk</Trans>
                    </td>
                    <td className="p-3">
                        <Trans>Vendor can be compelled</Trans>
                    </td>
                    <td className="p-3">
                        <Trans>None — no servers</Trans>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
);
