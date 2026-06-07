import { Trans } from '@lingui/react/macro';
import { Cloud, CloudOff } from 'lucide-react';

export const AiSectionComparisonCard = () => (
    <div className="p-6 bg-background rounded-xl border border-border/40 shadow-sm">
        <h4 className="font-semibold mb-4">
            <Trans>Cloud AI vs On-Device AI</Trans>
        </h4>

        <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium">
                    <Cloud className="size-4" />

                    <span>
                        <Trans>Cloud AI (Others)</Trans>
                    </span>
                </div>

                <ul className="space-y-2 text-muted-foreground">
                    <li>
                        <Trans>Data sent to remote servers</Trans>
                    </li>

                    <li>
                        <Trans>Can be hacked or subpoenaed</Trans>
                    </li>

                    <li>
                        <Trans>Requires internet connection</Trans>
                    </li>

                    <li>
                        <Trans>Third parties see your data</Trans>
                    </li>
                </ul>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
                    <CloudOff className="size-4" />

                    <span>
                        <Trans>On-Device AI (Budgie)</Trans>
                    </span>
                </div>

                <ul className="space-y-2 text-muted-foreground">
                    <li>
                        <Trans>Data never leaves your phone</Trans>
                    </li>

                    <li>
                        <Trans>Impossible to breach remotely</Trans>
                    </li>

                    <li>
                        <Trans>Works in airplane mode</Trans>
                    </li>

                    <li>
                        <Trans>Only you see your data</Trans>
                    </li>
                </ul>
            </div>
        </div>
    </div>
);
