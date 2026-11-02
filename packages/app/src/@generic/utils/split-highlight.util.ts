import { isNotEmptyString } from '@rnw-community/shared';

export const splitHighlight = (text: string, query: string): readonly [string, string, string] => {
    const start = isNotEmptyString(query) ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;

    if (start < 0) {
        return [text, '', ''];
    }

    return [text.slice(0, start), text.slice(start, start + query.length), text.slice(start + query.length)];
};
