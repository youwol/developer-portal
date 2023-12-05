import { ChildrenLike, RxHTMLElement, VirtualDOM } from '@youwol/rx-vdom'
import { SystemState } from '../system.state'
import { install } from '@youwol/webpm-client'

const defaultExeSrc = `
return async ({debug}) => {
    const Webpm = window['@youwol/webpm-client']
    const RxDom = window['@youwol/rx-vdom']
    debug('Webpm', Webpm)
    debug('RxDom', RxDom)
    debug('view', { tag:'div', innerText: 'hello' })
    
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
export class JsEditorView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-100 h-100'

    /**
     * @group Observables
     */
    public readonly children: ChildrenLike

    constructor(_params: { systemState: SystemState }) {
        this.children = [
            {
                tag: 'div',
                class: 'w-100 h-100',
                connectedCallback: (elem: RxHTMLElement<'div'>) => {
                    elem.setAttribute('src', defaultExeSrc)
                    elem.setAttribute('src-test', defaultTestSrc)
                    install({
                        scripts: [
                            '@youwol/grapes-coding-playgrounds#latest~dist/@youwol/grapes-coding-playgrounds/js-playground.js',
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
