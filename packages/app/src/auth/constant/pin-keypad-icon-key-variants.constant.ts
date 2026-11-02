import { cva } from 'class-variance-authority';

export const pinKeypadIconKeyVariants = cva('rounded-full justify-center items-center active:bg-secondary-foreground/25', {
    variants: {
        isVisible: {
            true: 'opacity-100',
            false: 'opacity-0'
        },
        isCompact: {
            true: 'size-[64px]',
            false: 'size-[76px]'
        }
    }
});
