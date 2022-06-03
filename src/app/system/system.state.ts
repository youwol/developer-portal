import { AppState } from '../app-state'

export class SystemState {
    public readonly appState: AppState

    constructor(params: { appState: AppState }) {
        Object.assign(this, params)
    }
}
