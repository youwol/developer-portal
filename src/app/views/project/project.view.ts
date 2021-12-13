import { child$, HTMLElement$, VirtualDOM } from "@youwol/flux-view"
import { AppState } from "src/app/app-state"
import { PipelineStep, Project } from "../../client/models"
import { DagView } from "./dag.view"
import { BehaviorSubject } from "rxjs"
import { filter } from "rxjs/operators"
import { StepView } from "./step.view"



export class ProjectView implements VirtualDOM {


    public readonly class = "w-100 h-100 d-flex flex-wrap p-2 "

    public readonly children: VirtualDOM[]

    public readonly state: AppState

    public readonly project: Project

    connectedCallback: (elem: HTMLElement$ & HTMLDivElement) => void

    selectedStep$ = new BehaviorSubject<PipelineStep>(undefined)

    constructor(params: { state: AppState, project: Project }) {

        Object.assign(this, params)

        this.children = [
            {
                class: 'd-flex justify-content-around w-100 h-100',
                children: [
                    new DagView({ project: this.project, selectedStep$: this.selectedStep$ }),
                    child$(
                        this.selectedStep$.pipe(
                            filter(d => d != undefined)
                        ),
                        (step) => {
                            return new StepView({ state: this.state, project: this.project, step })
                        }
                    )
                ]
            }
        ]
    }
}
