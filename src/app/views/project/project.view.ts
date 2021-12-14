import { child$, HTMLElement$, VirtualDOM } from "@youwol/flux-view"
import { AppState } from "src/app/app-state"
import { Project } from "../../client/models"
import { DagView } from "./dag.view"
import { StepView } from "./step.view"
import { TerminalView } from "./terminal/terminal.view"
import { Select } from "@youwol/fv-input"
import { mergeMap } from "rxjs/operators"
import { PyYouwolClient } from "../../client/py-youwol.client"
import { ArtifactsView } from "./artifacts.view"



export class ProjectView implements VirtualDOM {


    public readonly class = "w-100 h-100 d-flex flex-wrap p-2 "

    public readonly children: VirtualDOM[]

    public readonly state: AppState

    public readonly project: Project

    connectedCallback: (elem: HTMLElement$ & HTMLDivElement) => void


    constructor(params: { state: AppState, project: Project }) {

        Object.assign(this, params)
        let events = this.state.projectEvents[this.project.id]

        this.children = [
            {
                class: 'd-flex justify-content-around w-100 h-100',
                children: [
                    {
                        class: "d-flex flex-column h-100 w-100",
                        children: [
                            new DagView(params),
                            new TerminalView(events.messages$)
                        ]
                    },
                    child$(
                        events.selectedStep$,
                        ({ flowId, step }) => {

                            if (step != undefined)
                                return new StepView({ state: this.state, project: this.project, flowId, step })

                            return new ProjectSummaryView(params)
                        }
                    )
                ]
            }
        ]
    }
}


class ProjectSummaryView implements VirtualDOM {

    public readonly class = "w-100"
    public readonly state: AppState

    public readonly children: VirtualDOM[]
    public readonly project: Project

    constructor(params: { state: AppState, project: Project }) {

        Object.assign(this, params)
        let selectedStep$ = this.state.projectEvents[this.project.id].selectedStep$

        let select = new Select.State(
            this.project.pipeline.flows.map(flow => new Select.ItemData(flow.name, flow.name)),
            selectedStep$.getValue().flowId
        )
        select.selectionId$.subscribe((flowId) => {
            if (flowId != selectedStep$.getValue().flowId)
                this.state.selectStep(this.project.id, flowId, undefined)
        })

        this.children = [
            {
                class: 'd-flex align-items-center mb-3',
                children: [
                    {
                        class: 'border p-2 rounded fv-pointer fv-hover-bg-secondary mx-2',
                        innerText: this.project.name
                    }
                ]
            },
            {
                class: 'mx-3',
                children: [
                    {
                        class: 'd-flex align-items-center mb-3',
                        children: [
                            { innerText: 'Selected flow:', class: 'mr-2' },
                            new Select.View({ state: select })]
                    }
                ]
            },
            child$(
                selectedStep$.pipe(
                    mergeMap(({ flowId }) => {
                        return PyYouwolClient.projects.getArtifacts(this.project.id, flowId)
                    })
                ),
                ({ artifacts }) => {
                    return new ArtifactsView(artifacts)
                }
            )
        ]

    }
}
