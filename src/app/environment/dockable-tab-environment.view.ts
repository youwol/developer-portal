import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import {
    commonClassesLeftSideNav,
    leftNavSectionAttr$,
    leftTabWidth,
    Section,
    SectionHeader,
    LeftNavTab,
} from '../common'
import { EnvironmentState } from './environment.state'
import { DashboardView } from './dashboard'
import * as pyYw from '@youwol/local-youwol-client'
import { ConfigFileView } from './config-file'

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
export class EnvironmentTabView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
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
    public readonly children: ChildrenLike

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
                icon: 'fas fa-th-large fv-pointer',
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
                icon: 'fas fa-file-alt fv-pointer',
            }),
        })
        Object.assign(this, params)
    }
}

/**
 * @category View
 */
export class DispatchListView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'pl-4 flex-grow-1 overflow-auto'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor({ environmentState }: { environmentState: EnvironmentState }) {
        this.children = {
            policy: 'replace',
            source$: environmentState.customDispatches$,
            vdomMap: (dispatches: {
                [k: string]: pyYw.Routers.Environment.CustomDispatch[]
            }) => {
                return Object.entries(dispatches).map(([type, items]) => {
                    return {
                        tag: 'div',
                        children: [
                            new DispatchGroupHeader({ type }),
                            {
                                tag: 'div',
                                children: items.map(
                                    (dispatch) =>
                                        new DispatchItemView({ dispatch }),
                                ),
                            },
                        ],
                    }
                })
            },
        }
    }
}

/**
 * @category View
 */
export class DispatchGroupHeader implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
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
export class DispatchItemView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    /**
     * @group Immutable DOM Constants
     */
    public readonly class =
        'fv-pointer fv-hover-bg-background-alt rounded d-flex align-items-center'

    /**
     * @group Immutable Constants
     */
    public readonly dispatch: pyYw.Routers.Environment.CustomDispatch

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor(params: { dispatch: pyYw.Routers.Environment.CustomDispatch }) {
        Object.assign(this, params)
        this.children = [
            {
                tag: 'div',
                class: this.dispatch.activated
                    ? 'fas fa-check fv-text-success px-2'
                    : 'fas fa-times fv-text-disabled px-2',
            },
            {
                tag: 'div',
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
                title: {
                    source$: environmentState.customDispatches$,
                    vdomMap: (dispatches) =>
                        `Dispatches (${
                            Object.values(dispatches).flat().length
                        })`,
                },
                icon: 'fas fa-external-link-alt',
            }),
            content: new DispatchListView({ environmentState }),
        })
    }
}

/**
 * @category View
 */
export class CommandsListView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'pl-4 flex-grow-1 overflow-auto'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor({ environmentState }: { environmentState: EnvironmentState }) {
        this.children = {
            policy: 'replace',
            source$: environmentState.environment$,
            vdomMap: (
                env: pyYw.Routers.Environment.EnvironmentStatusResponse,
            ) => {
                return Object.entries(env.configuration.commands).map(
                    ([_type, command]) =>
                        new CommandView({ command, environmentState }),
                )
            },
        }
    }
}

/**
 * @category View
 */
export class CommandView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
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
    public readonly command: pyYw.Routers.Environment.Command
    public readonly onclick = () => {
        this.environmentState.openCommand(this.command)
    }

    constructor(params: {
        command: pyYw.Routers.Environment.Command
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
                title: {
                    source$: environmentState.environment$,
                    vdomMap: (
                        env: pyYw.Routers.Environment.EnvironmentStatusResponse,
                    ) =>
                        `Commands (${
                            Object.values(env.configuration.commands).length
                        })`,
                },
                icon: 'fas fa-play',
            }),
            content: new CommandsListView({ environmentState }),
        })
    }
}
