import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';

import { ChatInvoker } from '../../chat/service/chat-invoker.service';
import { RECEIPT_MERCHANT_GENERATION_OPTIONS, RECEIPT_MERCHANT_PROMPT } from '../constant/receipt-merchant-prompt.constant';

export class ReceiptMerchantLlmService extends Context.Service<ReceiptMerchantLlmService>()('@budgie/ai/ReceiptMerchantLlmService', {
    make: Effect.gen(function* () {
        const chat = yield* ChatInvoker;

        const decodeMerchant = Schema.decodeUnknownOption(
            Schema.fromJsonString(Schema.Struct({ merchant: Schema.String, description: Schema.String }))
        );

        return {
            name: Effect.fn('ReceiptMerchantLlmService.name')(function* (receiptText: string) {
                const response = yield* chat.generate(RECEIPT_MERCHANT_PROMPT, receiptText, RECEIPT_MERCHANT_GENERATION_OPTIONS);

                return Option.getOrNull(decodeMerchant(response));
            })
        };
    })
}) {
    static readonly layer = Layer.effect(ReceiptMerchantLlmService, ReceiptMerchantLlmService.make);
}
