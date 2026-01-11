import { Trans } from '@lingui/react/macro';
import { Zap } from 'lucide-react';

import { Card } from '../../../ui/card/card';
import { CardContent } from '../../../ui/card/card-content';

export const AnalyticsSectionChartCards = () => (
    <div className="grid grid-cols-2 gap-4">
        <Card className="border-border/40 bg-linear-to-br from-green-50 to-background dark:from-green-950/20">
            <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-green-600">+$5,210</p>

                <p className="text-sm text-muted-foreground">
                    <Trans>Saved this month</Trans>
                </p>
            </CardContent>
        </Card>

        <Card className="border-border/40 bg-linear-to-br from-orange-50 to-background dark:from-orange-950/20">
            <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-1">
                    <Zap className="size-5 text-orange-500" />

                    <p className="text-3xl font-bold text-orange-600">3</p>
                </div>

                <p className="text-sm text-muted-foreground">
                    <Trans>Spending alerts</Trans>
                </p>
            </CardContent>
        </Card>
    </div>
);
