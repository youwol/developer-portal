import { DockableTabs } from '@youwol/fv-tabs'
import { VirtualDOM } from '@youwol/flux-view'
import { Section, SectionHeader } from '../common/utils-view'
import { EnvironmentState } from './environment.state'
import { AdminLogsView } from './logs/admin.view'

export class EnvironmentTab extends DockableTabs.Tab {
    constructor(params: { environmentState: EnvironmentState }) {
        super({
            id: 'environment',
            title: 'Environment',
            icon: 'fas fa-cogs',
            content: () => {
                return new EnvironmentTabView({
                    environmentState: params.environmentState,
                })
            },
        })
    }
}

export class EnvironmentTabView implements VirtualDOM {
    public readonly environmentState: EnvironmentState
    public readonly class = 'p-2 d-flex flex-column h-100'
    public readonly style = {
        minHeight: '0px',
    }
    public readonly children: VirtualDOM[]

    constructor(params: { environmentState: EnvironmentState }) {
        Object.assign(this, params)

        this.children = [
            new SectionLogs({ environmentState: this.environmentState }),
        ]
    }
}

class SectionLogs extends Section {
    public readonly environmentState: EnvironmentState
    public readonly onclick = () => {
        this.environmentState.appState.registerScreen({
            topic: 'Environment',
            viewId: '#Environment-logs',
            view: new AdminLogsView({
                environmentState: this.environmentState,
            }),
        })
        this.environmentState.appState.selectScreen('#Environment-logs')
    }
    constructor(params: { environmentState: EnvironmentState }) {
        super({
            header: new SectionHeader({
                title: 'Logs',
                icon: 'fa-volume-up fv-pointer',
            }),
        })
        Object.assign(this, params)
    }
}
