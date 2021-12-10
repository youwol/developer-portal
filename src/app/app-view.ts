import { VirtualDOM } from "@youwol/flux-view";
import { AppState } from "./app-state";
import { MainPanelView } from "./views/main-panel.view";
import { TopBannerView } from "./views/top-banner.view";


export class AppView implements VirtualDOM {

    public readonly class = "h-100 w-100 d-flex flex-column fv-bg-background fv-text-primary"
    public readonly state: AppState

    public readonly children: VirtualDOM[]

    constructor() {

        this.state = new AppState()
        this.children = [
            new TopBannerView({ state: this.state }),
            {
                class: 'flex-grow-1',
                children: [
                    new MainPanelView({ state: this.state })
                ]
            }
        ]
    }
}
