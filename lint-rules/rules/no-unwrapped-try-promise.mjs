export default {
    meta: {
        type: 'problem',
        docs: { description: 'Disallow the one-argument Effect.tryPromise form, which wraps rejections in UnknownError and loses the native message.' },
        schema: [],
        messages: { noUnwrapped: 'Effect.tryPromise(fn) wraps the rejection in UnknownError. Pass { try, catch } or use Effect.promise.' }
    },
    create(context) {
        return {
            CallExpression(node) {
                const { callee, arguments: args } = node;

                if (
                    callee.type === 'MemberExpression' &&
                    !callee.computed &&
                    callee.object.type === 'Identifier' &&
                    callee.object.name === 'Effect' &&
                    callee.property.name === 'tryPromise' &&
                    args.length === 1 &&
                    args[0].type !== 'ObjectExpression'
                ) {
                    context.report({ node, messageId: 'noUnwrapped' });
                }
            }
        };
    }
};
