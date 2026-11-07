class Background {

    static STORAGE_KEY = 'endpoints';
    static endpoints = [];
    static initialized = false;

    static async initialize() {
        if (this.initialized) return;
        this.initialized = true;

        browser.webRequest.onHeadersReceived.addListener(
            details => this.handleResponse(details),
            { urls: ['<all_urls>'] },
            ['blocking']
        );

        browser.storage.onChanged.addListener((changes, area) => {
            if (area !== 'local' || !changes[this.STORAGE_KEY]) return;

            this.endpoints = changes[this.STORAGE_KEY].newValue ?? [];
        });

        this.loadEndpoints().then(() => {
            console.log('[ApiForge] Network interceptor ready');
        });
        // if (this.initialized) return;
        // this.initialized = true;

        // await this.loadEndpoints();

        // browser.storage.onChanged.addListener((changes, area) => {
        //     if (area !== 'local' || !changes[this.STORAGE_KEY]) {
        //         return;
        //     }

        //     this.endpoints = changes[this.STORAGE_KEY].newValue ?? [];
        // });

        // browser.webRequest.onBeforeRequest.addListener(
        //     details => this.handleRequest(details),
        //     {
        //         urls: ['<all_urls>']
        //     }
        // );

        // browser.webRequest.onHeadersReceived.addListener(
        //     details => this.handleResponse(details),
        //     {
        //         urls: ['<all_urls>']
        //     },
        //     ['blocking']
        // );

        // console.log('[ApiForge] Network interceptor ready');
    }

    static async loadEndpoints() {
        const result = await browser.storage.local.get(this.STORAGE_KEY);
        this.endpoints = result[this.STORAGE_KEY] ?? [];
    }

    static findEndpoint(url, method) {
        return this.endpoints.find(endpoint =>
            endpoint.enabled &&
            endpoint.method?.toUpperCase() === method.toUpperCase() &&
            endpoint.url === url
        );
    }

    static handleResponse(details) {
        if (details.method !== 'GET') return;

        const endpoint = this.findEndpoint(details.url, details.method);
        if (!endpoint) return;

        console.log('[ApiForge] Replacing response:', details.url);

        try {
            const filter = browser.webRequest.filterResponseData(
                details.requestId
            );

            const body = new TextEncoder().encode(
                endpoint.response?.body ?? ''
            );

            filter.ondata = () => {
                // Discard original response chunks.
            };

            filter.onstop = () => {
                filter.write(body);
                filter.close();

                console.log('[ApiForge] Mock delivered:', details.url);
            };

            filter.onerror = () => {
                console.error(
                    '[ApiForge] Filter error:',
                    filter.error
                );
            };

        } catch (error) {
            console.error('[ApiForge] Filter creation failed:', error);
        }
    }

    static handleRequest(details) {
        if (details.method !== 'GET') return;

        const endpoint = this.findEndpoint(details.url, details.method);
        if (!endpoint) return;

        console.log('[ApiForge] Replacing response:', details.url);

        try {
            const filter = browser.webRequest.filterResponseData(
                details.requestId
            );

            const body = endpoint.response?.body ?? '';
            const encoded = new TextEncoder().encode(body);

            // Discard the original response chunks.
            filter.ondata = () => {};

            filter.onstop = () => {
                filter.write(encoded);
                filter.close();

                console.log('[ApiForge] Mock body delivered:', details.url);
            };

            filter.onerror = () => {
                console.error(
                    '[ApiForge] Response filter error:',
                    filter.error
                );
            };

        } catch (error) {
            console.error('[ApiForge] Failed to create filter:', error);
        }
    }
}
