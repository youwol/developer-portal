type AllTags = keyof HTMLElementTagNameMap
export type Configuration = {
    TypeCheck: 'strict'
    SupportedHTMLTags: 'DevTags' extends 'Prod' ? AllTags : DevTags
    WithFluxView: false
}

type DevTags =
    | 'ul'
    | 'li'
    | 'div'
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6'
    | 'p'
    | 'img'
    | 'pre'
    | 'iframe'
    | 'form'
    | 'i'
    | 'a'
    | 'input'
    | 'span'
    | 'button'
    | 'select'
    | 'option'
    | 'table'
    | 'thead'
    | 'td'
    | 'tr'
    | 'th'
    | 'tbody'
    | 'br'
    | 'header'
