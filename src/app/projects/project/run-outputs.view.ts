import { childrenAppendOnly$, VirtualDOM } from '@youwol/flux-view'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { PyYouwol as pyYw } from '@youwol/http-clients'

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
