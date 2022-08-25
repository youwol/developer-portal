import { AppState } from '../app-state'
import {
    PyYouwol as pyYw,
    raiseHTTPErrors,
    send$,
    WebSocketResponse$,
} from '@youwol/http-clients'
import { Observable } from 'rxjs'
import { map, mergeMap, shareReplay } from 'rxjs/operators'
import { CommandView } from './command/command.view'

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

/**
 * @category Event
 */
export class CommandEvents {

    /**
     * @group Observables
     */
    log$: WebSocketResponse$<unknown>

    constructor(public readonly command: pyYw.Command) {
        this.log$ =
            new pyYw.PyYouwolClient().admin.customCommands.webSocket.log$({})
    }

    static fullId(flowId: string, stepId: string) {
        return `${flowId}#${stepId}`
    }
}

/**
 * @category State
 */
export class EnvironmentState {
    /**
     * @group Immutable Constants
     */
    public readonly client = new pyYw.PyYouwolClient().admin.environment

    /**
     * @group Observables
     */
    public readonly environment$: Observable<pyYw.EnvironmentStatusResponse>

    /**
     * @group State
     */
    public readonly appState: AppState

    /**
     * @group Immutable Constants
     */
    public readonly commandsEvent: { [k: string]: CommandEvents } = {}

    /**
     * @group Observables
     */
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
        if (!this.commandsEvent[command.name]) {
            this.commandsEvent[command.name] = new CommandEvents(command)
        }

        this.appState.registerScreen({
            topic: 'Environment',
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
