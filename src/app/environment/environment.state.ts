import { AppState } from '../app-state'
import { PyYouwol as pyYw, raiseHTTPErrors } from '@youwol/http-clients'
import { Observable } from 'rxjs'
import { map, shareReplay } from 'rxjs/operators'

export class EnvironmentState {
    public readonly environment$: Observable<pyYw.EnvironmentStatusResponse>
    public readonly appState: AppState

    public readonly customDispatches$ =
        new pyYw.PyYouwolClient().admin.environment
            .queryCustomDispatches$()
            .pipe(
                raiseHTTPErrors(),
                map((response) => response.dispatches),
                shareReplay(1),
            )
    constructor(params: { appState: AppState }) {
        Object.assign(this, params)
        this.environment$ = this.appState.environment$
    }
}
