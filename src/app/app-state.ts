import { YouwolBannerState } from "@youwol/platform-essentials"
import { BehaviorSubject, Observable, ReplaySubject } from "rxjs"
import { filter, map, shareReplay, tap } from "rxjs/operators"
import { PyYouwolClient } from "./client/py-youwol.client"
import { Environment, Project } from "./client/models"



export class AppState {


    public readonly environment$: Observable<Environment>
    public readonly topBannerState = new YouwolBannerState({ cmEditorModule$: undefined })
    public readonly openProjects$ = new BehaviorSubject<Project[]>([])
    public readonly selectedTabId$ = new BehaviorSubject<string>("dashboard")

    constructor() {

        this.environment$ = PyYouwolClient.connectWs().pipe(
            filter(({ labels, data }) => {
                return labels && data && labels.includes("EnvironmentStatusResponse")
            }),
            map(({ data }) => data as Environment),
            shareReplay(1)
        )
        PyYouwolClient.environment.status$().subscribe()
    }

    openProject(project: Project) {

        let openProjects = this.openProjects$.getValue()

        if (!openProjects.includes(project))
            this.openProjects$.next([...openProjects, project])

        this.selectedTabId$.next(project.name)
    }
}


