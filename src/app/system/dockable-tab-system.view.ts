import { VirtualDOM } from '@youwol/flux-view'
import {
    leftNavSectionAttr$,
    Section,
    SectionHeader,
} from '../common/utils-view'
import { SystemState } from './system.state'
import { AdminLogsView } from './logs/admin.view'
import { LeftNavTab } from '../common/left-nav-tabs'

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

export class SystemTabView implements VirtualDOM {
    public readonly systemState: SystemState
    public readonly class = 'p-2 d-flex flex-column h-100'
    public readonly style = {
        minHeight: '0px',
    }
    public readonly children: VirtualDOM[]

    constructor(params: { systemState: SystemState }) {
        Object.assign(this, params)

        this.children = [new SectionLogs({ systemState: this.systemState })]
    }
}

class SectionLogs extends Section {
    public readonly systemState: SystemState
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
