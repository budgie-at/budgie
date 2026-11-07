import * as Effect from 'effect/Effect';
import * as HttpClient from 'effect/http/HttpClient';
import * as HttpClientResponse from 'effect/http/HttpClientResponse';
import * as Layer from 'effect/Layer';

const buildPriceMarker = ([fundName, price]: readonly [string, number]) =>
    `&quot;value&quot;:[0,&quot;${price}&quot;],&quot;dynamicValue&quot;:[0,&quot;initialInvestment&quot;],&quot;hint&quot;:[0,&quot;Ринкова вартість сертифіката фонду ${fundName}.&quot;]`;

export const inzhurHomeClientLayer = (pricesByFundName: Readonly<Record<string, number>>) =>
    Layer.succeed(
        HttpClient.HttpClient,
        HttpClient.make(request =>
            Effect.succeed(
                HttpClientResponse.fromWeb(
                    request,
                    new Response(Object.entries(pricesByFundName).map(buildPriceMarker).join(''), { status: 200 })
                )
            )
        )
    );
