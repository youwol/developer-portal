import { childrenAppendOnly$, VirtualDOM } from "@youwol/flux-view";
import { Observable } from "rxjs";
import { filter, map } from "rxjs/operators";
import { ContextMessage, PipelineStepStatusResponse } from "../../client/models";




export class RunOutputsView implements VirtualDOM {

    public readonly class = "my-2"

    public readonly children: VirtualDOM[]

    constructor(data: PipelineStepStatusResponse, statusMessages$: Observable<ContextMessage>) {

        let outputsRun$ = statusMessages$.pipe(
            filter(message => message.attributes['event'].includes("PipelineStatusPending:run"))
        )

        this.children = [
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
}
