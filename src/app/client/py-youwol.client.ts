import { ReplaySubject } from "rxjs";
import { EnvironmentRouter } from "./environment.router";


export class PyYouwolClient {

    static urlBase = '/admin'

    private static webSocket$: ReplaySubject<any>

    static headers: { [key: string]: string } = {}

    static connectWs() {

        if (PyYouwolClient.webSocket$)
            return PyYouwolClient.webSocket$

        PyYouwolClient.webSocket$ = new ReplaySubject()
        var ws = new WebSocket(`ws://${window.location.host}/ws`);
        ws.onmessage = (event) => {
            PyYouwolClient.webSocket$.next(JSON.parse(event.data))
        };
        return PyYouwolClient.webSocket$
    }

    static environment = EnvironmentRouter
}
