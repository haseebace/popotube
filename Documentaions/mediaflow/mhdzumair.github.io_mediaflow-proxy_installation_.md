---
url: "https://mhdzumair.github.io/mediaflow-proxy/installation/"
title: "Installation - MediaFlow Proxy"
---

[Skip to content](https://mhdzumair.github.io/mediaflow-proxy/installation/#installation)

[MediaFlow Proxy](https://mhdzumair.github.io/mediaflow-proxy/ "MediaFlow Proxy")

MediaFlow Proxy



Installation



Type to start searching

[mhdzumair/mediaflow-proxy\\
\\
\\
- 2.4.6\\
- 653\\
- 401](https://github.com/mhdzumair/mediaflow-proxy "Go to repository")

- [Home](https://mhdzumair.github.io/mediaflow-proxy/)
- [Features](https://mhdzumair.github.io/mediaflow-proxy/features/)
- [Installation](https://mhdzumair.github.io/mediaflow-proxy/installation/)
- [Configuration](https://mhdzumair.github.io/mediaflow-proxy/configuration/environment/)
- [Usage](https://mhdzumair.github.io/mediaflow-proxy/usage/overview/)
- [Integrations](https://mhdzumair.github.io/mediaflow-proxy/integrations/debrid-stremio/)
- [Guides](https://mhdzumair.github.io/mediaflow-proxy/guides/base64-urls/)
- [Reference](https://mhdzumair.github.io/mediaflow-proxy/reference/limitations/)
- [Community](https://mhdzumair.github.io/mediaflow-proxy/community/acknowledgements/)

[MediaFlow Proxy](https://mhdzumair.github.io/mediaflow-proxy/ "MediaFlow Proxy")
MediaFlow Proxy


[mhdzumair/mediaflow-proxy\\
\\
\\
- 2.4.6\\
- 653\\
- 401](https://github.com/mhdzumair/mediaflow-proxy "Go to repository")

- [Home](https://mhdzumair.github.io/mediaflow-proxy/)
- [Features](https://mhdzumair.github.io/mediaflow-proxy/features/)
- [ ]


Installation



[Installation](https://mhdzumair.github.io/mediaflow-proxy/installation/)
Table of contents


  - [Option 1: Self-Hosted Deployment](https://mhdzumair.github.io/mediaflow-proxy/installation/#option-1-self-hosted-deployment)

    - [Using Docker from Docker Hub](https://mhdzumair.github.io/mediaflow-proxy/installation/#using-docker-from-docker-hub)

  - [Using Docker Compose](https://mhdzumair.github.io/mediaflow-proxy/installation/#using-docker-compose)

    - [Using pip](https://mhdzumair.github.io/mediaflow-proxy/installation/#using-pip)
    - [Using git & uv](https://mhdzumair.github.io/mediaflow-proxy/installation/#using-git-uv)
    - [Build and Run Docker Image Locally](https://mhdzumair.github.io/mediaflow-proxy/installation/#build-and-run-docker-image-locally)

  - [Option 2: Premium Hosted Service (ElfHosted)](https://mhdzumair.github.io/mediaflow-proxy/installation/#option-2-premium-hosted-service-elfhosted)
  - [Option 3: Hugging Face Space Deployment (Guide from a MediaFlow Contributor)](https://mhdzumair.github.io/mediaflow-proxy/installation/#option-3-hugging-face-space-deployment-guide-from-a-mediaflow-contributor)

- [ ]


Configuration






Configuration




  - [Environment variables](https://mhdzumair.github.io/mediaflow-proxy/configuration/environment/)
  - [Docker, Gunicorn & Redis](https://mhdzumair.github.io/mediaflow-proxy/configuration/runtime/)
  - [Acestream](https://mhdzumair.github.io/mediaflow-proxy/configuration/acestream/)
  - [Telegram](https://mhdzumair.github.io/mediaflow-proxy/configuration/telegram/)
  - [Networking & reverse proxies](https://mhdzumair.github.io/mediaflow-proxy/configuration/networking/)
  - [Speed test](https://mhdzumair.github.io/mediaflow-proxy/configuration/speedtest/)

- [ ]


Usage






Usage




  - [Overview & endpoints](https://mhdzumair.github.io/mediaflow-proxy/usage/overview/)
  - [Video extractor](https://mhdzumair.github.io/mediaflow-proxy/usage/extractor/)
  - [Xtream Codes proxy](https://mhdzumair.github.io/mediaflow-proxy/usage/xtream/)
  - [URL parameters & generation](https://mhdzumair.github.io/mediaflow-proxy/usage/url-params-and-encoding/)
  - [Examples](https://mhdzumair.github.io/mediaflow-proxy/usage/examples/)

- [ ]


Integrations






Integrations




  - [Debrid & Stremio](https://mhdzumair.github.io/mediaflow-proxy/integrations/debrid-stremio/)

- [ ]


Guides






Guides




  - [Base64 URLs](https://mhdzumair.github.io/mediaflow-proxy/guides/base64-urls/)

- [ ]


Reference






Reference




  - [Limitations](https://mhdzumair.github.io/mediaflow-proxy/reference/limitations/)

- [ ]


Community






Community




  - [Acknowledgements](https://mhdzumair.github.io/mediaflow-proxy/community/acknowledgements/)
  - [Contributing](https://mhdzumair.github.io/mediaflow-proxy/community/contributing/)

Table of contents


- [Option 1: Self-Hosted Deployment](https://mhdzumair.github.io/mediaflow-proxy/installation/#option-1-self-hosted-deployment)

  - [Using Docker from Docker Hub](https://mhdzumair.github.io/mediaflow-proxy/installation/#using-docker-from-docker-hub)

- [Using Docker Compose](https://mhdzumair.github.io/mediaflow-proxy/installation/#using-docker-compose)

  - [Using pip](https://mhdzumair.github.io/mediaflow-proxy/installation/#using-pip)
  - [Using git & uv](https://mhdzumair.github.io/mediaflow-proxy/installation/#using-git-uv)
  - [Build and Run Docker Image Locally](https://mhdzumair.github.io/mediaflow-proxy/installation/#build-and-run-docker-image-locally)

- [Option 2: Premium Hosted Service (ElfHosted)](https://mhdzumair.github.io/mediaflow-proxy/installation/#option-2-premium-hosted-service-elfhosted)
- [Option 3: Hugging Face Space Deployment (Guide from a MediaFlow Contributor)](https://mhdzumair.github.io/mediaflow-proxy/installation/#option-3-hugging-face-space-deployment-guide-from-a-mediaflow-contributor)

# Installation

## Option 1: Self-Hosted Deployment

### Using Docker from Docker Hub

1. Pull & Run the Docker image:



```
docker run -p 8888:8888 -e API_PASSWORD=your_password mhdzumair/mediaflow-proxy
```



    Custom listen port (host and container must match the chosen `PORT`):



```
docker run -p 8889:8889 -e PORT=8889 -e API_PASSWORD=your_password mhdzumair/mediaflow-proxy
```


## Using Docker Compose

1. Set the `API_PASSWORD` and other environment variables in `.env`:

```
echo "API_PASSWORD=your_password" > .env
```

2\. Bring up the Docker Container:

```
docker compose up --detach
```

### Using pip

> \[!IMPORTANT\]
> Ensure that you have Python 3.10 or higher installed.

1. Install the package:




```
pip install mediaflow-proxy
```

2. Set the `API_PASSWORD` and other environment variables in `.env`:




```
echo "API_PASSWORD=your_password" > .env
```

3. Run the MediaFlow Proxy server:




```
mediaflow-proxy
```



    You can access the server at `http://localhost:8888` (or `http://localhost:$PORT` if you set the `PORT` environment variable).

4. To run the server with uvicorn options: (Optional)




```
uvicorn mediaflow_proxy.main:app --host 0.0.0.0 --port 8888 --workers 4 --forwarded-allow-ips "*"
```


> **Note**
>
> > Omit `--forwarded-allow-ips "*"` when running locally.

### Using git & uv

> \[!IMPORTANT\]
> Ensure that you have Python 3.10 or higher and [uv](https://docs.astral.sh/uv/getting-started/installation/) installed.

1. Clone the repository:




```
git clone https://github.com/mhdzumair/mediaflow-proxy.git
cd mediaflow-proxy
```

2. Install dependencies using uv:




```
uv sync
```

3. Set the `API_PASSWORD` environment variable in `.env`:




```
echo "API_PASSWORD=your_password" > .env
```

4. Run the FastAPI server:




```
uv run uvicorn mediaflow_proxy.main:app --host 0.0.0.0 --port 8888 --workers 4 --forwarded-allow-ips "*"
```


> **Note**
>
> > Omit `--forwarded-allow-ips "*"` when running locally.

### Build and Run Docker Image Locally

1. Build the Docker image:




```
docker build -t mediaflow-proxy .
```

2. Run the Docker container:




```
docker run -d -p 8888:8888 -e API_PASSWORD=your_password --restart unless-stopped --name mediaflow-proxy mediaflow-proxy
```



    Example with a non-default port:



```
docker run -d -p 8889:8889 -e PORT=8889 -e API_PASSWORD=your_password --restart unless-stopped --name mediaflow-proxy mediaflow-proxy
```


## Option 2: Premium Hosted Service (ElfHosted)

![ElfHosted Logo](https://store.elfhosted.com/wp-content/uploads/2024/08/mediaflow-proxy.jpg)

For a hassle-free, high-performance deployment of MediaFlow Proxy, consider the premium hosted service through ElfHosted.

To purchase:
1\. Visit [https://store.elfhosted.com/product/mediaflow-proxy](https://store.elfhosted.com/product/mediaflow-proxy)
2\. Follow ElfHosted's setup instructions

Benefits:
\- Instant setup and automatic updates
\- High performance and 24/7 availability
\- No server maintenance required

Ideal for users who want a reliable, plug-and-play solution without the technical overhead of self-hosting.

## Option 3: Hugging Face Space Deployment (Guide from a MediaFlow Contributor)

1. Go to this repo and create a fork: https://github.com/UrloMythus/UnHided
2. Sign up or log in to Hugging Face: https://huggingface.co/
3. Create a new space with a random name: https://huggingface.co/new-space. Choose Docker as SDK and blank template and public visibility.
4. Go to the "Settings" tab and create a new secret with the name `API_PASSWORD` and set the value to your desired password.
5. Go to the "Files" tab and create a new file with the name `Dockerfile` and paste the following content. After that, replace `YourUsername/YourRepoName` in the Dockerfile with your username and the name of your fork. Finally, click on "Commit" to save the changes. Remember, your space might get banned if instead of using your fork, you use the main repo.



```
FROM python:3.11-slim-bullseye

WORKDIR /app

RUN apt-get update && apt-get install -y git

RUN git clone https://github.com/YourUsername/YourRepoName.git .

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 7860
CMD ["uvicorn", "run:main_app", "--host", "0.0.0.0", "--port", "7860", "--workers", "4"]
```

6. Wait until the space gets built and deployed. Don't panic if you see "Your app is running" instead of the usual mediaflowproxy page. You can still use it as usual.
7. If the space is deployed successfully, you can click on the three dots in the top right corner and click on "Embed this space" and copy the "Direct URL".
8. To update your proxy to the newest release, go to your GitHub fork and click on Sync. After that, hop on your Hugging Face Space -> Settings and click on Factory Rebuild.
9. Use the above URL and API password on support addons like MediaFusion, MammaMia, Jackettio, etc.



Made with
[Material for MkDocs](https://squidfunk.github.io/mkdocs-material/)