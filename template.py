import shutil
from pathlib import Path

from youwol.pipelines.pipeline_typescript_weback_npm import Template, PackageType, Dependencies, \
    RunTimeDeps, generate_template, DevServer, Bundles, MainModule
from youwol_utils import parse_json

folder_path = Path(__file__).parent

pkg_json = parse_json(folder_path / 'package.json')


template = Template(
    path=folder_path,
    type=PackageType.Application,
    name=pkg_json['name'],
    version=pkg_json['version'],
    shortDescription=pkg_json['description'],
    author=pkg_json['author'],
    dependencies=Dependencies(
        runTime=RunTimeDeps(
            externals={
                'rxjs': '^6.5.5',
                '@youwol/http-clients': '^1.0.4',
                '@youwol/cdn-client': '^1.0.2',
                '@youwol/flux-view': '^1.0.3',
                '@youwol/fv-group': '^0.2.1',
                '@youwol/fv-input': '^0.2.1',
                '@youwol/fv-button': '^0.1.1',
                '@youwol/fv-tree': '^0.2.3',
                '@youwol/fv-tabs': '^0.2.1',
                '@youwol/os-top-banner': '^0.1.1',
                '@youwol/installers-youwol': '^0.1.3',
                'd3': '^5.15.0',
                'codemirror': '^5.52.0',
                '@youwol/fv-code-mirror-editors': '^0.2.0'
            },
            includedInBundle={
                "d3-dag": "0.8.2"
            }
        ),
        devTime={
            #  those two prevent failure of typedoc
            "@types/lz-string": "^1.3.34",
            "lz-string": "^1.4.4"
        }
    ),
    userGuide=True,
    devServer=DevServer(
        port=3000
    ),
    bundles=Bundles(
        mainModule=MainModule(
            entryFile='./app/index.html',
            loadDependencies=['rxjs', '@youwol/http-clients', '@youwol/cdn-client', '@youwol/flux-view',
                              '@youwol/fv-group', '@youwol/fv-input', '@youwol/fv-button', '@youwol/fv-tree',
                              '@youwol/fv-tabs', '@youwol/os-top-banner', '@youwol/installers-youwol', 'd3',
                              'codemirror']
        )
    )
)

generate_template(template)

shutil.copyfile(
    src=folder_path / '.template' / 'src' / 'auto-generated.ts',
    dst=folder_path / 'src' / 'auto-generated.ts'
)

for file in ['README.md', '.gitignore', '.npmignore', '.prettierignore', 'LICENSE', 'package.json',
             'tsconfig.json', 'webpack.config.ts']:
    shutil.copyfile(
        src=folder_path / '.template' / file,
        dst=folder_path / file
    )


