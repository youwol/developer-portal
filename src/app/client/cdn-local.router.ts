import { DownloadPackagesBody } from './models'

export class LocalCdnRouter {
    private static urlBase = '/admin/local-cdn'

    static headers = {}

    static triggerCollectUpdates() {
        const url = `${LocalCdnRouter.urlBase}/collect-updates`
        const request = new Request(url, {
            method: 'GET',
            headers: LocalCdnRouter.headers,
        })
        fetch(request).then()
    }

    static download(body: DownloadPackagesBody) {
        const url = `${LocalCdnRouter.urlBase}/download`
        const request = new Request(url, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                ...LocalCdnRouter.headers,
                'content-type': 'application/json',
            },
        })
        fetch(request).then()
    }
}
