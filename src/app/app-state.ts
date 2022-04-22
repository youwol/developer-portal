import { TopBanner } from '@youwol/platform-essentials'
import { BehaviorSubject, Observable } from 'rxjs'
import { map, shareReplay } from 'rxjs/operators'
import { DockableTabs } from '@youwol/fv-tabs'
import { ProjectsTab } from './projects/dockable-tab-project.view'
import { CdnTab } from './cdn/dockable-tab-cdn.view'
import { EnvironmentTab } from './environment/dockable-tab-environment.view'
import { VirtualDOM } from '@youwol/flux-view'
import { DashboardView } from './projects/dashboard/dashboard.view'
import { ProjectsState } from './projects/projects.state'
import { CdnState } from './cdn/cdn.state'
import { PyYouwol as pyYw } from '@youwol/http-clients'
import { EnvironmentState } from './environment/environment.state'

export type Topic = 'Projects' | 'Updates' | 'CDN' | 'Admin' | 'Environment'

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

    public readonly leftNavState: DockableTabs.State

    public readonly selectedTopic$ = new BehaviorSubject<Topic>('Projects')
    public readonly selectedScreen$: BehaviorSubject<Screen>
    public readonly inMemoryScreens$: BehaviorSubject<{
        [k: string]: Screen
    }>

    constructor() {
        this.projectsState = new ProjectsState({ appState: this })
        this.cdnState = new CdnState({ appState: this })
        this.environmentState = new EnvironmentState({ appState: this })
        this.leftNavState = new DockableTabs.State({
            disposition: 'left',
            viewState$: new BehaviorSubject<DockableTabs.DisplayMode>('pined'),
            tabs$: new BehaviorSubject([
                new ProjectsTab({ projectsState: this.projectsState }),
                new CdnTab({ cdnState: this.cdnState }),
                new EnvironmentTab({ environmentState: this.environmentState }),
            ]),
            selected$: new BehaviorSubject<string>('projects'),
        })

        this.environment$ = this.environmentClient.webSocket.status$().pipe(
            map(({ data }) => data),
            shareReplay(1),
        )

        const dashboardScreen = {
            topic: 'Projects',
            viewId: 'dashboard',
            view: new DashboardView({ projectsState: this.projectsState }),
        } as Screen
        this.selectedScreen$ = new BehaviorSubject<Screen>(dashboardScreen)
        this.inMemoryScreens$ = new BehaviorSubject({
            dashboard: dashboardScreen,
        })
        this.environmentClient.status$().subscribe()
    }

    registerScreen(screen: Screen) {
        let screens = this.inMemoryScreens$.getValue()
        screens[screen.viewId] = screen
        this.inMemoryScreens$.next(screens)
    }

    removeScreen(viewId: string) {
        let screens = this.inMemoryScreens$.getValue()
        delete screens[viewId]
        this.inMemoryScreens$.next(screens)
    }

    selectScreen(screenId: string) {
        let screen = this.inMemoryScreens$.getValue()[screenId]
        this.selectedScreen$.next(screen)
    }
}
