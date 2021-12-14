
import { Observable } from "rxjs"
import { requestToJson$ } from "./utils"


export class SystemRouter {

    private static urlBase = '/admin/system'
    static headers = {}

    static folderContent$(path)
        : Observable<{ configurations: string[], folders: string[], files: string[] }> {

        let url = `${SystemRouter.urlBase}/folder-content`
        let body = { path }
        let request = new Request(url, { method: 'POST', body: JSON.stringify(body), headers: SystemRouter.headers })
        return requestToJson$(request) as Observable<{ configurations: string[], folders: string[], files: string[] }>
    }
}
