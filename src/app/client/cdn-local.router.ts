import { DownloadPackagesBody } from "./models"

export class LocalCdnRouter {

    private static urlBase = '/admin/local-cdn'

    static headers = {}

    static triggerCollectUpdates() {

        let url = `${LocalCdnRouter.urlBase}/collect-updates`
        let request = new Request(url, {
            method: 'GET',
            headers: LocalCdnRouter.headers
        })
        fetch(request).then()
    }

    static download(body: DownloadPackagesBody) {

        let url = `${LocalCdnRouter.urlBase}/download`
        let request = new Request(url, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                ...LocalCdnRouter.headers,
                'content-type': 'application/json'
            }
        })
        fetch(request).then()
    }

}
