import { BehaviorSubject, Observable } from 'rxjs'
import { map, shareReplay } from 'rxjs/operators'
import { DockableTabs } from '@youwol/fv-tabs'
import { ProjectsTab, ProjectsState} from './projects'
import { CdnTab, CdnState } from './cdn'
import { EnvironmentTab, EnvironmentState } from './environment'
import { VirtualDOM } from '@youwol/flux-view'
import { PyYouwol as pyYw } from '@youwol/http-clients'
import { K8sTab, K8sState } from './k8s'
import { LeftNavTab } from './common'
import { SystemState, SystemTab } from './system'

export type Topic =
    | 'Projects'
    | 'Updates'
    | 'CDN'
    | 'Admin'
    | 'Environment'
    | 'System'
    | 'K8s'

export interface Screen {
    topic: Topic
    viewId: string
    view: VirtualDOM
}

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
    public readonly environment$: Observable<pyYw.EnvironmentStatusResponse>

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
    public readonly k8sState: K8sState

    /**
     * @group State
     */
    public readonly leftNavState: DockableTabs.State

    /**
     * @group Immutable Constants
     */
    public readonly leftNavTabs: Record<Topic, LeftNavTab<unknown, unknown>>

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
    public readonly inMemoryScreens$: BehaviorSubject<{
        [k: string]: Screen
    }> = new BehaviorSubject({})

    constructor() {
        this.environment$ = this.environmentClient.webSocket.status$().pipe(
            map(({ data }) => data),
            shareReplay(1),
        )

        this.projectsState = new ProjectsState({ appState: this })
        this.cdnState = new CdnState({ appState: this })
        this.environmentState = new EnvironmentState({ appState: this })
        this.k8sState = new K8sState({ appState: this })
        this.systemState = new SystemState({ appState: this })
        this.leftNavTabs = {
            Environment: new EnvironmentTab({
                environmentState: this.environmentState,
            }),
            Projects: new ProjectsTab({ projectsState: this.projectsState }),
            Updates: undefined,
            CDN: new CdnTab({ cdnState: this.cdnState }),
            Admin: undefined,
            K8s: new K8sTab({ k8sState: this.k8sState }),
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

    registerScreen(screen: Screen, display: boolean = true) {
        let screens = this.inMemoryScreens$.getValue()
        let screenId = `#${screen.topic}-${screen.viewId}`
        if (screens[screenId] == undefined) {
            screens[screenId] = screen
            this.inMemoryScreens$.next(screens)
        }
        display && this.selectedScreen$.next(screen)
        return screenId
    }

    removeScreen(screenId: string) {
        let screens = this.inMemoryScreens$.getValue()
        delete screens[screenId]
        this.inMemoryScreens$.next(screens)
        const topic = this.selectedTopic$.getValue()
        const defaultScreen = this.leftNavTabs[topic].defaultScreen()
        this.selectedScreen$.next(defaultScreen)
    }

    selectScreen(screenId: string) {
        let screen = this.inMemoryScreens$.getValue()[screenId]
        this.selectedScreen$.next(screen)
    }

    selectDefaultScreen(topic: Topic) {
        let screen = this.leftNavTabs[topic].defaultScreen()
        this.selectedScreen$.next(screen)
    }
}
