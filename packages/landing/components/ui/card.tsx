import * as React from 'react';
import { forwardRef } from 'react';

import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div
        className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}
        ref={ref}
        {...props}
    />
));

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div
        className={cn('p-6 pt-0', className)}
        ref={ref}
        {...props}
    />
));

export { Card, CardContent };
