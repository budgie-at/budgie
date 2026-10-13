const UTIL_FOLDER_PATTERN = /\/util\//u;

export default {
    meta: {
        type: 'suggestion',
        docs: { description: 'Utility files live in a `utils/` folder, never `util/`.' },
        schema: [
            {
                type: 'object',
                properties: { allow: { type: 'array', items: { type: 'string' } } },
                additionalProperties: false
            }
        ],
        messages: { utilFolder: 'Move this file from `util/` to `utils/`.' }
    },
    create(context) {
        const filename = context.filename.split('\\').join('/');
        const allow = context.options[0]?.allow ?? [];

        return {
            Program(node) {
                if (UTIL_FOLDER_PATTERN.test(filename) && !allow.some(folder => filename.includes(`${folder}/`))) {
                    context.report({ node, messageId: 'utilFolder' });
                }
            }
        };
    }
};
