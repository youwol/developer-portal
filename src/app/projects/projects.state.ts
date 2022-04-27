import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs'

import {
    distinctUntilChanged,
    filter,
    map,
    mergeMap,
    scan,
    shareReplay,
    tap,
} from 'rxjs/operators'
import { AppState } from '../app-state'
import { ProjectView } from './project/project.view'
import { PyYouwol as pyYw, filterCtxMessage } from '@youwol/http-clients'

function projectLoadingIsSuccess(result: any): result is pyYw.Project {
    return result['failure'] === undefined
}

type StepId = string

export class ProjectEvents {
    public readonly projectsClient = new pyYw.PyYouwolClient().admin.projects
    messages$: any

    selectedStep$: BehaviorSubject<{
        flowId: string | undefined
        step: pyYw.PipelineStep | undefined
    }>

    stepsStatus$: Observable<Record<StepId, pyYw.PipelineStepStatusResponse>>
    stepStatusResponse$: Observable<pyYw.PipelineStepStatusResponse>

    projectStatusResponse$ = new ReplaySubject<pyYw.ProjectStatus>(1)

    constructor(public readonly project: pyYw.Project) {
        this.messages$ = this.projectsClient.webSocket.ws$().pipe(
            filterCtxMessage({
                withAttributes: { projectId: this.project.id },
            }),
        )

        this.selectedStep$ = new BehaviorSubject<{
            flowId: string
            step: pyYw.PipelineStep | undefined
        }>({
            flowId: this.project.pipeline.flows[0].name,
            step: undefined,
        })

        this.stepStatusResponse$ = this.projectsClient.webSocket
            .stepStatus$({
                projectId: this.project.id,
                flowId: this.project.pipeline.flows[0].name,
            })
            .pipe(
                map((message: any) => message.data),
                shareReplay(1),
            )

        this.stepsStatus$ = this.projectsClient.webSocket
            .stepStatus$({
                projectId: this.project.id,
                flowId: this.project.pipeline.flows[0].name,
            })
            .pipe(
                scan((acc, message: any) => {
                    const flowId = message.attributes['flowId']
                    const stepId = message.attributes['stepId']

                    return {
                        ...acc,
                        [ProjectEvents.fullId(flowId, stepId)]: message.data,
                    }
                }, {}),
                shareReplay(1),
            )

        this.selectedStep$
            .pipe(
                distinctUntilChanged((x, y) => x.flowId == y.flowId),
                filter(({ flowId }) => flowId != undefined),
                mergeMap(({ flowId }) => {
                    return this.projectsClient.getPipelineStatus$({
                        projectId: project.id,
                        flowId,
                    })
                }),
            )
            .subscribe()

        this.selectedStep$
            .pipe(
                filter(({ step }) => step != undefined),
                mergeMap(({ flowId, step }) => {
                    return this.projectsClient.getStepStatus$({
                        projectId: project.id,
                        flowId,
                        stepId: step.id,
                    })
                }),
            )
            .subscribe()

        this.projectStatusResponse$ = this.projectsClient.webSocket
            .projectStatus$()
            .pipe(shareReplay(1)) as any

        this.projectsClient
            .getProjectStatus$({ projectId: project.id })
            .subscribe()
    }

    static fullId(flowId: string, stepId: string) {
        return `${flowId}#${stepId}`
    }
}

export class ProjectsState {
    public readonly appState: AppState

    public readonly projectsClient = new pyYw.PyYouwolClient().admin.projects

    public readonly projectEvents: { [k: string]: ProjectEvents } = {}
    public readonly projectsLoading$: Observable<
        (pyYw.Project | pyYw.Failure)[]
    >
    public readonly projects$: Observable<pyYw.Project[]>

    public readonly openProjects$ = new BehaviorSubject<pyYw.Project[]>([])

    public readonly screensId = {}

    constructor(params: { appState: AppState }) {
        Object.assign(this, params)

        this.projectsLoading$ = this.projectsClient.webSocket.status$().pipe(
            map(({ data }) => data.results),
            shareReplay(1),
            tap((p) => console.log('projectsLoading$', p)),
        )

        this.projects$ = this.projectsLoading$.pipe(
            map((results) =>
                results.filter((result) => projectLoadingIsSuccess(result)),
            ),
            map((results) => results as pyYw.Project[]),
            shareReplay(1),
            tap((p) => console.log('projects$', p)),
        )

        this.projectsClient.status$().subscribe()
    }

    selectDashboard() {
        this.appState.selectDefaultScreen('Projects')
    }

    runStep(projectId, flowId, stepId) {
        this.projectsClient.runStep$({ projectId, flowId, stepId }).subscribe()
    }

    openProject(project: pyYw.Project) {
        if (!this.projectEvents[project.id]) {
            this.projectEvents[project.id] = new ProjectEvents(project)
        }

        const openProjects = this.openProjects$.getValue()

        if (!openProjects.includes(project)) {
            this.openProjects$.next([...openProjects, project])
        }

        this.screensId[project.id] = this.appState.registerScreen({
            topic: 'Projects',
            viewId: project.id,
            view: new ProjectView({
                projectsState: this,
                project: project,
            }),
        })
    }

    selectProject(projectId: string) {
        this.appState.selectScreen(this.screensId[projectId])
    }

    closeProject(projectId: string) {
        delete this.projectEvents[projectId]
        this.appState.removeScreen(this.screensId[projectId])
        const openProjects = this.openProjects$.getValue()
        this.openProjects$.next(openProjects.filter((p) => p.id != projectId))
    }

    selectStep(
        projectId: string,
        flowId: string | undefined = undefined,
        stepId: string | undefined = undefined,
    ) {
        const events = this.projectEvents[projectId]
        const step = events.project.pipeline.steps.find((s) => s.id == stepId)
        if (events.selectedStep$.getValue().flowId != flowId) {
            console.log('Select flow', flowId)
            this.projectsClient
                .getPipelineStatus$({ projectId, flowId })
                .subscribe()
        }
        events.selectedStep$.next({ flowId, step })
    }
}
