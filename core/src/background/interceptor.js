class Interceptor {

    static endpoints = [];
    static originalFetch = null;

    static findEndpoint(url, method) {
        return this.endpoints.find(endpoint =>
            endpoint.enabled &&
            endpoint.url === url &&
            endpoint.method.toUpperCase() === method.toUpperCase()
        );
    }

    static createResponse(endpoint) {
        const { status, headers, body } = endpoint.response;

        return new Response(
            [204, 205, 304].includes(status) ? null : body,
            { status, headers }
        );
    }

    static initialize() {
        if (this.originalFetch) return;

        this.originalFetch = window.fetch;

        window.fetch = function(input, init) {
            const url = input instanceof Request
                ? input.url
                : new URL(String(input), window.location.href).href;

            const method = (
                init?.method ||
                (input instanceof Request ? input.method : 'GET')
            ).toUpperCase();

            const endpoint = Interceptor.findEndpoint(url, method);

            if (endpoint) {
                console.log('[ApiForge] Intercepted:', method, url);
                return Promise.resolve(Interceptor.createResponse(endpoint));
            }

            return Interceptor.originalFetch.apply(this, arguments);
        };

        window.addEventListener('message', event => {
            if (
                event.source !== window ||
                event.data?.source !== 'APIFORGE_EXTENSION' ||
                event.data?.type !== 'UPDATE_ENDPOINTS' ||
                !Array.isArray(event.data.endpoints)
            ) {
                return;
            }

            this.endpoints = event.data.endpoints;
        });

        window.postMessage({
            source: 'APIFORGE_PAGE',
            type: 'REQUEST_ENDPOINTS'
        }, window.location.origin);
    }
}
