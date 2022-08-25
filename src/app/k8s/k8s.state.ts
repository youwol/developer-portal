import { AppState } from '../app-state'
import { PyYouwol as pyYw } from '@youwol/http-clients'
import { Observable } from 'rxjs'

/**
 * @category State
 */
export class K8sState {
    /**
     * @group Observables
     */
    public readonly environment$: Observable<pyYw.EnvironmentStatusResponse>

    /**
     * @group States
     */
    public readonly appState: AppState

    constructor(params: { appState: AppState }) {
        Object.assign(this, params)
        this.environment$ = this.appState.environment$
    }
}
