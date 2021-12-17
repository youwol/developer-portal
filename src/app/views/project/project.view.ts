import { child$, VirtualDOM } from "@youwol/flux-view"
import { AppState } from "src/app/app-state"
import { Project } from "../../client/models"
import { DagFlowView } from "./dag-flow.view"
import { StepView } from "./step.view"
import { TerminalView } from "./terminal/terminal.view"
import { mergeMap } from "rxjs/operators"
import { PyYouwolClient } from "../../client/py-youwol.client"
import { ArtifactsView } from "./artifacts.view"
import { HeaderBannerView } from "./header-banner.view"
import { DataView } from "./terminal/data.view"
import { DagDependenciesView } from "./dag-dependencies.view"


export class ProjectView implements VirtualDOM {


    public readonly class = "d-flex flex-column w-100 h-100"

    public readonly children: VirtualDOM[]

    public readonly state: AppState

    public readonly project: Project

    constructor(params: { state: AppState, project: Project }) {

        Object.assign(this, params)
        let events = this.state.projectEvents[this.project.id]

        let projectSummary = new ProjectSummaryView(params)

        this.children = [
            {
                class: "d-flex flex-grow-1 justify-content-around w-100  py-2",
                style: { minHeight: '0px' },
                children: [
                    {
                        class: "d-flex flex-column h-100 w-100 mr-2",
                        children: [
                            child$(
                                events.selectedStep$,
                                ({ flowId, step }) => {
                                    return (flowId != undefined) ?
                                        new DagFlowView(params) :
                                        new DagDependenciesView(params)
                                }
                            ),
                            new TerminalView(events.messages$)
                        ]
                    },
                    {
                        class: 'w-100 h-100 d-flex flex-column px-2',
                        children: [

                            new HeaderBannerView(params),
                            {
                                class: 'flex-grow-1 overflow-y-auto h-100',
                                style: {
                                    minHeight: '0px'
                                },
                                children: [
                                    child$(
                                        events.selectedStep$,
                                        ({ flowId, step }) => {

                                            if (step != undefined)
                                                return new StepView({ state: this.state, project: this.project, flowId, step })

                                            if (flowId != undefined)
                                                return new FlowSummaryView(params)

                                            return new ProjectSummaryView(params)
                                        }
                                    )
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }
}



class ProjectSummaryView implements VirtualDOM {

    public readonly class = "w-100 border-top py-4 "
    public readonly state: AppState

    public readonly children: VirtualDOM[]
    public readonly project: Project

    constructor(params: { state: AppState, project: Project }) {

        Object.assign(this, params)

        this.children = [
            {
                tag: 'h3',
                innerText: 'Project overview'
            },
            child$(
                this.state.projectEvents[this.project.id].projectStatusResponse$,
                (data) => {
                    return new DataView(data)
                }
            )
        ]
    }
}


class FlowSummaryView implements VirtualDOM {

    public readonly class = "w-100"
    public readonly state: AppState

    public readonly children: VirtualDOM[]
    public readonly project: Project

    constructor(params: { state: AppState, project: Project }) {

        Object.assign(this, params)
        let selectedStep$ = this.state.projectEvents[this.project.id].selectedStep$


        this.children = [
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
