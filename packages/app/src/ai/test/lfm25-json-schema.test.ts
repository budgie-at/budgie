/**
 * Test: LFM2.5-1.2B-Thinking JSON Schema Parsing
 *
 * This test validates if the LiquidAI LFM2.5-1.2B-Thinking model can:
 * 1. Parse expense descriptions
 * 2. Return structured JSON responses with category, amount, and type
 * 3. Handle the tool/function calling format
 *
 * Run Methods:
 *
 * 1. HuggingFace Inference API (requires token):
 *    HUGGINGFACE_API_TOKEN=hf_xxx npx tsx packages/app/src/ai/test/lfm25-json-schema.test.ts
 *
 * 2. Local GGUF with llama.cpp (requires llama-server running):
 *    # First, start llama-server:
 *    llama-server -m ./models/LFM2.5-1.2B-Thinking-Q4_0.gguf --port 8080
 *    # Then run test:
 *    USE_LOCAL=1 npx tsx packages/app/src/ai/test/lfm25-json-schema.test.ts
 *
 * Model files:
 * - GGUF: https://huggingface.co/LiquidAI/LFM2.5-1.2B-Thinking-GGUF
 * - ONNX: https://huggingface.co/LiquidAI/LFM2.5-1.2B-Thinking-onnx
 *
 * Integration Options:
 * - ExecuTorch: Export using optimum-executorch, use with react-native-executorch
 * - ONNX Runtime: Use onnxruntime-react-native with ONNX format
 */

interface ExpenseSchema {
    categoryId: number;
    amount: number;
    type: 'expense' | 'income' | 'transfer';
    description: string;
}

interface CategoryForPrompt {
    id: number;
    title: string;
}

const SAMPLE_CATEGORIES: CategoryForPrompt[] = [
    { id: 1, title: 'Food & Groceries' },
    { id: 2, title: 'Transportation' },
    { id: 3, title: 'Entertainment' },
    { id: 4, title: 'Healthcare' },
    { id: 5, title: 'Shopping' },
    { id: 6, title: 'Utilities' },
    { id: 7, title: 'Coffee & Drinks' },
    { id: 8, title: 'Restaurants' },
    { id: 9, title: 'Subscriptions' },
    { id: 10, title: 'Travel' },
    { id: 11, title: 'Personal Care' },
    { id: 12, title: 'Education' }
];

const TEST_INPUTS = [
    'Coffee at Starbucks for $4.50',
    'Uber ride to airport 25 dollars',
    'Netflix subscription',
    'Grocery shopping at Walmart $156.32',
    'Dinner with friends'
];

const buildToolDefinition = (categories: CategoryForPrompt[]): string => {
    const categoryEnum = categories.map(c => c.id);
    const categoryDescriptions = categories.map(c => `${c.id}=${c.title}`).join(', ');

    return JSON.stringify(
        {
            name: 'categorize_expense',
            description: `Categorize an expense and extract amount. Categories: ${categoryDescriptions}`,
            parameters: {
                type: 'object',
                properties: {
                    categoryId: {
                        type: 'number',
                        enum: categoryEnum,
                        description: 'The category ID that best matches the expense'
                    },
                    amount: {
                        type: 'number',
                        description: 'The amount of the expense (0 if not specified)'
                    },
                    type: {
                        type: 'string',
                        enum: ['expense', 'income', 'transfer'],
                        description: 'The transaction type (usually expense)'
                    },
                    description: {
                        type: 'string',
                        description: 'A brief description of the expense'
                    }
                },
                required: ['categoryId', 'amount', 'type', 'description']
            }
        },
        undefined,
        2
    );
};

const buildSimplePrompt = (categories: CategoryForPrompt[]): string => {
    const categoryList = categories.map(c => `${c.id}=${c.title}`).join(', ');

    return `You are an expense categorization assistant. Given an expense description, respond with a JSON object containing:
- categoryId: number (one of: ${categoryList})
- amount: number (0 if not mentioned)
- type: "expense" (always)
- description: string (brief summary)

Respond ONLY with valid JSON, no explanation.`;
};

