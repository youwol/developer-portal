import { VirtualDOM } from "@youwol/flux-view";
import { AppState } from "./app-state";
import { MainPanelView } from "./views/projects/projects.view";
import { SideBarView } from "./views/side-bar.view";
import { TopBannerView } from "./views/top-banner.view";
import { UpdatesView } from "./views/updates/updates.view";


export class AppView implements VirtualDOM {

    public readonly class = "h-100 w-100 d-flex flex-column fv-bg-background fv-text-primary"
    public readonly state: AppState

    public readonly children: VirtualDOM[]

    constructor() {

        this.state = new AppState()
        this.children = [
            new TopBannerView({ state: this.state }),
            {
                class: 'flex-grow-1 d-flex',
                style: {
                    minHeight: '0px'
                },
                children: [
                    new SideBarView({ state: this.state }),
                    new MainPanelView({ state: this.state }),
                    new UpdatesView({ state: this.state })
                ]
            }
        ]
    }
}
