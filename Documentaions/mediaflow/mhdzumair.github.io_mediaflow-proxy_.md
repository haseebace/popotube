# MediaFlow Proxy

![MediaFlow Proxy Logo](https://cdn.githubraw.com/mhdzumair/mediaflow-proxy/main/mediaflow_proxy/static/logo.png)

MediaFlow Proxy is a flexible server for proxifying media streams: HTTP(S), HLS (M3U8), and MPEG-DASH, including **ClearKey** DRM. It can convert DRM-protected DASH to decrypted HLS in real time.

## Quick start

Run with Docker (set a password):

```
docker run -p 8888:8888 -e API_PASSWORD=your_password mhdzumair/mediaflow-proxy
```

Then open the interactive API docs at `http://localhost:8888/docs` (unless disabled with `DISABLE_DOCS`).

For install options (Compose, pip, uv, hosted services), see [Installation](https://mhdzumair.github.io/mediaflow-proxy/installation/).

## Where to read next

| Topic                                | Doc                                                                                          |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| Capabilities and DASH/MPD support    | [Features](https://mhdzumair.github.io/mediaflow-proxy/features/)                            |
| Environment variables and deployment | [Configuration](https://mhdzumair.github.io/mediaflow-proxy/configuration/environment/)      |
| Endpoints and usage                  | [Usage overview](https://mhdzumair.github.io/mediaflow-proxy/usage/overview/)                |
| Debrid / Stremio integration         | [Debrid & Stremio](https://mhdzumair.github.io/mediaflow-proxy/integrations/debrid-stremio/) |

## Project links

- [Source on GitHub](https://github.com/mhdzumair/mediaflow-proxy)
- [Package on PyPI](https://pypi.org/project/mediaflow-proxy/)

Made with
[Material for MkDocs](https://squidfunk.github.io/mkdocs-material/)
