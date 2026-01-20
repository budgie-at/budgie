import { Calendar } from 'lucide-react';

import { Card } from '../../../ui/card/card';
import { CardContent } from '../../../ui/card/card-content';

import type { ReactNode } from 'react';

interface Props {
    readonly icon: ReactNode;
    readonly iconClassName: string;
    readonly label: string;
    readonly amount: string;
    readonly amountClassName: string;
    readonly dueDate: string;
}

export const DebtSectionCard = ({ icon, iconClassName, label, amount, amountClassName, dueDate }: Props) => (
    <Card className="border-border/40 bg-background/80 backdrop-blur-sm">
        <CardContent className="p-5">
            <div className="flex items-center gap-4">
                <div className={`size-12 rounded-full flex items-center justify-center ${iconClassName}`}>{icon}</div>

                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{label}</span>

                        <span className={`font-bold ${amountClassName}`}>{amount}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="size-3" />

                        <span>{dueDate}</span>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
);
