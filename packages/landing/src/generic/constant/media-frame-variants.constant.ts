import { cva } from 'class-variance-authority';

import { MediaFrameEnum } from '../enum/media-frame.enum';

export const mediaFrameVariants = cva('h-auto w-full', {
    variants: {
        frame: {
            [MediaFrameEnum.DEVICE]: '',
            [MediaFrameEnum.RAW]: 'overflow-hidden rounded-2xl border border-border/40 shadow-2xl'
        }
    }
});
