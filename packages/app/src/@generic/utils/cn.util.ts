import { createCn } from 'cn/config';

export const cn = createCn({
    extend: {
        theme: {
            spacing: ['xxs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl'],
            radius: ['xxs'],
            text: ['xxxs', 'xxs', '4_5xl']
        }
    }
});
