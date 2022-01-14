import { requestToJson$ } from './utils'

export enum ComponentUpdateStatus {
    PENDING = 'PENDING',
    SYNC = 'SYNC',
    OUTDATED = 'OUTDATED',
}

export interface ComponentUpdate {
    name: string
    localVersion: string
    latestVersion: string
    status: ComponentUpdateStatus
}

export interface ComponentsUpdate {
    status: ComponentUpdateStatus
    components: ComponentUpdate[]
}

export function instanceOfComponentUpdates(
    object: any,
): object is ComponentsUpdate {
    return object.status && object.components
}

export class EnvironmentRouter {
    private static urlBase = '/admin/environment'
    static headers = {}

    static status$() {
        const url = `${EnvironmentRouter.urlBase}/status`
        const request = new Request(url, {
            method: 'GET',
            headers: EnvironmentRouter.headers,
        })
        return requestToJson$(request)
    }

    static login$(body) {
        const url = `${EnvironmentRouter.urlBase}/login`
        const request = new Request(url, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                ...EnvironmentRouter.headers,
                'content-type': 'application/json',
            },
        })
        return requestToJson$(request)
    }
}
