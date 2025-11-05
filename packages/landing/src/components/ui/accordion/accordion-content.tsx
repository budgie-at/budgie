'use client';

import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef } from 'react';
import * as React from 'react';

import { cn } from '../../../lib/utils';

export const AccordionContent = forwardRef<
    ComponentRef<typeof AccordionPrimitive.Content>,
    ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Content
        className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
        ref={ref}
        {...props}
    >
        <div className={cn('pb-4 pt-0', className)}>
            {children}
        </div>
    </AccordionPrimitive.Content>
));
