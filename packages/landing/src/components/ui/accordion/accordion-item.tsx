'use client';

import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { forwardRef } from 'react';

import { cn } from '../../../lib/utils';

import type { ComponentPropsWithoutRef, ComponentRef } from 'react';

export const AccordionItem = forwardRef<
    ComponentRef<typeof AccordionPrimitive.Item>,
    ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => <AccordionPrimitive.Item className={cn('border-b', className)} ref={ref} {...props} />);
