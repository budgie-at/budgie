import { Trans } from '@lingui/react/macro';
import { AlertTriangle } from 'lucide-react';

import { Card } from '../../../ui/card/card';
import { CardContent } from '../../../ui/card/card-content';

export const BetaEmptyState = () => (
    <Card>
        <CardContent className="pt-6 flex flex-col items-center gap-3 text-center">
            <AlertTriangle className="text-muted-foreground" size={32} />
            <p className="font-semibold">
                <Trans>No build is available yet</Trans>
            </p>
            <p className="text-sm text-muted-foreground">
                <Trans>The iOS development build hasn&apos;t been published yet. Check back after the next build run.</Trans>
            </p>
        </CardContent>
    </Card>
);
