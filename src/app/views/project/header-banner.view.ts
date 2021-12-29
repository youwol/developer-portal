import { attr$, child$, VirtualDOM } from "@youwol/flux-view"
import { AppState, filterCtxMessage } from "../../app-state"
import { ContextMessage, PipelineStep, Project } from "../../client/models"
import { map } from "rxjs/operators"
import { Observable } from "rxjs"
import { PyYouwolClient } from "../../client/py-youwol.client"

type StepStatus = 'OK' | 'KO' | 'outdated' | 'none' | 'pending'

let statusClassFactory: Record<StepStatus, string> = {
    'OK': 'fas fa-check fv-text-success',
    'KO': 'fas fa-times fv-text-error',
    'outdated': 'fas fa-sync-alt fv-text-secondary',
    'none': 'fas fa-ban fv-text-disabled',
    'pending': 'fas fa-spinner fa-spin'
}


export class HeaderBannerView implements VirtualDOM {

    public readonly class = 'mx-auto py-1 d-flex justify-content-center w-100 align-items-center'

    public readonly children: VirtualDOM[]

    public readonly state: AppState

    public readonly project: Project

    public readonly selectedStep$: Observable<{ flowId: string, step: PipelineStep }>
    public readonly selectedFlowId$: Observable<string>

    constructor(params: { state: AppState, project: Project }) {

        Object.assign(this, params)

        this.selectedStep$ = this.state.projectEvents[this.project.id].selectedStep$

        this.children = [
            {
                class: 'd-flex align-items-center border p-2 rounded fv-pointer fv-bg-secondary fv-hover-xx-lighter',
                onclick: () => this.state.selectStep(this.project.id),
                children: [
                    {
                        class: '',
                        innerText: this.project.name
                    }
                ]
            },
            {
                class: 'mx-3',
                children: this.project.pipeline.flows.map((flow) => {

                    return this.labelView(flow.name)
                })
            },
            child$(
                this.selectedStep$,
                ({ flowId, step }) => step == undefined ? {} : this.stepView(flowId, step)
            )
        ]
    }

    labelView(flowId: string): VirtualDOM {


        return child$(
            this.selectedStep$.pipe(map(({ flowId }) => flowId)),
            (selectedFlowId) => {
                let defaultClasses = 'p-2 border rounded fv-pointer'
                return {
                    class: selectedFlowId == flowId
                        ? `${defaultClasses} fv-bg-secondary fv-hover-xx-lighter`
                        : `${defaultClasses} fv-hover-bg-background-alt`,
                    innerText: flowId,
                    onclick: () => {
                        this.state.selectStep(this.project.id, flowId, undefined)

                        // Re-click triggers refresh
                        if (flowId == selectedFlowId)
                            PyYouwolClient.projects.getFlowStatus$(this.project.id, flowId).subscribe()
                    }
                }
            }
        )
    }

    stepView(flowId: string, step: PipelineStep): VirtualDOM {

        let status$ = this.state.projectEvents[this.project.id].messages$.pipe(
            filterCtxMessage({
                withAttributes: {
                    event: (event) => event.includes("PipelineStatusPending"),
                    stepId: step.id
                },
                withLabels: []
            }),
            map((message: ContextMessage) => {
                return message.labels.includes("PipelineStepStatusResponse")
                    ? message.data['status']
                    : 'pending'
            })
        )

        return {
            class: 'd-flex border p-2 rounded fv-bg-secondary fv-hover-xx-lighter fv-pointer mx-2 align-items-center',
            innerText: step.id,
            onclick: () => PyYouwolClient.projects.runStep$(this.project.id, flowId, step.id).subscribe(),
            children: [
                {
                    class: attr$(
                        status$,
                        (status: string) => statusClassFactory[status],
                        { wrapper: (d) => `${d} mx-2` }
                    )
                },
                {
                    class: attr$(
                        status$,
                        (status) => status == 'pending'
                            ? ''
                            : 'fas fa-play fv-hover-text-secondary fv-pointer mx-3'
                    )
                }
            ]
        }
    }
}
