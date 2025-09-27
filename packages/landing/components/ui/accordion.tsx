'use client';

import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import type { ComponentPropsWithoutRef, ElementRef } from 'react';
import * as React from 'react';
import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

const Accordion = AccordionPrimitive.Root;

const AccordionItem = forwardRef<ElementRef<typeof AccordionPrimitive.Item>, ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>>(
    ({ className, ...props }, ref) => <AccordionPrimitive.Item className={cn('border-b', className)} ref={ref} {...props} />
);

const AccordionTrigger = forwardRef<
    ElementRef<typeof AccordionPrimitive.Trigger>,
    ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Header className="flex">
        <AccordionPrimitive.Trigger
            className={cn(
                'flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180',
                className
            )}
            ref={ref}
            {...props}
        >
            {children}

            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
        </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
));

const AccordionContent = forwardRef<
    ElementRef<typeof AccordionPrimitive.Content>,
    ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Content
        className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
        ref={ref}
        {...props}
    >
        <div className={cn('pb-4 pt-0', className)}>{children}</div>
    </AccordionPrimitive.Content>
));

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
