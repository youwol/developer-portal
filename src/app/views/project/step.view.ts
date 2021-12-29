import { child$, HTMLElement$, VirtualDOM } from "@youwol/flux-view"
import { AppState, filterCtxMessage } from "../../app-state"
import { PipelineStep, PipelineStepStatusResponse, Project } from "../../client/models"
import { filter } from "rxjs/operators"
import { ArtifactsView } from "./artifacts.view"
import { ManifestView } from "./manifest.view"
import { RunOutputsView } from "./run-outputs.view"


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

        let pendingMessages$ = this.state.projectEvents[this.project.id].messages$.pipe(
            filterCtxMessage({
                withAttributes: {
                    event: (event) => event.includes("PipelineStatusPending"),
                    stepId: this.step.id
                }
            })
        )

        this.children = [
            child$(
                pendingMessages$.pipe(
                    filter((message) => message.labels.includes("PipelineStepStatusResponse"))
                ),
                ({ data }: { data: PipelineStepStatusResponse }) => {
                    return {
                        class: 'flex-grow-1 d-flex flex-column',
                        children: [
                            new RunOutputsView(data, pendingMessages$),
                            data.manifest ? new ManifestView(data.manifest) : undefined,
                            data.artifacts.length > 0 ? new ArtifactsView(data.artifacts) : undefined
                        ]
                    }
                }
            )
        ]
    }
}

