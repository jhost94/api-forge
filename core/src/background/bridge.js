class Bridge {

    static STORAGE_KEY = 'endpoints';

    static sendEndpoints(endpoints) {
        window.postMessage({
            source: 'APIFORGE_EXTENSION',
            type: 'UPDATE_ENDPOINTS',
            endpoints
        }, window.location.origin);
    }

    static async loadEndpoints() {
        const result = await browser.storage.local.get(this.STORAGE_KEY);
        this.sendEndpoints(result[this.STORAGE_KEY] ?? []);
    }

    static initialize() {
        window.addEventListener('message', event => {
            if (
                event.source !== window ||
                event.data?.source !== 'APIFORGE_PAGE' ||
                event.data?.type !== 'REQUEST_ENDPOINTS'
            ) {
                return;
            }

            this.loadEndpoints();
        });

        browser.storage.onChanged.addListener((changes, area) => {
            if (area !== 'local' || !changes[this.STORAGE_KEY]) return;

            this.sendEndpoints(changes[this.STORAGE_KEY].newValue ?? []);
        });

        this.loadEndpoints();
    }
}
