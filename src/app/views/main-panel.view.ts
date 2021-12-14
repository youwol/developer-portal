import { VirtualDOM } from "@youwol/flux-view";
import { Tabs } from "@youwol/fv-tabs";

import { map } from "rxjs/operators";
import { AppState } from "../app-state";
import { Project } from "../client/models";
import { DashboardView } from "./dashboard/dashboard.view";
import { ProjectView } from "./project/project.view";


export class DashboardTab extends Tabs.TabData {

    constructor() {
        super('dashboard', 'Dashboard')
    }

    headerView(state: AppState): VirtualDOM {
        return {
            innerText: 'Dashboard',
            class: 'p-1 rounded border'
        }
    }

    view(state: AppState): VirtualDOM {

        return new DashboardView({ state })
    }
}

export class ProjectTab extends Tabs.TabData {


    constructor(public readonly project: Project) {
        super(project.id, project.name)
    }

    headerView(state: AppState): VirtualDOM {
        return {
            class: ' d-flex align-items-center p-1 rounded border',
            children: [
                {
                    innerText: this.name,
                },
                {
                    class: 'fas fa-times fv-text-error fv-xx-darker fv-hover-xx-lighter pl-2 mx-2',
                    onclick: (ev) => {
                        ev.stopPropagation()
                        state.closeProject(this.id)
                    }
                }
            ]
        }
    }

    view(state: AppState): VirtualDOM {

        return new ProjectView({ state, project: this.project })
    }
}

export class MainPanelView implements VirtualDOM {

    public readonly class = "w-100 h-100 p-3"
    public readonly state: AppState

    public readonly children: VirtualDOM[]


    constructor(params: { state: AppState }) {

        Object.assign(this, params)
        let tabsData$ = this.state.openProjects$.pipe(
            map(projects => [new DashboardTab(), ...projects.map(p => new ProjectTab(p))])
        )

        let tabState = new Tabs.State(tabsData$, this.state.selectedTabId$)

        this.children = [
            new Tabs.View({
                state: tabState,
                contentView: (_, tabData: DashboardTab | ProjectTab) => {
                    return tabData.view(this.state)
                },
                headerView: (_, tabData: DashboardTab | ProjectTab) => {
                    return tabData.headerView(this.state)
                },
                class: 'h-100 d-flex flex-column'
            } as any
            )
        ]
    }
}
