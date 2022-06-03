import { AppState } from '../app-state'
import { PyYouwol as pyYw } from '@youwol/http-clients'
import { Observable } from 'rxjs'

export class K8sState {
    public readonly environment$: Observable<pyYw.EnvironmentStatusResponse>
    public readonly appState: AppState

    constructor(params: { appState: AppState }) {
        Object.assign(this, params)
        this.environment$ = this.appState.environment$
    }
}
