import { object, string } from 'zod';

const A = object({
    foo: string()
}).superRefine((data, ctx) => {
    if (data.foo.length < 3) {
        ctx.addIssue({
            path: ['foo'],
            code: 'custom',
            message: 'foo is too short string – it must be at least 3 characters long'
        });
    }
});

const B = A.safeExtend({ bar: string() }).superRefine((data, ctx) => {
    if (data.bar.length < 3) {
        ctx.addIssue({
            path: ['bar'],
            code: 'custom',
            message: 'bar is too short string – it must be at least 3 characters long'
        });
    }
});

describe('schema', () => {
    it('foo too short', () => {
        const result = A.safeParse({ foo: 'ab' });

        expect(result.success).toBe(false);
    });
    it('bar too short', () => {
        const result = B.safeParse({ foo: 'ab', bar: 'sa' });
        console.log({result});

        expect(result.success).toBe(false);
    });
});
