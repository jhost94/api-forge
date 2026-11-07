
class Popup {

    static editingId = null;

    static async initialize() {
        this.getElement('addEndpoint')
            .addEventListener('click', () => this.openEditor());

        this.getElement('cancel')
            .addEventListener('click', () => this.closeEditor());

        this.getElement('save')
            .addEventListener('click', () => this.saveEndpoint());

        await this.render();
    }

    static getElement(id) {
        return document.getElementById(id);
    }

    static resetEditor() {
        this.getElement('name').value = '';
        this.getElement('method').value = 'GET';
        this.getElement('url').value = '';
        this.getElement('status').value = '200';
        this.getElement('headers').value = JSON.stringify({
            'Content-Type': 'application/json'
        }, null, 2);
        this.getElement('body').value = '';
    }

    static openEditor(endpoint = null) {
        this.editingId = endpoint?.id ?? null;

        if (endpoint) {
            this.getElement('name').value = endpoint.name;
            this.getElement('method').value = endpoint.method;
            this.getElement('url').value = endpoint.url;
            this.getElement('status').value = endpoint.response.status;
            this.getElement('headers').value =
                JSON.stringify(endpoint.response.headers, null, 2);
            this.getElement('body').value = endpoint.response.body;
        } else {
            this.resetEditor();
        }

        this.getElement('editor').querySelector('h3').textContent =
            endpoint ? 'Edit endpoint' : 'Add endpoint';

        this.getElement('save').textContent =
            endpoint ? 'Save changes' : 'Save endpoint';

        this.getElement('editor').hidden = false;
    }

    static closeEditor() {
        this.getElement('editor').hidden = true;
        this.editingId = null;
    }

    static async render() {
        const list = this.getElement('endpoints');
        const endpoints = await EndpointStorage.getAll();

        list.replaceChildren();

        if (endpoints.length === 0) {
            list.textContent = 'No endpoints configured.';
            return;
        }

        for (const endpoint of endpoints) {
            const item = document.createElement('div');
            item.className = 'endpoint';

            const info = document.createElement('div');
            info.className = 'endpoint-info';

            const name = document.createElement('strong');
            name.textContent = endpoint.name;

            const details = document.createElement('small');
            details.textContent = `${endpoint.method} ${endpoint.url}`;

            info.append(name, details);

            const toggle = document.createElement('input');
            toggle.type = 'checkbox';
            toggle.checked = endpoint.enabled;
            toggle.title = 'Enable endpoint';

            toggle.addEventListener('change', async () => {
                await EndpointStorage.update(endpoint.id, {
                    enabled: toggle.checked
                });
            });

            const edit = document.createElement('button');
            edit.textContent = '✎';
            edit.title = 'Edit endpoint';
            edit.className = 'edit-button';

            edit.addEventListener('click', () => {
                this.openEditor(endpoint);
            });

            const remove = document.createElement('button');
            remove.textContent = '×';
            remove.title = 'Delete endpoint';
            remove.className = 'delete-button';

            remove.addEventListener('click', async () => {
                await EndpointStorage.delete(endpoint.id);
                await this.render();
            });

            item.append(info, toggle, edit, remove);
            list.append(item);
        }
    }

    static async saveEndpoint() {
        try {
            const headers = JSON.parse(this.getElement('headers').value);
            const status = Number(this.getElement('status').value);

            if (
                !Number.isInteger(status) ||
                status < 200 ||
                status > 599
            ) {
                throw new Error('Status must be between 200 and 599.');
            }

            if (
                headers === null ||
                typeof headers !== 'object' ||
                Array.isArray(headers)
            ) {
                throw new Error('Headers must be a JSON object.');
            }

            const endpoint = {
                name: this.getElement('name').value.trim() || 'Unnamed endpoint',
                method: this.getElement('method').value,
                url: this.getElement('url').value.trim(),
                response: {
                    status,
                    headers,
                    body: this.getElement('body').value
                }
            };

            if (!endpoint.url) {
                throw new Error('URL is required.');
            }

            if (this.editingId !== null) {
                const updated = await EndpointStorage.update(
                    this.editingId,
                    endpoint
                );

                if (!updated) {
                    throw new Error('Endpoint no longer exists.');
                }
            } else {
                await EndpointStorage.add({
                    ...endpoint,
                    id: crypto.randomUUID(),
                    enabled: true
                });
            }

            this.closeEditor();
            await this.render();

        } catch (error) {
            alert(error.message);
        }
    }
}
