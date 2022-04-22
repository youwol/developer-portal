import { render } from '@youwol/flux-view'
import { AppView } from './app-view'
require('./style.css')

const vDOM = new AppView()
document.body.appendChild(render(vDOM))
