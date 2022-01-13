import { childrenAppendOnly$, VirtualDOM } from "@youwol/flux-view";
import { Observable } from "rxjs";
import { filter, map } from "rxjs/operators";
import { ContextMessage, PipelineStepStatusResponse } from "../../../client/models";




export class RunOutputsView implements VirtualDOM {

    public readonly class = "my-2"

    public readonly children: VirtualDOM[]

    constructor(messages$: Observable<ContextMessage>) {

        this.children = [
            {
                style: {
                    fontFamily: "monospace",
                    fontSize: 'x-small'
                },
                children: childrenAppendOnly$(
                    messages$.pipe(map(m => [m])),
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
