import { attr$, child$, HTMLElement$, VirtualDOM } from "@youwol/flux-view"
import { AppState } from "../../app-state"
import { ContextMessage, PipelineStep, PipelineStepStatusResponse, Project } from "../../client/models"
import { filter } from "rxjs/operators"
import { ArtifactsView } from "./artifacts.view"
import { ManifestView } from "./manifest.view"
import { ActionsView } from "./actions.view"

let statusClassFactory = {
    'OK': 'fas fa-check fv-text-success',
    'KO': 'fas fa-times fv-text-error',
    'outdated': 'fas fa-sync-alt fv-text-secondary',
    'none': 'fas fa-ban fv-text-disabled'
}

export class StepView implements VirtualDOM {


    public readonly class = "w-100 h-100 d-flex flex-column mx-3 px-2"

    public readonly children: VirtualDOM[]

    public readonly state: AppState
    public readonly project: Project
    public readonly flowId: string
    public readonly step: PipelineStep

    connectedCallback: (elem: HTMLElement$ & HTMLDivElement) => void


    constructor(params: { state: AppState, project: Project, step: PipelineStep, flowId: string }) {

        Object.assign(this, params)

        let pendingMessages$ = this.state.projectEvents[this.project.id]
            .filterAttributes({
                event: (event) => event.includes("PipelineStatusPending"),
                stepId: (stepId) => stepId == this.step.id
            })

        this.children = [
            {
                class: 'd-flex align-items-center mb-3',
                children: [
                    {
                        class: 'border p-2 rounded fv-pointer fv-hover-bg-secondary mx-2',
                        innerText: this.project.name,
                        onclick: () => this.state.selectStep(this.project.id, this.flowId, undefined)
                    },
                    {
                        class: 'border p-2 rounded fv-pointer mx-2',
                        innerText: this.step.id,
                        children: [
                            {
                                class: attr$(
                                    pendingMessages$,
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
                pendingMessages$.pipe(
                    filter((message) => message.labels.includes("PipelineStepStatusResponse"))
                ),
                ({ data }: { data: PipelineStepStatusResponse }) => {
                    return {
                        class: 'flex-grow-1 d-flex flex-column overflow-auto',
                        children: [
                            new ActionsView(data, pendingMessages$),
                            data.manifest ? new ManifestView(data.manifest) : undefined,
                            data.artifacts.length > 0 ? new ArtifactsView(data.artifacts) : undefined
                        ]
                    }
                }
            )
        ]
    }
}

