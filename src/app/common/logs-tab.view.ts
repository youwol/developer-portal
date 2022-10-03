import { DockableTabs } from '@youwol/fv-tabs'
import { VirtualDOM } from '@youwol/flux-view'
import { TerminalView } from './terminal'
import { WebSocketResponse$ } from '@youwol/http-primitives'

/**
 * @category View
 */
export class LogsTab extends DockableTabs.Tab {
    constructor(params: { message$: WebSocketResponse$<unknown> }) {
        super({
            id: 'logs',
            title: 'Logs',
            icon: 'fas fa-volume-up',
            content: () => {
                return new LogsTabView({
                    message$: params.message$,
                })
            },
        })
    }
}

/**
 * @Category View
 */
export class LogsTabView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'p-2 d-flex flex-column overflow-auto'

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        minHeight: '500px',
        maxHeight: '500px',
    }

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor(params: { message$: WebSocketResponse$<unknown> }) {
        Object.assign(this, params)

        this.children = [new TerminalView(params.message$)]
    }
}
