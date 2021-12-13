import { child$, HTMLElement$, VirtualDOM } from "@youwol/flux-view"
import { AppState } from "../../app-state"
import { PipelineStep, PipelineStepStatusResponse, Project } from "../../client/models"
import { DagView } from "./dag.view"
import { BehaviorSubject, Observable } from "rxjs"
import { filter, mergeMap } from "rxjs/operators"
import { PyYouwolClient } from "../../client/py-youwol.client"



export class StepView implements VirtualDOM {


    public readonly class = "w-50 h-100"

    public readonly children: VirtualDOM[]

    public readonly state: AppState
    public readonly project: Project
    public readonly step: PipelineStep

    connectedCallback: (elem: HTMLElement$ & HTMLDivElement) => void

    selectedStep$ = new BehaviorSubject<PipelineStep>(undefined)

    constructor(params: { state: AppState, project: Project, step: PipelineStep }) {

        Object.assign(this, params)
        PyYouwolClient.projects.stepStatus$(this.project.id, this.step.id).subscribe()

        let messages$: Observable<{ projectId: string, stepId: string, data?: PipelineStepStatusResponse }> =
            PyYouwolClient.connectWs().pipe(
                filter((message: any) => {
                    return message.type == "PipelineStepStatusResponse"
                }),
                filter((message: { projectId: string, stepId: string }) => {
                    return message.projectId == this.project.id && message.stepId == this.step.id
                })
            )

        this.children = [
            {
                class: 'd-flex align-items-center',
                children: [
                    {
                        tag: 'h1', innerText: this.step.id
                    },
                    child$(
                        messages$,
                        (message: { data?}) => {
                            return message.data ? {} : { class: 'fas fa-spin' }
                        }
                    )
                ]
            },
            child$(
                messages$.pipe(
                    filter((message: { data?}) => {
                        return message.data != undefined
                    }),
                ),
                (message) => {
                    return { innerText: 'All Good' }
                }
            )
        ]
    }
}
