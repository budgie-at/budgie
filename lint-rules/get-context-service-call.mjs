const isContextServiceFactory = node =>
    node?.type === 'CallExpression' &&
    node.callee.type === 'MemberExpression' &&
    node.callee.object.type === 'Identifier' &&
    node.callee.object.name === 'Context' &&
    node.callee.property.name === 'Service';

export const getContextServiceCall = classNode => {
    const superClass = classNode.superClass;

    return superClass?.type === 'CallExpression' && isContextServiceFactory(superClass.callee) ? superClass : null;
};
