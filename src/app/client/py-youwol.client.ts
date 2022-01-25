import { Subject } from 'rxjs'
import { LocalCdnRouter } from './cdn-local.router'
import { EnvironmentRouter } from './environment.router'
import { ContextMessage } from './models'
import { ProjectsRouter } from './projects.router'
import { SystemRouter } from './system.router'

export class PyYouwolClient {
    static urlBase = '/admin'

    private static webSocketUser$: Subject<ContextMessage>

    static headers: { [key: string]: string } = {}

    static connectWs() {
        if (PyYouwolClient.webSocketUser$) {
            return PyYouwolClient.webSocketUser$
        }

        PyYouwolClient.webSocketUser$ = PyYouwolClient._connectWs(`ws://${window.location.host}/ws`)
        return PyYouwolClient.webSocketUser$
    }

    static _connectWs(path: string) {

        let channel$ = new Subject<ContextMessage>()
        const ws = new WebSocket(path)
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)
            // console.log("PyYouwolClient", data)
            if (event.data != {}) {
                channel$.next(data)
            }
        }
        return channel$
    }

    static environment = EnvironmentRouter
    static projects = ProjectsRouter
    static localCdn = LocalCdnRouter
    static system = SystemRouter
}
