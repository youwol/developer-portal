import { attr$, childrenWithReplace$, VirtualDOM } from '@youwol/flux-view'
import { AppState, Screen } from './app-state'
import { DevPortalTopBannerView } from './top-banner.view'
import { DockableTabs } from '@youwol/fv-tabs'
import { map } from 'rxjs/operators'

/**
 * @category View
 */
export class AppView implements VirtualDOM {

    /**
     * @group Immutable DOM Constants
     */
    public readonly class =
        'h-100 w-100 d-flex flex-column fv-bg-background fv-text-primary'

    /**
     * @group State
     */
    public readonly state: AppState

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor() {
        this.state = new AppState()
        let sideNav = new DockableTabs.View({
            state: this.state.leftNavState,
            styleOptions: { initialPanelSize: '350px' },
        })

        this.children = [
            new DevPortalTopBannerView({ state: this.state }),
            {
                class: 'flex-grow-1 d-flex',
                style: {
                    minHeight: '0px',
                    position: 'relative',
                },
                children: [sideNav, new ContentView({ state: this.state })],
            },
        ]
    }
}

/**
 * @category View
 */
export class ContentView implements VirtualDOM {

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'h-100 flex-grow-1'

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        minWidth: '0px',
    }

    /**
     * @group State
     */
    public readonly state: AppState

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor(params: { state: AppState }) {
        Object.assign(this, params)

        const wrapChild$ = (targetScreen: Screen) => ({
            class: attr$(this.state.selectedScreen$, (screen) =>
                screen.viewId == targetScreen.viewId &&
                screen.topic == targetScreen.topic
                    ? 'h-100 w-100'
                    : 'd-none',
            ),
            children: [targetScreen.view],
        })
        this.children = [
            {
                class: 'w-100 h-100',
                style: { minHeight: '0px' },
                children: childrenWithReplace$(
                    this.state.inMemoryScreens$.pipe(
                        map((screens) => Object.values(screens)),
                    ),
                    (s) => wrapChild$(s),
                ),
            },
        ]
    }
}
