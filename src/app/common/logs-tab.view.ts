import { DockableTabs } from '@youwol/rx-tab-views'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
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
export class LogsTabView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

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
    public readonly children: ChildrenLike

    constructor(params: { message$: WebSocketResponse$<unknown> }) {
        Object.assign(this, params)

        this.children = [new TerminalView(params.message$)]
    }
}
