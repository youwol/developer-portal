import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs'

import { filter, map, mergeMap, shareReplay } from 'rxjs/operators'
import { AppState } from '../app-state'
import { ProjectView } from './project/project.view'
import { PyYouwol as pyYw, filterCtxMessage } from '@youwol/http-clients'
import { ContextMessage } from '@youwol/http-clients/dist/lib/py-youwol'

function projectLoadingIsSuccess(result: any): result is pyYw.Project {
    return result['failure'] === undefined
}

export type FlowId = string

export function instanceOfStepStatus(
    data: unknown,
): data is pyYw.PipelineStepStatusResponse {
    return [
        'projectId',
        'flowId',
        'stepId',
        'artifactFolder',
        'artifacts',
    ].reduce((acc, e) => acc && data[e], true)
}

export class ProjectEvents {
    public readonly projectsClient = new pyYw.PyYouwolClient().admin.projects
    messages$: any

    selectedFlow$: BehaviorSubject<FlowId>

    selectedStep$: BehaviorSubject<{
        flowId: string
        step: pyYw.PipelineStep | undefined
    }>

    step$: {
        [k: string]: {
            status$: ReplaySubject<
                pyYw.PipelineStepEventKind | pyYw.PipelineStepStatusResponse
            >
            log$: Subject<ContextMessage>
        }
    } = {}

    projectStatusResponse$ = new ReplaySubject<pyYw.ProjectStatus>(1)

    constructor(public readonly project: pyYw.Project) {
        this.messages$ = pyYw.PyYouwolClient.ws.log$.pipe(
            filterCtxMessage({
                withAttributes: { projectId: this.project.id },
            }),
            shareReplay(1),
        )

        this.selectedStep$ = new BehaviorSubject<{
            flowId: string
            step: pyYw.PipelineStep | undefined
        }>({
            flowId: this.project.pipeline.flows[0].name,
            step: undefined,
        })
        this.selectedFlow$ = new BehaviorSubject(
            this.project.pipeline.flows[0].name,
        )

        this.projectsClient.webSocket
            .stepEvent$({ projectId: this.project.id })
            .pipe(
                map((message) => message.data),
                filter(
                    (data: pyYw.PipelineStepEvent) =>
                        data.event == 'runStarted' ||
                        data.event == 'statusCheckStarted',
                ),
            )
            .subscribe((data: pyYw.PipelineStepEvent) => {
                this.getStep$(data.flowId, data.stepId).status$.next(data.event)
            })
        this.messages$
            .pipe(
                filterCtxMessage({
                    withLabels: ['Label.PIPELINE_STEP_RUNNING'],
                    withAttributes: { projectId: this.project.id },
                }),
            )
            .subscribe((message) => {
                const flowId = message.attributes['flowId']
                const stepId = message.attributes['stepId']
                this.getStep$(flowId, stepId).log$.next(message)
            })

        this.projectsClient.webSocket
            .pipelineStepStatus$({
                projectId: this.project.id,
            })
            .pipe(map((message) => message.data))
            .subscribe((status) => {
                this.getStep$(status.flowId, status.stepId).status$.next(status)
            })

        this.projectStatusResponse$ = this.projectsClient.webSocket
            .projectStatus$()
            .pipe(shareReplay(1)) as any

        this.projectsClient
            .getProjectStatus$({ projectId: project.id })
            .subscribe()

        this.selectedFlow$
            .pipe(
                mergeMap((flowId) => {
                    return this.projectsClient.getPipelineStatus$({
                        projectId: project.id,
                        flowId,
                    })
                }),
            )
            .subscribe()
    }

    getStep$(flowId: string, stepId: string) {
        const fullId = ProjectEvents.fullId(flowId, stepId)
        if (this.step$[fullId]) {
            return this.step$[fullId]
        }
        this.step$[fullId] = {
            status$: new ReplaySubject(1),
            log$: new Subject(),
        }
        return this.step$[fullId]
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
        )

        this.projects$ = this.projectsLoading$.pipe(
            map((results) =>
                results.filter((result) => projectLoadingIsSuccess(result)),
            ),
            map((results) => results as pyYw.Project[]),
            shareReplay(1),
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

    selectFlow(projectId: string, flowId: string) {
        const events = this.projectEvents[projectId]
        events.selectedFlow$.next(flowId)
        events.selectedStep$.next({ flowId, step: undefined })
    }

    selectStep(
        projectId: string,
        flowId: string | undefined = undefined,
        stepId: string | undefined = undefined,
    ) {
        const events = this.projectEvents[projectId]
        const step = events.project.pipeline.steps.find((s) => s.id == stepId)
        if (events.selectedStep$.getValue().flowId != flowId) {
            this.projectsClient
                .getPipelineStatus$({ projectId, flowId })
                .subscribe()
        }
        events.selectedStep$.next({ flowId, step })
    }
}
