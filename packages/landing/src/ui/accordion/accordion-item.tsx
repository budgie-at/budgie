'use client';

import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { cn } from 'cn';
import { forwardRef } from 'react';

import type { ComponentPropsWithoutRef, ComponentRef } from 'react';

export const AccordionItem = forwardRef<
    ComponentRef<typeof AccordionPrimitive.Item>,
    ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => <AccordionPrimitive.Item className={cn('border-b', className)} ref={ref} {...props} />);
