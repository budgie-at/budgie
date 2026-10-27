declare module '*.sql' {
    const statements: () => string[];
    export default statements;
}
