import {
    attr$,
    children$,
    childrenWithReplace$,
    Stream$,
    VirtualDOM,
} from '@youwol/flux-view'

import { map } from 'rxjs/operators'
import { AppState, Topic } from '../../app-state'
import { Project } from '../../client/models'
import { DashboardView } from './dashboard/dashboard.view'
import { ProjectView } from './project/project.view'

export class DashboardTab {
    public readonly id = 'dashboard'

    contentView(state: AppState) {
        return new DashboardView({ state })
    }

    headerView(_state: AppState): VirtualDOM {
        return {
            innerText: 'Dashboard',
            class: 'p-1 rounded border',
        }
    }
}

export class ProjectTab {
    public readonly id: string

    constructor(public readonly project: Project) {
        this.id = project.id
    }

    contentView(state: AppState) {
        return new ProjectView({ state, project: this.project })
    }

    headerView(state: AppState): VirtualDOM {
        return {
            class: ' d-flex align-items-center p-1 rounded border',
            children: [
                {
                    innerText: `${this.project.name}#${this.project.version}`,
                },
                {
                    class: 'fas fa-times fv-text-error fv-xx-darker fv-hover-xx-lighter pl-2 mx-2',
                    onclick: (ev) => {
                        ev.stopPropagation()
                        state.closeProject(this.project.id)
                    },
                },
            ],
        }
    }
}

export class MainPanelView implements VirtualDOM {
    public readonly class: Stream$<Topic, string>
    public readonly state: AppState

    public readonly children: VirtualDOM[]

    constructor(params: { state: AppState }) {
        Object.assign(this, params)
        const tabsData$ = this.state.openProjects$.pipe(
            map((projects) => [
                new DashboardTab(),
                ...projects.map((p) => new ProjectTab(p)),
            ]),
        )
        this.class = attr$(
            this.state.selectedTopic$,
            (topic: Topic) => (topic == 'Projects' ? ' d-flex' : 'd-none'),
            {
                wrapper: (d) => `${d} w-100 h-100 flex-column px-2 flex-grow-1`,
            },
        )
        const wrapChild$ = (targetId, view) => ({
            class: attr$(this.state.selectedTabId$, (id) =>
                id == targetId ? 'h-100' : 'd-none',
            ),
            children: [view],
        })
        this.children = [
            new HeaderView({ state: this.state, tabsData$ }),
            {
                class: 'flex-grow-1 border-top',
                style: { minHeight: '0px' },
                children: childrenWithReplace$(
                    tabsData$,
                    (tab: DashboardTab | ProjectTab) =>
                        wrapChild$(tab.id, tab.contentView(this.state)),
                    { comparisonOperator: (lhs, rhs) => lhs.id == rhs.id },
                ),
            },
        ]
    }
}

export class HeaderView implements VirtualDOM {
    public readonly class = 'w-100 d-flex align-items-center fv-pointer'
    public readonly children: any

    constructor(params: { state: AppState; tabsData$ }) {
        this.children = children$(params.tabsData$, (tabs) =>
            tabs.map((tab) => ({
                class: attr$(
                    params.state.selectedTabId$,
                    (id) => (id == tab.id ? 'fv-text-focus' : ''),
                    { wrapper: (d) => `${d} fv-hover-bg-background-alt` },
                ),
                children: [tab.headerView(params.state)],
                onclick: () => params.state.selectTab(tab.id),
            })),
        )
    }
}
