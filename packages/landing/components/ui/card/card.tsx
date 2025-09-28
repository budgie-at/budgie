import { forwardRef } from 'react';

import { cn } from '../../../lib/utils';

import type { HTMLAttributes } from 'react';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div className={cn('rounded-lg border bg-card text-card-foreground shadow-xs', className)} ref={ref} {...props} />
));
