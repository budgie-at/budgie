import { Trans } from '@lingui/react/macro';
import { Download } from 'lucide-react';

import { Button } from '../../../ui/button';
import { Card } from '../../../ui/card/card';
import { CardContent } from '../../../ui/card/card-content';

interface Props {
    readonly locale: string;
    readonly publishedAt: string;
    readonly releaseName: string;
    readonly releaseNotes: string;
}

const IOS_OTA_MANIFEST_INSTALL_URL = 'itms-services://?action=download-manifest&url=https://budgie.at/ota/manifest.plist';

export const BetaReleaseCard = ({ locale, publishedAt, releaseName, releaseNotes }: Props) => {
    const formattedPublishedAt = new Date(publishedAt).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
    });

    return (
        <Card>
            <CardContent className="pt-6 space-y-6">
                <div>
                    <div className="text-sm text-muted-foreground">
                        <Trans>Latest build</Trans>
                    </div>
                    <div className="text-xl font-semibold">{releaseName}</div>
                    <div className="text-sm text-muted-foreground">
                        <Trans>Built {formattedPublishedAt}</Trans>
                    </div>
                </div>

                <Button asChild size="lg">
                    <a href={IOS_OTA_MANIFEST_INSTALL_URL}>
                        <Download aria-hidden />
                        <Trans>Install on iPhone</Trans>
                    </a>
                </Button>

                <div className="space-y-2">
                    <h2 className="text-sm font-semibold">
                        <Trans>Before you install</Trans>
                    </h2>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                        <li>
                            <Trans>Open this page in Safari &mdash; other browsers cannot trigger an OTA install.</Trans>
                        </li>
                        <li>
                            <Trans>Your device UDID must already be registered in the ad-hoc provisioning profile.</Trans>
                        </li>
                        <li>
                            <Trans>On iOS 18 and later, restart your iPhone once after installing if the app fails to open.</Trans>
                        </li>
                        <li>
                            <Trans>
                                This is a development build &mdash; it expects a running Metro bundler or the development EAS Update
                                channel.
                            </Trans>
                        </li>
                    </ul>
                </div>

                <details className="text-sm text-muted-foreground">
                    <summary className="cursor-pointer font-medium">
                        <Trans>Release notes</Trans>
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap font-mono text-xs">{releaseNotes}</pre>
                </details>
            </CardContent>
        </Card>
    );
};
