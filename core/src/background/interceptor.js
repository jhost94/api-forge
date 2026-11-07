class Interceptor {

    static originalFetch = null;
    static initialized = false;

    static initialize() {
        if (this.initialized) return;
        this.initialized = true;

        this.originalFetch = window.fetch;

        window.fetch = async function(...args) {
            const response = await Interceptor.originalFetch.apply(this, args);

            const input = args[0];
            const url = input instanceof Request
                ? input.url
                : String(input);

            if (url.includes('links.PORTUGAL.json')) {
                console.log(
                    '[ApiForge] Website received:',
                    await response.clone().text()
                );
            }

            return response;
        };

        console.log('[ApiForge] Fetch observer initialized');
    }
}