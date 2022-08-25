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

/**
 * @category View
 */
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

/**
 * @category View
 */
export class EnvironmentTabView implements VirtualDOM {
    /**
     * @group States
     */
    public readonly environmentState: EnvironmentState

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

/**
 * @category View
 */
export class SectionDashboard extends Section {
    /**
     * @group States
     */
    public readonly environmentState: EnvironmentState

    /**
     * @group Immutable DOM Constants
     */
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

/**
 * @category View
 */
export class SectionConfigFile extends Section {
    /**
     * @group States
     */
    public readonly environmentState: EnvironmentState

    /**
     * @group Immutable DOM Constants
     */
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

/**
 * @category View
 */
export class DispatchListView implements VirtualDOM {

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'pl-4 flex-grow-1 overflow-auto'

    /**
     * @group Immutable DOM Constants
     */
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

/**
 * @category View
 */
export class DispatchGroupHeader implements VirtualDOM {

    /**
     * @group Immutable DOM Constants
     */
    public readonly type: string

    /**
     * @group Immutable DOM Constants
     */
    public readonly innerText: string

    constructor(params: { type: string }) {
        Object.assign(this, params)
        this.innerText = this.type
    }
}

/**
 * @category View
 */
export class DispatchItemView implements VirtualDOM {

    /**
     * @group Immutable DOM Constants
     */
    public readonly class =
        'fv-pointer fv-hover-bg-background-alt rounded d-flex align-items-center'

    /**
     * @group Immutable Constants
     */
    public readonly dispatch: pyYw.CustomDispatch

    /**
     * @group Immutable DOM Constants
     */
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

/**
 * @category View
 */
export class SectionDispatches extends Section {
    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        minHeight: '0px',
        maxHeight: '50%',
    }
    /**
     * @group Immutable DOM Constants
     */
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

/**
 * @category View
 */
export class CommandsListView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'pl-4 flex-grow-1 overflow-auto'

    /**
     * @group Immutable DOM Constants
     */
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

/**
 * @category View
 */
export class CommandView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class =
        'fv-pointer fv-hover-bg-background-alt rounded d-flex align-items-center'

    /**
     * @group Immutable DOM Constants
     */
    public readonly innerText: string

    /**
     * @group States
     */
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

/**
 * @category View
 */
export class SectionCommands extends Section {
    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        minHeight: '0px',
        maxHeight: '50%',
    }
    /**
     * @group Immutable DOM Constants
     */
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
