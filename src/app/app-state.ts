import { BehaviorSubject, Observable } from 'rxjs'
import { map, shareReplay } from 'rxjs/operators'
import { DockableTabs } from '@youwol/rx-tab-views'
import { ProjectsTab, ProjectsState } from './projects'
import { CdnTab, CdnState } from './cdn'
import { EnvironmentTab, EnvironmentState } from './environment'
import { AnyVirtualDOM, VirtualDOM } from '@youwol/rx-vdom'
import * as pyYw from '@youwol/local-youwol-client'
import { LeftNavTab } from './common'
import { SystemState, SystemTab } from './system'
import { WsRouter } from '@youwol/local-youwol-client'

export type Topic =
    | 'Projects'
    | 'Updates'
    | 'CDN'
    | 'Admin'
    | 'Environment'
    | 'System'

export interface Screen {
    topic: Topic
    viewId: string
    view: AnyVirtualDOM
}

pyYw.PyYouwolClient.ws = new WsRouter({
    autoReconnect: true,
    autoReconnectDelay: 1000,
})
/**
 * @category State
 */
export class AppState {
    /**
     * @group Immutable Constants
     */
    public readonly environmentClient = new pyYw.PyYouwolClient().admin
        .environment

    /**
     * @group Observables
     */
    public readonly environment$: Observable<pyYw.Routers.Environment.EnvironmentStatusResponse>

    /**
     * @group State
     */
    public readonly projectsState: ProjectsState

    /**
     * @group State
     */
    public readonly cdnState: CdnState

    /**
     * @group State
     */
    public readonly environmentState: EnvironmentState

    /**
     * @group State
     */
    public readonly systemState: SystemState

    /**
     * @group State
     */
    public readonly leftNavState: DockableTabs.State

    /**
     * @group Immutable Constants
     */
    public readonly leftNavTabs: Record<
        Topic,
        LeftNavTab<unknown, VirtualDOM<'div'>>
    >

    /**
     * @group Observables
     */
    public readonly selectedTopic$ = new BehaviorSubject<Topic>('Environment')

    /**
     * @group Observables
     */
    public readonly selectedScreen$: BehaviorSubject<Screen>
    /**
     * @group Observables
     */
    public readonly connectedLocal$: Observable<boolean>

    /**
     * @group Observables
     */
    public readonly inMemoryScreens$: BehaviorSubject<{
        [k: string]: Screen
    }> = new BehaviorSubject({})

    constructor() {
        this.environment$ = this.environmentClient.webSocket.status$().pipe(
            map(({ data }) => data),
            shareReplay(1),
        )
        this.connectedLocal$ = pyYw.PyYouwolClient.ws.connected$
        this.projectsState = new ProjectsState({ appState: this })
        this.cdnState = new CdnState({ appState: this })
        this.environmentState = new EnvironmentState({ appState: this })

        this.systemState = new SystemState({ appState: this })
        this.leftNavTabs = {
            Environment: new EnvironmentTab({
                environmentState: this.environmentState,
            }),
            Projects: new ProjectsTab({ projectsState: this.projectsState }),
            Updates: undefined,
            CDN: new CdnTab({ cdnState: this.cdnState }),
            Admin: undefined,
            System: new SystemTab({ systemState: this.systemState }),
        }
        this.leftNavState = new DockableTabs.State({
            disposition: 'left',
            viewState$: new BehaviorSubject<DockableTabs.DisplayMode>('pined'),
            tabs$: new BehaviorSubject(
                Object.values(this.leftNavTabs).filter((d) => d != undefined),
            ),
            selected$: new BehaviorSubject<Topic>('Environment'),
        })
        const startingScreen =
            this.leftNavTabs[this.selectedTopic$.getValue()].defaultScreen()

        this.selectedScreen$ = new BehaviorSubject<Screen>(startingScreen)
        this.registerScreen(startingScreen)

        this.environmentClient.getStatus$().subscribe()
        this.leftNavState.selected$.subscribe((topic: Topic) => {
            this.selectedTopic$.next(topic)
            const defaultScreen = this.leftNavTabs[topic].defaultScreen()
            this.registerScreen(defaultScreen)
        })
    }

    registerScreen(screen: Screen, display = true) {
        const screens = this.inMemoryScreens$.getValue()
        const screenId = `#${screen.topic}-${screen.viewId}`
        if (screens[screenId] == undefined) {
            screens[screenId] = screen
            this.inMemoryScreens$.next(screens)
        }
        display && this.selectedScreen$.next(screen)
        return screenId
    }

    removeScreen(screenId: string) {
        const screens = this.inMemoryScreens$.getValue()
        delete screens[screenId]
        this.inMemoryScreens$.next(screens)
        const topic = this.selectedTopic$.getValue()
        const defaultScreen = this.leftNavTabs[topic].defaultScreen()
        this.selectedScreen$.next(defaultScreen)
    }

    selectScreen(screenId: string) {
        const screen = this.inMemoryScreens$.getValue()[screenId]
        this.selectedScreen$.next(screen)
    }

    selectDefaultScreen(topic: Topic) {
        const screen = this.leftNavTabs[topic].defaultScreen()
        this.selectedScreen$.next(screen)
    }
}
