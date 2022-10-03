import { VirtualDOM } from '@youwol/flux-view'

import * as pyYw from '@youwol/local-youwol-client'

import { DataView } from '../../common/terminal'

/**
 * @category View
 */
export class ManifestView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = ''

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor(manifest: pyYw.Routers.Projects.Manifest) {
        this.children = [
            {
                tag: 'h3',
                innerText: 'Step summary',
            },
            {
                children: [
                    {
                        class: 'my-3',
                        children: [
                            {
                                style: { width: 'fit-content' },
                                innerText: 'Fingerprint',
                                class: 'mr-3 mb-2 border-bottom',
                            },
                            {
                                innerText: manifest.fingerprint,
                            },
                        ],
                    },
                    {
                        class: 'my-3',
                        children: [
                            {
                                style: { width: 'fit-content' },
                                innerText: 'Source files',
                                class: 'mr-3 mb-2 border-bottom',
                            },
                            new DataView(manifest.files),
                        ],
                    },
                    {
                        class: 'my-3',
                        children: [
                            {
                                style: { width: 'fit-content' },
                                innerText: 'Output logs',
                                class: 'mr-3 mb-2  border-bottom',
                            },
                            {
                                style: {
                                    fontFamily: 'monospace',
                                    fontSize: 'x-small',
                                    whiteSpace: 'pre',
                                },
                                children: Array.isArray(manifest.cmdOutputs)
                                    ? manifest.cmdOutputs.map((output) => {
                                          return { innerText: output }
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
