import { ReplaySubject } from "rxjs";
import { EnvironmentRouter } from "./environment.router";
import { ContextMessage } from "./models";
import { ProjectsRouter } from "./projects.router";
import { SystemRouter } from "./system.router";


export class PyYouwolClient {

    static urlBase = '/admin'

    private static webSocket$: ReplaySubject<ContextMessage>

    static headers: { [key: string]: string } = {}

    static connectWs() {

        if (PyYouwolClient.webSocket$)
            return PyYouwolClient.webSocket$

        PyYouwolClient.webSocket$ = new ReplaySubject(1)
        var ws = new WebSocket(`ws://${window.location.host}/ws`);
        ws.onmessage = (event) => {

            let data = JSON.parse(event.data)
            // console.log("PyYouwolClient", data)
            if (event.data != {})
                PyYouwolClient.webSocket$.next(data)
        };
        return PyYouwolClient.webSocket$
    }

    static environment = EnvironmentRouter
    static projects = ProjectsRouter
    static system = SystemRouter
}
