import { AppState } from '../app-state'
import { PyYouwol as pyYw, raiseHTTPErrors, send$ } from '@youwol/http-clients'
import { Observable } from 'rxjs'
import { map, mergeMap, shareReplay } from 'rxjs/operators'
import { CommandView } from './command/command.view'

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

export class EnvironmentState {
    public readonly client = new pyYw.PyYouwolClient().admin.environment
    public readonly environment$: Observable<pyYw.EnvironmentStatusResponse>
    public readonly appState: AppState

    public readonly customDispatches$: Observable<{
        [k: string]: pyYw.CustomDispatch[]
    }>

    constructor(params: { appState: AppState }) {
        Object.assign(this, params)
        this.environment$ = this.appState.environment$
        this.customDispatches$ = this.environment$.pipe(
            mergeMap(() => this.client.queryCustomDispatches$()),
            raiseHTTPErrors(),
            map((response) => response.dispatches),
            shareReplay(1),
        )
    }

    openCommand(command: pyYw.Command) {
        this.appState.registerScreen({
            topic: 'Projects',
            viewId: command.name,
            view: new CommandView({
                environmentState: this,
                command,
            }),
        })
    }

    executeNoBodyCommand$({ url, method }: { url: string; method: Method }) {
        return send$('query', url, {
            method,
        }).pipe(raiseHTTPErrors())
    }

    executeWithBodyCommand$({
        url,
        body,
        method,
    }: {
        url: string
        method: Method
        body: unknown
    }) {
        return send$('update', url, {
            method,
            json: body,
        }).pipe(raiseHTTPErrors())
    }
}
