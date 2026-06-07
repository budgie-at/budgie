import { Trans } from '@lingui/react/macro';
import { Target, TrendingUp } from 'lucide-react';

import { Badge } from '../../../ui/badge';
import { Card } from '../../../ui/card/card';
import { CardContent } from '../../../ui/card/card-content';

export const DebtSectionLoanCard = () => (
    <Card className="border-2 border-primary/20 bg-linear-to-r from-primary/5 to-background">
        <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Target className="size-5 text-primary" />

                    <span className="font-semibold">
                        <Trans>Student Loan</Trans>
                    </span>
                </div>

                <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    <TrendingUp className="size-3 mr-1" />
                    <Trans>72% paid</Trans>
                </Badge>
            </div>

            <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">
                        <Trans>$7,200 of $10,000</Trans>
                    </span>

                    <span className="font-medium">
                        <Trans>$2,800 left</Trans>
                    </span>
                </div>

                <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-[72%] rounded-full bg-linear-to-r from-primary to-primary/70" />
                </div>
            </div>

            <p className="text-sm text-muted-foreground">
                <Trans>At current pace, you&apos;ll be debt-free by August 2025</Trans>
            </p>
        </CardContent>
    </Card>
);
