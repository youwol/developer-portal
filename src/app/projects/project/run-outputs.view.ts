import { childrenAppendOnly$, VirtualDOM } from '@youwol/flux-view'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import * as pyYw from '@youwol/local-youwol-client'

/**
 * @category View
 */
export class RunOutputsView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = ''

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor(messages$: Observable<pyYw.ContextMessage>) {
        this.children = [
            {
                style: {
                    fontFamily: 'monospace',
                    fontSize: 'x-small',
                    whiteSpace: 'pre',
                },
                children: childrenAppendOnly$(
                    messages$.pipe(map((m) => [m])),
                    (message) => {
                        return {
                            innerText: message.text,
                        }
                    },
                ),
            },
        ]
    }
}
