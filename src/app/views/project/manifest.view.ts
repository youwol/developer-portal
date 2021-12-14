import { VirtualDOM } from "@youwol/flux-view";
import { ManifestResponse } from "../../client/models";

import { DataView } from './terminal/data.view'


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
                                innerText: 'Source files',
                                class: 'mr-3'
                            },
                            new DataView(manifest.files)
                        ]
                    },
                    {
                        class: 'my-3',
                        children: [
                            {
                                innerText: 'Outputs',
                                class: 'mr-3'
                            },
                            {
                                style: {
                                    fontFamily: "monospace",
                                    fontSize: 'x-small'
                                },
                                children: manifest.cmdOutputs.map(output => {
                                    return { innerText: output }
                                })
                            }
                        ]
                    }
                ]
            }
        ]
    }
}
