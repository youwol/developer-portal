import { Observable } from 'rxjs'
import { requestToJson$, requestToText$ } from './utils'

export class SystemRouter {
    private static urlBase = '/admin/system'
    static headers = {}

    static folderContent$(path): Observable<{
        configurations: string[]
        folders: string[]
        files: string[]
    }> {
        const url = `${SystemRouter.urlBase}/folder-content`
        const body = { path }
        const request = new Request(url, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                ...SystemRouter.headers,
                'content-type': 'application/json',
            },
        })
        return requestToJson$(request) as Observable<{
            configurations: string[]
            folders: string[]
            files: string[]
        }>
    }

    static fileContent$(path): Observable<string> {
        const url = `${SystemRouter.urlBase}/file/${path}`
        const request = new Request(url)
        return requestToText$(request) as Observable<string>
    }
}
