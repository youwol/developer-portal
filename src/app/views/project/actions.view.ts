import { childrenAppendOnly$, VirtualDOM } from "@youwol/flux-view";
import { Observable } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
import { PyYouwolClient } from "../../client/py-youwol.client";
import { ContextMessage, PipelineStepStatusResponse } from "../../client/models";
import { button } from "../utils-view";




export class ActionsView implements VirtualDOM {

    public readonly class = "my-2"

    public readonly children: VirtualDOM[]

    constructor(data: PipelineStepStatusResponse, statusMessages$: Observable<ContextMessage>) {

        let outputsRun$ = statusMessages$.pipe(
            filter(message => message.attributes['event'].includes("PipelineStatusPending:run"))
        )

        let btnRun = button("fas fa-play", "run")

        btnRun.state.click$.pipe(
            mergeMap(() => PyYouwolClient.projects.runStep$(data.projectId, data.flowId, data.stepId)
            )
        ).subscribe(() => {
        })

        this.children = [
            btnRun,
            {
                class: "pl-3 py-3",
                children: [
                    {
                        style: {
                            fontFamily: "monospace",
                            fontSize: 'x-small'
                        },
                        children: childrenAppendOnly$(
                            outputsRun$.pipe(map(m => [m])),
                            (message) => {
                                return {
                                    innerText: message.text
                                }
                            }
                        )
                    }
                ]
            }
        ]
    }
}
