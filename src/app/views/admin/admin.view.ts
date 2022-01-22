import {
    attr$,
    Stream$,
    VirtualDOM,
} from '@youwol/flux-view'


import { AppState, Topic } from '../../app-state'
import { TerminalView } from '../terminal/terminal.view'


export class AdminView implements VirtualDOM {

    public readonly class: Stream$<Topic, string>
    public readonly children: VirtualDOM[]
    public readonly state: AppState

    constructor(params: { state: AppState }) {
        Object.assign(this, params)

        this.class = attr$(
            this.state.selectedTopic$,
            (topic: Topic) => (topic == 'Admin' ? ' d-flex' : 'd-none'),
            {
                wrapper: (d) => `${d} w-100 h-100 flex-column p-2`,
            },
        )
        this.children = [
            new TerminalView(this.state.adminEvents.messages$),
        ]
    }
}
