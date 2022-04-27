import { VirtualDOM } from '@youwol/flux-view'
import {
    leftNavSectionAttr$,
    Section,
    SectionHeader,
} from '../common/utils-view'
import { EnvironmentState } from './environment.state'
import { AdminLogsView } from './logs/admin.view'
import { DashboardView } from './dashboard/dashboard.view'
import { LeftNavTab } from '../common/left-nav-tabs'

export class EnvironmentTab extends LeftNavTab<
    EnvironmentState,
    EnvironmentTabView
> {
    constructor(params: { environmentState: EnvironmentState }) {
        super({
            topic: 'Environment',
            title: 'Environment',
            icon: 'fas fa-cogs',
            defaultViewId: 'dashboard',
            defaultView: () =>
                new DashboardView({
                    environmentState: params.environmentState,
                }),
            state: params.environmentState,
            content: () => {
                return new EnvironmentTabView({
                    environmentState: params.environmentState,
                })
            },
        })
        Object.assign(this, params)
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
            new SectionDashboard({ environmentState: this.environmentState }),
            new SectionLogs({ environmentState: this.environmentState }),
        ]
    }
}

class SectionDashboard extends Section {
    public readonly environmentState: EnvironmentState
    public readonly onclick = () => {
        this.environmentState.appState.registerScreen({
            topic: 'Environment',
            viewId: 'dashboard',
            view: new DashboardView({
                environmentState: this.environmentState,
            }),
        })
        this.environmentState.appState.selectScreen('#Environment-dashboard')
    }
    constructor(params: { environmentState: EnvironmentState }) {
        super({
            header: new SectionHeader({
                class: leftNavSectionAttr$({
                    selectedScreen$:
                        params.environmentState.appState.selectedScreen$,
                    targetTopic: 'Environment',
                    targetViewId: 'dashboard',
                }),
                title: 'Dashboard',
                icon: 'fa-th-large fv-pointer',
            }),
        })
        Object.assign(this, params)
    }
}

class SectionLogs extends Section {
    public readonly environmentState: EnvironmentState
    public readonly onclick = () => {
        this.environmentState.appState.registerScreen({
            topic: 'Environment',
            viewId: 'logs',
            view: new AdminLogsView({
                environmentState: this.environmentState,
            }),
        })
    }
    constructor(params: { environmentState: EnvironmentState }) {
        super({
            header: new SectionHeader({
                class: leftNavSectionAttr$({
                    selectedScreen$:
                        params.environmentState.appState.selectedScreen$,
                    targetTopic: 'Environment',
                    targetViewId: 'logs',
                }),
                title: 'Logs',
                icon: 'fa-volume-up fv-pointer',
            }),
        })
        Object.assign(this, params)
    }
}
