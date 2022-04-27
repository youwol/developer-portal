import { TopBanner } from '@youwol/platform-essentials'
import { BehaviorSubject, Observable } from 'rxjs'
import { map, shareReplay } from 'rxjs/operators'
import { DockableTabs } from '@youwol/fv-tabs'
import { ProjectsTab } from './projects/dockable-tab-project.view'
import { CdnTab } from './cdn/dockable-tab-cdn.view'
import { EnvironmentTab } from './environment/dockable-tab-environment.view'
import { VirtualDOM } from '@youwol/flux-view'
import { ProjectsState } from './projects/projects.state'
import { CdnState } from './cdn/cdn.state'
import { PyYouwol as pyYw } from '@youwol/http-clients'
import { EnvironmentState } from './environment/environment.state'
import { K8sTab } from './k8s/dockable-tab-environment.view'
import { K8sState } from './k8s/k8s.state'
import { LeftNavTab } from './common/left-nav-tabs'

export type Topic =
    | 'Projects'
    | 'Updates'
    | 'CDN'
    | 'Admin'
    | 'Environment'
    | 'K8s'

export interface Screen {
    topic: Topic
    viewId: string
    view: VirtualDOM
}

export class AppState {
    public readonly environmentClient = new pyYw.PyYouwolClient().admin
        .environment
    public readonly environment$: Observable<pyYw.EnvironmentStatusResponse>
    public readonly topBannerState = new TopBanner.YouwolBannerState()
    public readonly projectsState: ProjectsState
    public readonly cdnState: CdnState
    public readonly environmentState: EnvironmentState
    public readonly k8sState: K8sState

    public readonly leftNavState: DockableTabs.State

    public readonly leftNavTabs: Record<Topic, LeftNavTab<unknown, unknown>>

    public readonly selectedTopic$ = new BehaviorSubject<Topic>('Environment')
    public readonly selectedScreen$: BehaviorSubject<Screen>
    public readonly inMemoryScreens$: BehaviorSubject<{
        [k: string]: Screen
    }> = new BehaviorSubject({})

    constructor() {
        this.projectsState = new ProjectsState({ appState: this })
        this.cdnState = new CdnState({ appState: this })
        this.environmentState = new EnvironmentState({ appState: this })
        this.k8sState = new K8sState({ appState: this })
        this.leftNavTabs = {
            Environment: new EnvironmentTab({
                environmentState: this.environmentState,
            }),
            Projects: new ProjectsTab({ projectsState: this.projectsState }),
            Updates: undefined,
            CDN: new CdnTab({ cdnState: this.cdnState }),
            Admin: undefined,
            K8s: new K8sTab({ k8sState: this.k8sState }),
        }
        this.leftNavState = new DockableTabs.State({
            disposition: 'left',
            viewState$: new BehaviorSubject<DockableTabs.DisplayMode>('pined'),
            tabs$: new BehaviorSubject(
                Object.values(this.leftNavTabs).filter((d) => d != undefined),
            ),
            selected$: new BehaviorSubject<Topic>('Environment'),
        })

        this.environment$ = this.environmentClient.webSocket.status$().pipe(
            map(({ data }) => data),
            shareReplay(1),
        )

        const startingScreen =
            this.leftNavTabs[this.selectedTopic$.getValue()].defaultScreen()

        this.selectedScreen$ = new BehaviorSubject<Screen>(startingScreen)
        this.registerScreen(startingScreen)

        this.environmentClient.status$().subscribe()
        this.selectedScreen$.subscribe((s) => console.log('Selected', s))
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
