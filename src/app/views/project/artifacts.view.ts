import { child$, VirtualDOM } from "@youwol/flux-view";
import { Select } from "@youwol/fv-input";
import { Artifact } from "src/app/client/models";
import { FilesBrowserView } from "../files-browser.view";


export class ArtifactItem extends Select.ItemData {

    constructor(public readonly artifact: Artifact) {
        super(artifact.id, artifact.id)
    }
}

export class ArtifactsView implements VirtualDOM {

    public readonly class = "border-top py-4 "
    public readonly children: VirtualDOM[]

    constructor(artifacts: Artifact[]) {

        let select = new Select.State(
            artifacts.map(a => new ArtifactItem(a)),
            artifacts[0].id
        )

        this.children = [
            {
                tag: 'h3',
                innerText: 'Artifacts'
            },
            {
                class: "pl-3",
                children: [
                    {
                        class: "d-flex align-items-center mb-3",
                        children: [
                            {
                                innerText: 'pick artifact:'
                            },
                            new Select.View({ state: select, class: 'mx-2 px-1' } as any)
                        ]
                    },
                    child$(
                        select.selection$,
                        (item: ArtifactItem) => {
                            return new FilesBrowserView({
                                startingFolder: item.artifact.path,
                                originFolderIndex: item.artifact.path.split('/').length - 1
                            })
                        }
                    )
                ]
            }
        ]
    }
}
