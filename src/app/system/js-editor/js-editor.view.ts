import { VirtualDOM } from '@youwol/flux-view'
import { SystemState } from '../system.state'
import { install } from '@youwol/cdn-client'

const defaultExeSrc = `
return async ({debug}) => {
    const CDN = window['@youwol/cdn-client']
    const FluxView = window['@youwol/flux-view']
    debug('CDN', CDN)
    debug('FluxView', FluxView)
    debug('view', { innerText: 'hello' })
    
    return true
}
`
const defaultTestSrc = `
return async (result, {expect}) => {
    expect("A dummy passing test", true)
    return true
}`

/**
 * @category View
 */
export class JsEditorView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-100 h-100'

    /**
     * @group Observables
     */
    public readonly children: VirtualDOM[]

    constructor(_params: { systemState: SystemState }) {
        this.children = [
            {
                class: 'w-100 h-100',
                connectedCallback: (elem: HTMLDivElement) => {
                    elem.setAttribute('src', defaultExeSrc)
                    elem.setAttribute('src-test', defaultTestSrc)
                    install({
                        scripts: [
                            '@youwol/grapes-coding-playgrounds#^0.1.2~dist/@youwol/grapes-coding-playgrounds/js-playground.js',
                        ],
                        aliases: {
                            lib: `@youwol/grapes-coding-playgrounds/js-playground_APIv01`,
                        },
                    }).then((w) => {
                        w['lib'].renderElement(elem)
                    })
                },
            },
        ]
    }
}
