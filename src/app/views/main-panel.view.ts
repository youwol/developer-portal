import { VirtualDOM } from "@youwol/flux-view";
import { Tabs } from "@youwol/fv-tabs";
import { BehaviorSubject } from "rxjs";
import { AppState } from "../app-state";
import { DashboardView } from "./dashboard/dashboard.view";


export class DashboardTab extends Tabs.TabData {

    constructor() {
        super('dashboard', 'Dashboard')
    }
}

export class MainPanelView implements VirtualDOM {

    public readonly class = "w-100 h-100 p-3"
    public readonly state: AppState

    public readonly children: VirtualDOM[]

    public readonly tabsData$ = new BehaviorSubject<Tabs.TabData[]>([new DashboardTab()])

    constructor(params: { state: AppState }) {

        Object.assign(this, params)
        let tabState = new Tabs.State(this.tabsData$, 'dashboard')
        this.children = [
            new Tabs.View({
                state: tabState,
                contentView: (state, tabData) => {
                    return new DashboardView({ state: this.state })
                },
                headerView: (state, tabData) => {
                    return { innerText: tabData.name, class: 'p-1 rounded border' }
                },
                class: 'h-100 d-flex flex-column'
            } as any)
        ]
    }
}
