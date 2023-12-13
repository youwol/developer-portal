import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { AppState, Screen } from './app-state'
import { DockableTabs } from '@youwol/rx-tab-views'
import { map } from 'rxjs/operators'
import { DevPortalTopBannerView } from './top-banner.view'

/**
 * @category View
 */
export class AppView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

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
    public readonly children: ChildrenLike

    constructor() {
        this.state = new AppState()
        const sideNav = new DockableTabs.View({
            state: this.state.leftNavState,
            styleOptions: { initialPanelSize: '350px' },
        })

        this.children = [
            new DevPortalTopBannerView({ state: this.state }),
            {
                tag: 'div',
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
export class ContentView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

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
    public readonly children: ChildrenLike

    constructor(params: { state: AppState }) {
        Object.assign(this, params)
        const wrapChild$ = (targetScreen: Screen): VirtualDOM<'div'> => ({
            tag: 'div',
            class: {
                source$: this.state.selectedScreen$,
                vdomMap: (screen: Screen) =>
                    screen.viewId == targetScreen.viewId &&
                    screen.topic == targetScreen.topic
                        ? 'h-100 w-100'
                        : 'd-none',
            },
            children: [targetScreen.view],
        })
        this.children = [
            {
                tag: 'div',
                class: 'w-100 h-100',
                style: { minHeight: '0px' },
                children: {
                    policy: 'sync',
                    source$: this.state.inMemoryScreens$.pipe(
                        map((screens) => Object.values(screens)),
                    ),
                    vdomMap: (s: Screen) => wrapChild$(s),
                },
            },
        ]
    }
}
