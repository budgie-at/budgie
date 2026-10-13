const RUN_METHODS = new Set(['runPromise', 'runPromiseExit', 'runSync', 'runSyncExit', 'runFork', 'runCallback']);

export default {
    meta: {
        type: 'problem',
        docs: { description: 'Disallow running effects inside services and repositories; only runtime edges run effects.' },
        schema: [],
        messages: { noRun: '{{method}} runs an effect inside a service or repository. Return the Effect and run it at the edge (hook, atom, task, boot).' }
    },
    create(context) {
        return {
            CallExpression(node) {
                const { callee } = node;

                if (callee.type === 'MemberExpression' && !callee.computed && RUN_METHODS.has(callee.property.name)) {
                    context.report({ node, messageId: 'noRun', data: { method: callee.property.name } });
                }
            }
        };
    }
};
