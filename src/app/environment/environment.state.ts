import { AppState } from '../app-state'

export class EnvironmentState {
    public readonly appState: AppState

    constructor(params: { appState: AppState }) {
        Object.assign(this, params)
    }
}