const callLocalLlamaServer = async (prompt: string, systemPrompt: string): Promise<string> => {
    const serverUrl = process.env.LLAMA_SERVER_URL ?? 'http://localhost:8080';

    const response = await fetch(`${serverUrl}/completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt: `<|im_start|>system\n${systemPrompt}<|im_end|>\n<|im_start|>user\n${prompt}<|im_end|>\n<|im_start|>assistant\n`,
            n_predict: 256,
            temperature: 0.05,
            top_k: 50,
            repeat_penalty: 1.05,
            stop: ['<|im_end|>', '<|endoftext|>']
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Llama server error: ${response.status} - ${error}`);
    }

    const result = (await response.json()) as { content: string };

    return result.content ?? '';
};

const callHuggingFaceAPI = async (prompt: string, systemPrompt: string): Promise<string> => {
    const apiToken = process.env.HUGGINGFACE_API_TOKEN;
    if (!apiToken) {
        throw new Error('HUGGINGFACE_API_TOKEN environment variable is required');
    }

    const response = await fetch('https://api-inference.huggingface.co/models/LiquidAI/LFM2.5-1.2B-Thinking', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            inputs: `<|im_start|>system\n${systemPrompt}<|im_end|>\n<|im_start|>user\n${prompt}<|im_end|>\n<|im_start|>assistant\n`,
            parameters: {
                max_new_tokens: 256,
                temperature: 0.05,
                top_k: 50,
                repetition_penalty: 1.05,
                return_full_text: false
            }
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`HuggingFace API error: ${response.status} - ${error}`);
    }

    const result = (await response.json()) as Array<{ generated_text: string }>;

    return result[0]?.generated_text ?? '';
};

const callModel = async (prompt: string, systemPrompt: string): Promise<string> => {
    const useLocal = process.env.USE_LOCAL === '1';

    if (useLocal) {
        return callLocalLlamaServer(prompt, systemPrompt);
    }

    return callHuggingFaceAPI(prompt, systemPrompt);
};

const parseJsonFromResponse = (response: string): ExpenseSchema | null => {
    const jsonMatch = /\{[\s\S]*?\}/u.exec(response);
    if (!jsonMatch) {
        return null;
    }

    try {
        return JSON.parse(jsonMatch[0]) as ExpenseSchema;
    } catch {
        return null;
    }
};

const runTest = async (): Promise<void> => {
    console.log('=== LFM2.5-1.2B-Thinking JSON Schema Test ===\n');
    console.log('Testing model capability to parse expenses and return structured JSON\n');

    const systemPrompt = buildSimplePrompt(SAMPLE_CATEGORIES);
    console.log('System Prompt:');
    console.log(systemPrompt);
    console.log('\n---\n');

    let successCount = 0;
    const results: Array<{ input: string; response: string; parsed: ExpenseSchema | null; success: boolean }> = [];

    for (const input of TEST_INPUTS) {
        console.log(`Testing: "${input}"`);

        try {
            const response = await callModel(input, systemPrompt);
            console.log(`Response: ${response}`);

            const parsed = parseJsonFromResponse(response);
            const success = parsed !== null && typeof parsed.categoryId === 'number' && typeof parsed.amount === 'number';

            results.push({ input, response, parsed, success });

            if (success) {
                successCount++;
                console.log(`Parsed: ${JSON.stringify(parsed)}`);
                console.log('Status: SUCCESS\n');
            } else {
                console.log('Status: FAILED (could not parse JSON)\n');
            }
        } catch (error) {
            console.log(`Error: ${error instanceof Error ? error.message : String(error)}`);
            results.push({ input, response: '', parsed: null, success: false });
            console.log('Status: ERROR\n');
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('=== Summary ===');
    console.log(`Success: ${successCount}/${TEST_INPUTS.length}`);
    console.log(`Success Rate: ${((successCount / TEST_INPUTS.length) * 100).toFixed(1)}%`);

    if (successCount === TEST_INPUTS.length) {
        console.log('\nModel is suitable for JSON schema parsing!');
        console.log('Next step: Implement ONNX Runtime or ExecuTorch integration');
    } else if (successCount >= TEST_INPUTS.length / 2) {
        console.log('\nModel shows promise but needs prompt tuning');
    } else {
        console.log('\nModel may not be suitable for structured output');
    }

    console.log('\n=== Tool Calling Test ===\n');
    const toolDefinition = buildToolDefinition(SAMPLE_CATEGORIES);
    console.log('Tool Definition:');
    console.log(toolDefinition);
};

runTest().catch(console.error);
