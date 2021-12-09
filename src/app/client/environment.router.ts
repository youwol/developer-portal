import { ReplaySubject } from "rxjs"
import { Environment } from "./models"
import { requestToJson$ } from "./utils"


export enum ComponentUpdateStatus {
    PENDING = "PENDING",
    SYNC = "SYNC",
    OUTDATED = "OUTDATED"
}


export interface ComponentUpdate {
    name: string,
    localVersion: string
    latestVersion: string
    status: ComponentUpdateStatus
}

export interface ComponentsUpdate {

    status: ComponentUpdateStatus
    components: ComponentUpdate[]
}

export function instanceOfComponentUpdates(object: any): object is ComponentsUpdate {

    return object.status && object.components
}


export class EnvironmentRouter {

    private static urlBase = '/admin/environment'
    public static environments$ = new ReplaySubject<Environment>(1)
    public static componentsUpdates$ = new ReplaySubject<ComponentsUpdate>(1)
    static headers = {}

    static status$() {

        let url = `${EnvironmentRouter.urlBase}/status`
        let request = new Request(url, { method: 'GET', headers: EnvironmentRouter.headers })
        return requestToJson$(request)
    }

    static fileContent$() {

        let url = `${EnvironmentRouter.urlBase}/file-content`
        let request = new Request(url, { method: 'GET', headers: EnvironmentRouter.headers })
        return requestToJson$(request)
    }

    static switchConfiguration$(body) {

        let url = `${EnvironmentRouter.urlBase}/switch-configuration`
        let request = new Request(url, { method: 'POST', body: JSON.stringify(body), headers: EnvironmentRouter.headers })
        return requestToJson$(request)
    }

    static syncUser$(body) {

        let url = `${EnvironmentRouter.urlBase}/sync-user`
        let request = new Request(url, { method: 'POST', body: JSON.stringify(body), headers: EnvironmentRouter.headers })
        return requestToJson$(request)
    }

    static login$(body) {

        let url = `${EnvironmentRouter.urlBase}/login`
        let request = new Request(url, { method: 'POST', body: JSON.stringify(body), headers: EnvironmentRouter.headers })
        return requestToJson$(request)
    }

    static selectRemoteGateway$(body: { name: string }) {

        let url = `${EnvironmentRouter.urlBase}/select-remote-gateway`
        let request = new Request(url, { method: 'POST', body: JSON.stringify(body), headers: EnvironmentRouter.headers })
        return requestToJson$(request)
    }

    static postConfigParameters$(body) {

        let url = `${EnvironmentRouter.urlBase}/configuration/parameters`
        let request = new Request(url, { method: 'POST', body: JSON.stringify(body), headers: EnvironmentRouter.headers })
        return requestToJson$(request)
    }

    static triggerAvailableUpdates() {

        let url = `${EnvironmentRouter.urlBase}/available-updates`
        let request = new Request(url, { method: 'GET', headers: EnvironmentRouter.headers })
        fetch(request).then()
    }

    static triggerSyncComponent(body) {
        let url = `${EnvironmentRouter.urlBase}/sync-component`
        let request = new Request(url, { method: 'POST', body: JSON.stringify(body), headers: EnvironmentRouter.headers })
        fetch(request).then()
    }
}
