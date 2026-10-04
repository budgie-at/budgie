import { createCn } from 'cn/config';

const THEME_SIZE_SCALE = ['xxs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl'];
const THEME_TEXT_SCALE = ['xxxs', 'xxs', 'xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '4_5xl', '5xl', '6xl', '7xl', '8xl'];
const THEME_TRANSFORM_SCALE = ['xs', 's'];

export const cn = createCn({
    extend: {
        theme: {
            spacing: THEME_SIZE_SCALE,
            radius: THEME_SIZE_SCALE,
            text: THEME_TEXT_SCALE
        },
        classGroups: {
            scale: [{ scale: THEME_TRANSFORM_SCALE }]
        }
    }
});
