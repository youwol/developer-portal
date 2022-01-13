import { VirtualDOM } from "@youwol/flux-view";
import { ManifestResponse } from "../../../client/models";

import { DataView } from '../../terminal/data.view'


export class ManifestView implements VirtualDOM {


    public readonly class = "border-top py-4 "
    public readonly children: VirtualDOM[]

    constructor(manifest: ManifestResponse) {

        this.children = [
            {
                tag: 'h3',
                innerText: 'Manifest'
            },
            {
                class: "pl-3",
                children: [
                    {
                        class: 'my-3',
                        children: [
                            {
                                style: { width: 'fit-content' },
                                innerText: 'Fingerprint',
                                class: 'mr-3 mb-2 border-bottom'
                            },
                            {
                                innerText: manifest.fingerprint,
                            },
                        ]
                    },
                    {
                        class: 'my-3',
                        children: [
                            {
                                style: { width: 'fit-content' },
                                innerText: 'Source files',
                                class: 'mr-3 mb-2 border-bottom'
                            },
                            new DataView(manifest.files)
                        ]
                    },
                    {
                        class: 'my-3',
                        children: [
                            {
                                style: { width: 'fit-content' },
                                innerText: 'Output logs',
                                class: 'mr-3 mb-2  border-bottom'
                            },
                            {
                                style: {
                                    fontFamily: "monospace",
                                    fontSize: 'x-small'
                                },
                                children: Array.isArray(manifest.cmdOutputs)
                                    ? manifest.cmdOutputs.map(output => {
                                        return { innerText: output }
                                    })
                                    : [new DataView(manifest.cmdOutputs)]
                            }
                        ]
                    }
                ]
            }
        ]
    }
}
