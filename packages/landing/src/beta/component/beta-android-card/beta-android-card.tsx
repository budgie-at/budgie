import { Trans } from '@lingui/react/macro';
import { Download } from 'reicon-react';

import { Button } from '../../../ui/button';
import { Card } from '../../../ui/card/card';
import { CardContent } from '../../../ui/card/card-content';

export const BetaAndroidCard = () => (
    <Card>
        <CardContent className="pt-6 space-y-6">
            <div className="text-xl font-semibold">
                <Trans>Android preview build</Trans>
            </div>

            <Button asChild size="lg">
                <a href="/api/beta/apk">
                    <Download aria-hidden />
                    <Trans>Install on Android</Trans>
                </a>
            </Button>

            <div className="space-y-2">
                <h2 className="text-sm font-semibold">
                    <Trans>Before you install</Trans>
                </h2>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li>
                        <Trans>Allow installs from your browser when Android asks.</Trans>
                    </li>
                    <li>
                        <Trans>This is a preview build signed for testing, so Play Protect may show a warning.</Trans>
                    </li>
                    <li>
                        <Trans>It installs beside the Google Play version.</Trans>
                    </li>
                </ul>
            </div>
        </CardContent>
    </Card>
);
