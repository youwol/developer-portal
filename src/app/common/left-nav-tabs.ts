import { DockableTabs } from '@youwol/rx-tab-views'
import { Screen, Topic } from '../app-state'
import { VirtualDOM } from '@youwol/rx-vdom'

/**
 * @category View
 */
export class LeftNavTab<
    TTabState,
    TTabView extends VirtualDOM<'div'>,
> extends DockableTabs.Tab {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    /**
     * @group States
     */
    public readonly state: TTabState

    /**
     * @group Immutable Constants
     */
    public readonly defaultViewId: string

    /**
     * @group Immutable Constants
     */
    public readonly defaultView: () => VirtualDOM<'div'>

    /**
     * @group Immutable Constants
     */
    public readonly topic: Topic

    protected constructor(params: {
        topic: Topic
        defaultViewId: string
        defaultView: () => VirtualDOM<'div'>
        state: TTabState
        content: () => TTabView
        title: string
        icon: string
    }) {
        super({ ...params, id: params.topic })
        Object.assign(this, params)
    }

    defaultScreen(): Screen {
        return {
            topic: this.topic,
            viewId: this.defaultViewId,
            view: this.defaultView(),
        }
    }
}
