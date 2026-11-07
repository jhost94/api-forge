const STORAGE_KEY = 'endpoints';
class EndpointStorage {

    static async getAll() {
        const result = await browser.storage.local.get(STORAGE_KEY);
        return result[STORAGE_KEY] ?? [];
    }

    static async save(endpoints) {
        await browser.storage.local.set({
            [STORAGE_KEY]: endpoints
        });
    }

    static async add(endpoint) {
        const endpoints = await this.getAll();

        endpoints.push(endpoint);

        await this.save(endpoints);
    }

    static async update(id, changes) {
        const endpoints = await this.getAll();

        const index = endpoints.findIndex(endpoint => endpoint.id === id);

        if (index === -1) {
            return false;
        }

        endpoints[index] = {
            ...endpoints[index],
            ...changes
        };

        await this.save(endpoints);

        return true;
    }

    static async delete(id) {
        const endpoints = await this.getAll();

        await this.save(
            endpoints.filter(endpoint => endpoint.id !== id)
        );
    }

    static async getById(id) {
        const endpoints = await this.getAll();

        return endpoints.find(endpoint => endpoint.id === id) ?? null;
    }
}
