import { VirtualDOM } from "@youwol/flux-view";
import { Tabs } from "@youwol/fv-tabs";

import { BehaviorSubject } from "rxjs";
import { map } from "rxjs/operators";
import { AppState } from "../app-state";
import { Project } from "../client/models";
import { DashboardView } from "./dashboard/dashboard.view";
import { ProjectView } from "./project/project.view";
import { TerminalView } from "./terminal/terminal.view";


export class DashboardTab extends Tabs.TabData {

    constructor() {
        super('dashboard', 'Dashboard')
    }

    view(state: AppState): VirtualDOM {

        return new DashboardView({ state })
    }
}

export class ProjectTab extends Tabs.TabData {


    constructor(public readonly project: Project) {
        super(project.name, project.name)
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
                contentView: (state, tabData: DashboardTab | ProjectTab) => {
                    return tabData.view(this.state)
                },
                headerView: (state, tabData: DashboardTab | ProjectTab) => {
                    return { innerText: tabData.name, class: 'p-1 rounded border' }
                },
                class: 'h-50 d-flex flex-column'
            } as any
            ),
            new TerminalView(params)
        ]
    }
}
