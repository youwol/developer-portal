import { AppState } from '../app-state'

/**
 * @category State
 */
export class SystemState {
    /**
     * @group States
     */
    public readonly appState: AppState

    constructor(params: { appState: AppState }) {
        Object.assign(this, params)
    }
}
