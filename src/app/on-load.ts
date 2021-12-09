
import { render } from '@youwol/flux-view'
import { take } from 'rxjs/operators';
import { AppView } from './app-view';
import { PyYouwolClient } from './client/py-youwol.client';

require('./style.css');

PyYouwolClient.connectWs().pipe(
    take(1)
).subscribe(() => {

    let vDOM = new AppView()
    document.body.appendChild(render(vDOM))
})
