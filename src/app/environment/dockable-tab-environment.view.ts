import { attr$, children$, VirtualDOM } from '@youwol/flux-view'
import {
    commonClassesLeftSideNav,
    leftNavSectionAttr$,
    leftTabWidth,
    Section,
    SectionHeader,
} from '../common/utils-view'
import { EnvironmentState } from './environment.state'
import { DashboardView } from './dashboard/dashboard.view'
import { LeftNavTab } from '../common/left-nav-tabs'
import { PyYouwol as pyYw } from '@youwol/http-clients'
import { ConfigFileView } from './config-file/config-file.view'

export class EnvironmentTab extends LeftNavTab<
    EnvironmentState,
    EnvironmentTabView
> {
    constructor(params: { environmentState: EnvironmentState }) {
        super({
            topic: 'Environment',
            title: 'Environment',
            icon: 'fas fa-globe',
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
    public readonly class = commonClassesLeftSideNav
    public readonly style = {
        width: leftTabWidth,
    }
    public readonly children: VirtualDOM[]

    constructor(params: { environmentState: EnvironmentState }) {
        Object.assign(this, params)

        this.children = [
            new SectionDashboard({ environmentState: this.environmentState }),
            new SectionConfigFile({ environmentState: this.environmentState }),
            new SectionDispatches({ environmentState: this.environmentState }),
            new SectionCommands({ environmentState: this.environmentState }),
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

class SectionConfigFile extends Section {
    public readonly environmentState: EnvironmentState
    public readonly onclick = () => {
        this.environmentState.appState.registerScreen({
            topic: 'Environment',
            viewId: 'config-file',
            view: new ConfigFileView({
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
                    targetViewId: 'config-file',
                }),
                title: 'Config. file',
                icon: 'fa-file-alt fv-pointer',
            }),
        })
        Object.assign(this, params)
    }
}

class DispatchListView implements VirtualDOM {
    public readonly class = 'pl-4 flex-grow-1 overflow-auto'
    public readonly children

    constructor({ environmentState }: { environmentState: EnvironmentState }) {
        this.children = children$(
            environmentState.customDispatches$,
            (dispatches: { [k: string]: pyYw.CustomDispatch[] }) => {
                return Object.entries(dispatches).map(([type, items]) => {
                    return {
                        children: [
                            new DispatchGroupHeader({ type }),
                            {
                                children: items.map(
                                    (dispatch) =>
                                        new DispatchItemView({ dispatch }),
                                ),
                            },
                        ],
                    }
                })
            },
        )
    }
}

class DispatchGroupHeader implements VirtualDOM {
    public readonly type: string
    public readonly innerText: string
    constructor(params: { type: string }) {
        Object.assign(this, params)
        this.innerText = this.type
    }
}

class DispatchItemView implements VirtualDOM {
    public readonly class =
        'fv-pointer fv-hover-bg-background-alt rounded d-flex align-items-center'
    public readonly dispatch: pyYw.CustomDispatch
    public readonly children: VirtualDOM[]
    constructor(params: { dispatch: pyYw.CustomDispatch }) {
        Object.assign(this, params)
        this.children = [
            {
                class: this.dispatch.activated
                    ? 'fas fa-check fv-text-success px-2'
                    : 'fas fa-times fv-text-disabled px-2',
            },
            {
                innerHTML: this.dispatch.name,
            },
        ]
    }
}

class SectionDispatches extends Section {
    public readonly style = {
        minHeight: '0px',
        maxHeight: '50%',
    }
    public readonly class = 'my-2 flex-grow-1 d-flex flex-column'
    constructor({ environmentState }: { environmentState: EnvironmentState }) {
        super({
            header: new SectionHeader({
                title: attr$(
                    environmentState.customDispatches$,
                    (dispatches) =>
                        `Dispatches (${
                            Object.values(dispatches).flat().length
                        })`,
                ),
                icon: 'fa-external-link-alt',
            }),
            content: new DispatchListView({ environmentState }),
        })
    }
}

class CommandsListView implements VirtualDOM {
    public readonly class = 'pl-4 flex-grow-1 overflow-auto'
    public readonly children

    constructor({ environmentState }: { environmentState: EnvironmentState }) {
        this.children = children$(environmentState.environment$, (env) => {
            return Object.entries(env.configuration.commands).map(
                ([_type, command]) =>
                    new CommandView({ command, environmentState }),
            )
        })
    }
}

class CommandView implements VirtualDOM {
    public readonly class =
        'fv-pointer fv-hover-bg-background-alt rounded d-flex align-items-center'
    public readonly innerText: string
    public readonly environmentState: EnvironmentState
    public readonly command: pyYw.Command
    public readonly onclick = () => {
        this.environmentState.openCommand(this.command)
    }
    constructor(params: {
        command: pyYw.Command
        environmentState: EnvironmentState
    }) {
        Object.assign(this, params)
        this.innerText = this.command.name
    }
}

class SectionCommands extends Section {
    public readonly style = {
        minHeight: '0px',
        maxHeight: '50%',
    }
    public readonly class = 'my-2 flex-grow-1 d-flex flex-column'
    constructor({ environmentState }: { environmentState: EnvironmentState }) {
        super({
            header: new SectionHeader({
                title: attr$(
                    environmentState.environment$,
                    (env) =>
                        `Commands (${
                            Object.values(env.configuration.commands).length
                        })`,
                ),
                icon: 'fa-play',
            }),
            content: new CommandsListView({ environmentState }),
        })
    }
}
