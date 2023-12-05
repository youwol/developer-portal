import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import * as pyYw from '@youwol/local-youwol-client'

/**
 * @category View
 */
export class RunOutputsView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = ''

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor(messages$: Observable<pyYw.ContextMessage>) {
        this.children = [
            {
                tag: 'div',
                style: {
                    fontFamily: 'monospace' as const,
                    fontSize: 'x-small',
                    whiteSpace: 'pre',
                },
                children: {
                    policy: 'append',
                    source$: messages$.pipe(map((m) => [m])),
                    vdomMap: (message: pyYw.ContextMessage<unknown>) => {
                        return {
                            tag: 'div',
                            innerText: `${message.text}`,
                        }
                    },
                },
            },
        ]
    }
}
