import { getContextServiceCall } from '../get-context-service-call.mjs';

const PACKAGE_DIRECTORY_PATTERN = /(?:^|\/)packages\/([^/]+)\/src\//u;

const getExpectedId = (filename, className) => {
    const packageDirectory = filename.split('\\').join('/').match(PACKAGE_DIRECTORY_PATTERN)?.[1];

    return packageDirectory === undefined ? null : `@budgie/${packageDirectory}/${className}`;
};

export default {
    meta: {
        type: 'problem',
        docs: { description: "Require Context.Service ids to be '@budgie/<package>/<ClassName>'." },
        schema: [],
        messages: {
            wrongId: "Service id '{{id}}' must be '{{expected}}'.",
            wrongName: "Service id '{{id}}' must end with '/{{className}}'."
        }
    },
    create(context) {
        return {
            ClassDeclaration(node) {
                const serviceCall = getContextServiceCall(node);
                const [idNode] = serviceCall?.arguments ?? [];

                if (node.id === null || idNode?.type !== 'Literal' || typeof idNode.value !== 'string') {
                    return;
                }

                const className = node.id.name;
                const expected = getExpectedId(context.filename, className);

                if (expected !== null && idNode.value !== expected) {
                    context.report({ node: idNode, messageId: 'wrongId', data: { id: idNode.value, expected } });
                } else if (expected === null && !idNode.value.endsWith(`/${className}`)) {
                    context.report({ node: idNode, messageId: 'wrongName', data: { id: idNode.value, className } });
                }
            }
        };
    }
};
