import { DockableTabs } from '@youwol/fv-tabs'
import { Screen, Topic } from '../app-state'
import { VirtualDOM } from '@youwol/flux-view'

export class LeftNavTab<TTabState, TTabView> extends DockableTabs.Tab {
    public readonly state: TTabState
    public readonly defaultViewId: string
    public readonly defaultView: () => VirtualDOM
    public readonly topic: Topic

    protected constructor(params: {
        topic: Topic
        defaultViewId: string
        defaultView: () => VirtualDOM
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
