const TIMER_NAMES = new Set(['setTimeout', 'setInterval']);

export default {
    meta: {
        type: 'problem',
        docs: { description: 'Disallow try, throw, new Promise, async, await and timers where effectful code must use Effect.' },
        schema: [],
        messages: { useEffect: 'Use Effect (see AGENTS.md ## Effect)' }
    },
    create(context) {
        const report = node => context.report({ node, messageId: 'useEffect' });
        const reportAsync = node => {
            if (node.async) {
                report(node);
            }
        };

        return {
            TryStatement: report,
            ThrowStatement: report,
            AwaitExpression: report,
            FunctionDeclaration: reportAsync,
            FunctionExpression: reportAsync,
            ArrowFunctionExpression: reportAsync,
            NewExpression(node) {
                if (node.callee.type === 'Identifier' && node.callee.name === 'Promise') {
                    report(node);
                }
            },
            CallExpression(node) {
                if (node.callee.type === 'Identifier' && TIMER_NAMES.has(node.callee.name)) {
                    report(node);
                }
            }
        };
    }
};
