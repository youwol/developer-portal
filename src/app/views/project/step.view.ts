import { attr$, child$, childrenAppendOnly$, HTMLElement$, VirtualDOM } from "@youwol/flux-view"
import { AppState } from "../../app-state"
import { ContextMessage, PipelineStep, PipelineStepStatusResponse, Project } from "../../client/models"
import { BehaviorSubject, Observable } from "rxjs"
import { filter, map, mergeMap } from "rxjs/operators"
import { PyYouwolClient } from "../../client/py-youwol.client"
import { button } from "../utils-view"
import { DataView } from '../terminal/data.view'

let statusClassFactory = {
    'OK': 'fas fa-check fv-text-success',
    'KO': 'fas fa-times fv-text-error',
    'outdated': 'fas fa-sync-alt fv-text-secondary',
    'none': 'fas fa-ban fv-text-disabled'
}

export class StepView implements VirtualDOM {


    public readonly class = "w-50 h-100 d-flex flex-column"

    public readonly children: VirtualDOM[]

    public readonly state: AppState
    public readonly project: Project
    public readonly step: PipelineStep

    connectedCallback: (elem: HTMLElement$ & HTMLDivElement) => void

    selectedStep$ = new BehaviorSubject<PipelineStep>(undefined)

    constructor(params: { state: AppState, project: Project, step: PipelineStep }) {

        Object.assign(this, params)
        PyYouwolClient.projects.getStepStatus$(this.project.id, this.step.id).subscribe()

        let statusMessages$: Observable<ContextMessage> =
            PyYouwolClient.connectWs().pipe(
                filter((message: ContextMessage) => {
                    return message.attributes['event'] && message.attributes['event'].includes("PipelineStatusPending")
                }),
                filter((message: ContextMessage) => {
                    return message.attributes.projectId == this.project.id && message.attributes.stepId == this.step.id
                })
            )

        this.children = [
            {
                class: 'd-flex align-items-center',
                children: [
                    {
                        tag: 'h1', innerText: this.step.id,
                        children: [
                            {
                                class: attr$(
                                    statusMessages$,
                                    (message: ContextMessage) => {
                                        return message.labels.includes("PipelineStepStatusResponse")
                                            ? statusClassFactory[message.data['status']]
                                            : 'fas fa-spinner fa-spin'
                                    },
                                    { wrapper: (d) => `${d} mx-2` }
                                )
                            }
                        ]
                    }
                ]
            },
            child$(
                statusMessages$.pipe(
                    filter((message) => message.labels.includes("PipelineStepStatusResponse"))
                ),
                ({ data }: { data: PipelineStepStatusResponse }) => {
                    return {
                        class: 'flex-grow-1 d-flex flex-column overflow-auto',
                        children: [
                            new StatusView(data),
                            new ActionsView(data),
                            new CommandOutputsView(data, statusMessages$)
                        ]
                    }
                }
            )
        ]
    }
}


class StatusView implements VirtualDOM {

    public readonly class = "d-flex align-items-center my-2"

    public readonly children: VirtualDOM[]

    constructor(data: PipelineStepStatusResponse) {

        this.children = [
            new DataView(data)
        ]
    }
}

class ActionsView implements VirtualDOM {

    public readonly class = "d-flex align-items-center my-2"

    public readonly children: VirtualDOM[]

    constructor(data: PipelineStepStatusResponse) {

        let btnRun = button("fas fa-play", "run")

        btnRun.state.click$.pipe(
            mergeMap(() => PyYouwolClient.projects.runStep$(data.projectId, data.stepId)
            )
        ).subscribe(() => {
        })

        this.children = [
            btnRun
        ]
    }
}

class CommandOutputsView implements VirtualDOM {

    public readonly children: VirtualDOM[]
    public readonly style = {
        fontFamily: "monospace",
        fontSize: 'x-small'
    }

    constructor(data: PipelineStepStatusResponse, statusMessages$: Observable<ContextMessage>) {

        let outputsRun$ = statusMessages$.pipe(
            filter(message => message.attributes['event'].includes("PipelineStatusPending:run"))
        )
        this.children = [
            {
                innerText: 'Command output'
            },
            child$(
                outputsRun$,
                () => this.dynamicOutputs(outputsRun$),
                ({ untilFirst: this.savedOutputs(data) })
            )
        ]
    }

    dynamicOutputs(outputsRun$: Observable<ContextMessage>) {

        return {
            children: childrenAppendOnly$(
                outputsRun$.pipe(map(m => [m])),
                (message) => {
                    return {
                        innerText: message.text
                    }
                }
            )
        }
    }

    savedOutputs(data) {

        return {
            children: data.manifest && data.manifest.cmdOutputs.map(output => {
                return { innerText: output }
            })
        }
    }
}
