import { child$, HTMLElement$, VirtualDOM } from "@youwol/flux-view"
import { dagStratify, decrossOpt, layeringLongestPath, sugiyama } from "d3-dag"
import { AppState } from "src/app/app-state"
import { Project } from "src/app/client/models"
import * as d3 from 'd3'
import { DagView, renderDag } from "./dag.view"
import { BehaviorSubject } from "rxjs"
import { Step } from "@youwol/flux-core/src/lib/simple-parser/branch"
import { filter } from "rxjs/operators"



export class ProjectView implements VirtualDOM {


    public readonly class = "w-100 h-100 d-flex flex-wrap p-2 "

    public readonly children: VirtualDOM[]

    public readonly state: AppState

    public readonly project: Project

    connectedCallback: (elem: HTMLElement$ & HTMLDivElement) => void

    selectedStep$ = new BehaviorSubject<Step>(undefined)

    constructor(params: { state: AppState, project: Project }) {

        Object.assign(this, params)

        this.children = [
            {
                class: 'd-flex justify-content-around w-100',
                children: [
                    new DagView({ project: this.project, selectedStep$: this.selectedStep$ }),
                    child$(
                        this.selectedStep$.pipe(filter(d => d != undefined)),
                        (d) => {
                            return { tag: 'h1', class: 'w-50', innerText: d.id }
                        }
                    )
                ]
            }
        ]
    }
}
