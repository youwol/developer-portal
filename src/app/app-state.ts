import { YouwolBannerState } from "@youwol/platform-essentials"
import { BehaviorSubject, Observable } from "rxjs"
import { distinctUntilChanged, filter, map, mergeMap, scan, shareReplay, tap } from "rxjs/operators"
import { PyYouwolClient } from "./client/py-youwol.client"
import { ContextMessage, Environment, PipelineStep, PipelineStepStatusResponse, Project } from "./client/models"



type StepId = string

export class ProjectEvents {


    /**
     * All messages related to the project
     */
    messages$: Observable<ContextMessage>

    selectedStep$: BehaviorSubject<{ flowId: string, step: PipelineStep | undefined }>

    stepsStatus$: Observable<Record<StepId, PipelineStepStatusResponse>>

    constructor(public readonly project: Project) {

        this.messages$ = PyYouwolClient.connectWs().pipe(
            filter((message) => message.attributes['projectId'] && message.attributes['projectId'] == this.project.id)
        )

        this.selectedStep$ = new BehaviorSubject<{ flowId: string, step: PipelineStep | undefined }>({
            flowId: this.project.pipeline.flows[0].name,
            step: undefined
        })

        this.stepsStatus$ =
            this.messages$.pipe(
                filter((message: ContextMessage) => {
                    return message.labels.includes("PipelineStepStatusResponse")
                }),
                scan((acc, message) => {
                    let flowId = message.attributes["flowId"]
                    let stepId = message.attributes["stepId"]

                    return { ...acc, [ProjectEvents.fullId(flowId, stepId)]: message.data }
                }, {})
            )
    }

    filterAttributes(attributes: { [key: string]: (string) => boolean }): Observable<ContextMessage> {
        return this.messages$.pipe(
            filter((message: ContextMessage) => {
                return Object.entries(attributes).reduce(
                    (acc, [k, v]) => acc && message.attributes[k] && v(message.attributes[k]),
                    true)
                // message.attributes['event'] && message.attributes['event'].includes("PipelineStatusPending")
            })
        )
    }

    static fullId(flowId: string, stepId: string) {
        return `${flowId}#${stepId}`
    }
}

export class AppState {


    public readonly environment$: Observable<Environment>
    public readonly topBannerState = new YouwolBannerState({ cmEditorModule$: undefined })
    public readonly openProjects$ = new BehaviorSubject<Project[]>([])
    public readonly selectedTabId$ = new BehaviorSubject<string>("dashboard")

    public readonly projectEvents: Record<string, ProjectEvents> = {}

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

        if (!this.projectEvents[project.id])
            this.projectEvents[project.id] = new ProjectEvents(project)

        this.projectEvents[project.id].selectedStep$.pipe(
            distinctUntilChanged((x, y) => x.flowId == y.flowId),
            mergeMap(({ flowId }) => {
                return PyYouwolClient.projects.getStatus$(project.id, flowId)
            })
        ).subscribe()

        this.projectEvents[project.id].selectedStep$.pipe(
            filter(({ step }) => step != undefined),
            mergeMap(({ flowId, step }) => {
                return PyYouwolClient.projects.getStepStatus$(project.id, flowId, step.id)
            })
        ).subscribe()

        let openProjects = this.openProjects$.getValue()

        if (!openProjects.includes(project))
            this.openProjects$.next([...openProjects, project])

        this.selectedTabId$.next(project.id)
    }

    closeProject(projectId: string) {

        delete this.projectEvents[projectId]
        this.selectedTabId$.next('dashboard')

        let openProjects = this.openProjects$.getValue()
        this.openProjects$.next(openProjects.filter(p => p.id != projectId))

    }

    selectStep(projectId: string, flowId: string, stepId: string | undefined) {

        let events = this.projectEvents[projectId]
        let step = events.project.pipeline.steps.find(s => s.id == stepId)
        events.selectedStep$.next({ flowId, step })
    }

}


