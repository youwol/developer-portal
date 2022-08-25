import { VirtualDOM } from '@youwol/flux-view'
import {
    commonClassesLeftSideNav,
    leftNavSectionAttr$,
    leftTabWidth,
    Section,
    SectionHeader,
    LeftNavTab
} from '../common'
import { SystemState } from './system.state'
import { AdminLogsView } from './logs'

/**
 * @category View
 */
export class SystemTab extends LeftNavTab<SystemState, SystemTabView> {
    constructor(params: { systemState: SystemState }) {
        super({
            topic: 'System',
            title: 'System',
            icon: 'fas fa-cogs',
            defaultViewId: 'logs',
            defaultView: () =>
                new AdminLogsView({
                    systemState: this.state,
                }),
            state: params.systemState,
            content: () => {
                return new SystemTabView({
                    systemState: params.systemState,
                })
            },
        })
        Object.assign(this, params)
    }
}

/**
 * @category View
 */
export class SystemTabView implements VirtualDOM {

    /**
     * @group States
     */
    public readonly systemState: SystemState

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = commonClassesLeftSideNav

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        width: leftTabWidth,
    }

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor(params: { systemState: SystemState }) {
        Object.assign(this, params)

        this.children = [new SectionLogs({ systemState: this.systemState })]
    }
}

/**
 * @category View
 */
export class SectionLogs extends Section {

    /**
     * @group States
     */
    public readonly systemState: SystemState

    /**
     * @group Immutable DOM Constants
     */
    public readonly onclick = () => {
        this.systemState.appState.registerScreen({
            topic: 'System',
            viewId: 'logs',
            view: new AdminLogsView({
                systemState: this.systemState,
            }),
        })
    }
    constructor(params: { systemState: SystemState }) {
        super({
            header: new SectionHeader({
                class: leftNavSectionAttr$({
                    selectedScreen$:
                        params.systemState.appState.selectedScreen$,
                    targetTopic: 'System',
                    targetViewId: 'logs',
                }),
                title: 'Logs',
                icon: 'fa-volume-up fv-pointer',
            }),
        })
        Object.assign(this, params)
    }
}
