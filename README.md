# Developer-portal


Front-end application of [py-youwol](https://github.com/youwol/py-youwol) to extends the Youwol Platform, regarding both front-end and back-end sides.
Providing py-youwol running on port 2000, the application can be visited 
[here](http://localhost:2000/applications/@youwol/developer-portal/latest).

User guide can be found [here](https://l.youwol.com/doc/@youwol/developer-portal).

Developer's documentation, coverage and bundle's analysis can be found
[here](https://platform.youwol.com/applications/@youwol/developer-portal/latest?package=@youwol/platform).

## Installation, Build & Test

To install the required dependencies:

```shell
yarn
```
---
To build for development:

```shell
yarn build:dev
```

To build for production:

```shell
yarn build:prod
```

---
To start the 'dev-server':
- add `CdnOverride(packageName="@youwol/developer-portal", port=3000)` in your
  [YouWol configuration file](https://l.youwol.com/doc/py-youwol/configuration)
  (in the `dispatches` list).
- run [py-youwol](https://platform.youwol.com/documentation/py-youwol)
- then execute
  ```shell
  yarn start
  ```

Then, browse to the url `http://localhost:2000/applications/@youwol/developer-portal/latest`
> the port `2000` is the default port for py-youwol, it can be redefined in your py-youwol's configuration file.
---

To generate code documentation:

```shell
yarn doc
```
