import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'

import * as pyYw from '@youwol/local-youwol-client'

import { DataView } from '../../common/terminal'

/**
 * @category View
 */
export class ManifestView implements VirtualDOM<'div'> {
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

    constructor(manifest: pyYw.Routers.Projects.Manifest) {
        this.children = [
            {
                tag: 'h3',
                innerText: 'Step summary',
            },
            {
                tag: 'div',
                children: [
                    {
                        tag: 'div',
                        class: 'my-3',
                        children: [
                            {
                                tag: 'div',
                                style: { width: 'fit-content' },
                                innerText: 'Fingerprint',
                                class: 'mr-3 mb-2 border-bottom',
                            },
                            {
                                tag: 'div',
                                innerText: manifest.fingerprint,
                            },
                        ],
                    },
                    {
                        tag: 'div',
                        class: 'my-3',
                        children: [
                            {
                                tag: 'div',
                                style: { width: 'fit-content' },
                                innerText: 'Source files',
                                class: 'mr-3 mb-2 border-bottom',
                            },
                            new DataView(manifest.files),
                        ],
                    },
                    {
                        tag: 'div',
                        class: 'my-3',
                        children: [
                            {
                                tag: 'div',
                                style: { width: 'fit-content' },
                                innerText: 'Output logs',
                                class: 'mr-3 mb-2  border-bottom',
                            },
                            {
                                tag: 'div',
                                style: {
                                    fontFamily: 'monospace',
                                    fontSize: 'x-small',
                                    whiteSpace: 'pre',
                                },
                                children: Array.isArray(manifest.cmdOutputs)
                                    ? manifest.cmdOutputs.map((output) => {
                                          return {
                                              tag: 'div',
                                              innerText: `${output}`,
                                          } as VirtualDOM<'div'>
                                      })
                                    : [new DataView(manifest.cmdOutputs)],
                            },
                        ],
                    },
                ],
            },
        ]
    }
}
