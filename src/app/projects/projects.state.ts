import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs'

import { filter, map, mergeMap, shareReplay } from 'rxjs/operators'
import { AppState } from '../app-state'
import { ProjectView } from './project'
import { filterCtxMessage, WebSocketResponse$ } from '@youwol/http-primitives'
import * as pyYw from '@youwol/local-youwol-client'
import { NewProjectFromTemplateView } from './new-project'

type ContextMessage = pyYw.ContextMessage

function projectLoadingIsSuccess(
    result: unknown,
): result is pyYw.Routers.Projects.Project {
    return result['failure'] === undefined
}

export type FlowId = string

export function instanceOfStepStatus(
    data: unknown,
): data is pyYw.Routers.Projects.PipelineStepStatusResponse {
    return [
        'projectId',
        'flowId',
        'stepId',
        'artifactFolder',
        'artifacts',
    ].reduce((acc, e) => acc && data[e], true)
}

/**
 * @category Event
 */
export class ProjectEvents {
    /**
     * @group Immutable Constants
     */
    public readonly projectsClient = new pyYw.PyYouwolClient().admin.projects

    /**
     * @group Observables
     */
    public readonly messages$: WebSocketResponse$<unknown>

    /**
     * @group Observables
     */
    public readonly selectedFlow$: BehaviorSubject<FlowId>

    /**
     * @group Observables
     */
    public readonly selectedStep$: BehaviorSubject<{
        flowId: string
        step: pyYw.Routers.Projects.PipelineStep | undefined
    }>

    /**
     * @group Observables
     */
    public readonly configureStep$: Subject<{
        flowId: string
        step: pyYw.Routers.Projects.PipelineStep | undefined
    }> = new Subject()

    /**
     * @group Observables
     */
    public readonly step$: {
        [k: string]: {
            status$: ReplaySubject<
                | pyYw.Routers.Projects.PipelineStepEventKind
                | pyYw.Routers.Projects.PipelineStepStatusResponse
            >
            log$: Subject<ContextMessage>
        }
    } = {}

    /**
     * @group Observables
     */
    public readonly projectStatusResponse$: WebSocketResponse$<pyYw.Routers.Projects.ProjectStatus>

    constructor(public readonly project: pyYw.Routers.Projects.Project) {
        this.messages$ = pyYw.PyYouwolClient.ws.log$.pipe(
            filterCtxMessage({
                withAttributes: { projectId: this.project.id },
            }),
            shareReplay(1),
        )

        this.selectedStep$ = new BehaviorSubject<{
            flowId: string
            step: pyYw.Routers.Projects.PipelineStep | undefined
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
                    (data: pyYw.Routers.Projects.PipelineStepEvent) =>
                        data.event == 'runStarted' ||
                        data.event == 'statusCheckStarted',
                ),
            )
            .subscribe((data: pyYw.Routers.Projects.PipelineStepEvent) => {
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
            .pipe(shareReplay(1))

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

        this.selectedStep$
            .pipe(
                filter(({ step }) => step != undefined),
                mergeMap(({ flowId, step }) => {
                    return this.projectsClient.getPipelineStepStatus$({
                        projectId: project.id,
                        flowId,
                        stepId: step.id,
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

/**
 * @category State
 */
export class ProjectsState {
    /**
     * @group States
     */
    public readonly appState: AppState

    /**
     * @group Immutable Constants
     */
    public readonly projectsClient = new pyYw.PyYouwolClient().admin.projects

    /**
     * @group Immutable Constants
     */
    public readonly projectEvents: { [k: string]: ProjectEvents } = {}

    /**
     * @group Observables
     */
    public readonly projectsLoading$: Observable<
        (pyYw.Routers.Projects.Project | pyYw.Routers.Projects.Failure)[]
    >

    /**
     * @group Observables
     */
    public readonly projects$: Observable<pyYw.Routers.Projects.Project[]>

    /**
     * @group Observables
     */
    public readonly openProjects$ = new BehaviorSubject<
        pyYw.Routers.Projects.Project[]
    >([])

    /**
     * @group Mutable Variables
     */
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
            map((results) => results as pyYw.Routers.Projects.Project[]),
            shareReplay(1),
        )
    }

    selectDashboard() {
        this.appState.selectDefaultScreen('Projects')
    }

    runStep(projectId, flowId, stepId) {
        this.projectsClient.runStep$({ projectId, flowId, stepId }).subscribe()
    }

    configureStep(projectId, flowId, stepId) {
        const events = this.projectEvents[projectId]
        const step = events.project.pipeline.steps.find((s) => s.id == stepId)
        this.projectEvents[projectId].configureStep$.next({
            flowId: flowId,
            step,
        })
    }

    openProject(project: pyYw.Routers.Projects.Project) {
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

    newProjectFromTemplate(
        projectTemplate: pyYw.Routers.Environment.ProjectTemplate,
    ) {
        this.screensId[projectTemplate.type] = this.appState.registerScreen({
            topic: 'Projects',
            viewId: projectTemplate.type,
            view: new NewProjectFromTemplateView({
                projectsState: this,
                projectTemplate,
            }),
        })
    }

    createProjectFromTemplate$({
        type,
        parameters,
    }: {
        type: string
        parameters: { [_k: string]: string }
    }) {
        return this.projectsClient.createProjectFromTemplate$({
            body: {
                type,
                parameters,
            },
        })
    }
}
