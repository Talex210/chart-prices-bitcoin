// Этот запрос уже не нужен мне, но пока, что оставлю его.
export const coinGeckoRequest = () => {
    const config = useRuntimeConfig()
    const apiKeyCoinGecko = config.public.coinGeckoApiKey

    return useFetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&x_cg_demo_api_key=${apiKeyCoinGecko}`
    )
}
