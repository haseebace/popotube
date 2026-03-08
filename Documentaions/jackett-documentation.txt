## Installation

### Windows Installation

#### Method 1: Using the Installer (Recommended)

**Prerequisites:**
- Windows 10 Version 1607 or newer
- Administrator privileges
- .NET prerequisites ([check here](https://learn.microsoft.com/en-us/dotnet/core/install/windows#net-installer))

**Installation Steps:**

1. Download the latest version of the [Windows installer](https://github.com/Jackett/Jackett/releases/latest/download/Jackett.Installer.Windows.exe)

2. Run the `Jackett.Installer.Windows.exe` program

3. When prompted for permission to make changes to your computer, click "Yes"

4. During installation:
   - Check "Install as Windows Service" if you want Jackett to start automatically with Windows
   - Check "Launch Jackett" to open Jackett after installation completes

5. Click "Install" and wait for the installation to finish

6. Double-click the Jackett tray icon, or navigate your web browser to `http://127.0.0.1:9117`

7. You are now ready to begin adding trackers

**Service Management:**
- When installed as a service, the tray icon acts as a way to open, start, or stop Jackett
- If not installed as a service, Jackett will run its web server from the tray tool

#### Method 2: Manual Installation

1. Download the [zipped version](https://github.com/Jackett/Jackett/releases/latest/download/Jackett.Binaries.Windows.zip)

2. Extract to your preferred location (e.g., `C:\ProgramData\Jackett`)

3. Run `JackettConsole.exe` to start Jackett

4. Navigate your web browser to `http://127.0.0.1:9117`

**Running from Command Line:**
You can run Jackett from the command line to see log messages. Use `JackettConsole.exe` (for Command Prompt), found in the Jackett data folder: e.g. `%ProgramData%\Jackett`. Ensure the server is not already running from the tray or service.

---

### Linux Installation (AMD x64)

This section covers installation on most common Linux distributions including Ubuntu, Linux Mint, Debian, Fedora, and others.

**Prerequisites:**
- Most operating systems include all required dependencies
- If dependencies are missing, refer to [.NET Required Packages](https://github.com/dotnet/core/blob/main/release-notes/9.0/os-packages.md)

#### Method 1: One-Command Installation (Easiest)

Copy and paste this command into your terminal:

```bash
cd /opt && f=Jackett.Binaries.LinuxAMDx64.tar.gz && sudo wget -Nc https://github.com/Jackett/Jackett/releases/latest/download/"$f" && sudo tar -xzf "$f" && sudo rm -f "$f" && cd Jackett* && sudo chown $(whoami):$(id -g) -R "/opt/Jackett" && sudo ./install_service_systemd.sh && systemctl status jackett.service && cd - && echo -e "\nVisit http://127.0.0.1:9117"
```

#### Method 2: Step-by-Step Installation

1. Download and extract the latest release:

   ```bash
   cd /opt
   sudo wget https://github.com/Jackett/Jackett/releases/latest/download/Jackett.Binaries.LinuxAMDx64.tar.gz
   sudo tar -xzf Jackett.Binaries.LinuxAMDx64.tar.gz
   sudo rm Jackett.Binaries.LinuxAMDx64.tar.gz
   ```

2. Set proper ownership:

   ```bash
   sudo chown -R $(whoami):$(id -g) /opt/Jackett
   ```

3. Install as a service:

   ```bash
   cd /opt/Jackett
   sudo ./install_service_systemd.sh
   ```

4. Check service status:

   ```bash
   systemctl status jackett.service
   ```

5. Navigate your web browser to `http://127.0.0.1:9117`

#### Running Without Installing as a Service

1. Download and extract the latest `Jackett.Binaries.LinuxAMDx64.tar.gz` release from the [releases](https://github.com/Jackett/Jackett/releases/latest) page

2. Open a Terminal and `cd` to the `Jackett` folder

3. Run Jackett with the command `./jackett`

#### Service Management Commands

```bash
# Start Jackett
systemctl start jackett.service

# Stop Jackett
systemctl stop jackett.service

# Restart Jackett
systemctl restart jackett.service

# Check status
systemctl status jackett.service
```

**Logs Location:** `~/.config/Jackett/log.txt`
**View Logs:** `journalctl -u jackett.service`

#### Home Directory Configuration

If you want to run Jackett with a user without a `/home` directory, add this line to your systemd file:

```text
Environment=XDG_CONFIG_HOME=/path/to/folder
```

This folder will be used to store configuration files.

---

### Linux Installation (ARMv7 or above)

For modern ARM-based systems (Raspberry Pi, etc.)

**Prerequisites:**
- Most operating systems include all required dependencies
- If dependencies are missing, refer to [.NET Required Packages](https://github.com/dotnet/core/blob/main/release-notes/9.0/os-packages.md)

#### Installing as a Service

1. Download the appropriate release:
   - For 32-bit ARM (most common): `Jackett.Binaries.LinuxARM32.tar.gz`
   - For 64-bit ARM: `Jackett.Binaries.LinuxARM64.tar.gz`

   ```bash
   cd /opt
   sudo wget https://github.com/Jackett/Jackett/releases/latest/download/Jackett.Binaries.LinuxARM32.tar.gz
   sudo tar -xzf Jackett.Binaries.LinuxARM32.tar.gz
   sudo rm Jackett.Binaries.LinuxARM32.tar.gz
   ```

2. Install as a service:

   ```bash
   cd /opt/Jackett
   sudo ./install_service_systemd.sh
   ```

3. The service will start on each login. Manage it using:

   ```bash
   # Start Jackett
   systemctl start jackett.service

   # Stop Jackett
   systemctl stop jackett.service

   # Restart Jackett
   systemctl restart jackett.service

   # Check status
   systemctl status jackett.service
   ```

1. Download and extract the latest `Jackett.Binaries.LinuxARM32.tar.gz` or `Jackett.Binaries.LinuxARM64.tar.gz` release from the [releases](https://github.com/Jackett/Jackett/releases/latest) page

2. Open a Terminal and `cd` to the `Jackett` folder

3. Run Jackett with the command `./jackett`

---

### Linux Installation (ARMv6 or below)

For legacy ARM systems.

**Prerequisites:**

1. Install Mono 5.10 or newer (latest stable release recommended):
   - Follow instructions on the [Mono website](http://www.mono-project.com/download/#download-lin)
   - Install `mono-devel` and `ca-certificates-mono` packages
   - On Red Hat/CentOS/openSUSE/Fedora, also install `mono-locale-extras`

2. Install libcurl:
   - Debian/Ubuntu: `apt-get install libcurl4-openssl-dev`
   - Redhat/Fedora: `yum install libcurl-devel`
   - For other distributions, see the [Curl documentation](http://curl.haxx.se/dlwiz/?type=devel)

3. Download and extract the latest `Jackett.Binaries.Mono.tar.gz` from the [releases page](https://github.com/Jackett/Jackett/releases/latest)

4. Run Jackett using Mono:

   ```bash
   mono --debug JackettConsole.exe
   ```

5. (Optional) To install as a service:

   ```bash
   sudo ./install_service_systemd_mono.sh
   ```

**Important Notes:**
- Mono must be compiled with the Roslyn compiler (default)
- Using MCS will cause "An error has occurred" errors (see [issue #2704](https://github.com/Jackett/Jackett/issues/2704))
- For users without a `/home` directory, add `Environment=XDG_CONFIG_HOME=/path/to/folder` to your systemd file

---

### macOS Installation

**Prerequisites:**
- macOS 13.0+ (Ventura) or greater

#### Installing as a Service

1. Download the appropriate release:
   - Intel (x86): `Jackett.Binaries.macOS.tar.gz`
   - Apple silicon (ARM): `Jackett.Binaries.macOSARM64.tar.gz`

   Get the latest release from the [releases page](https://github.com/Jackett/Jackett/releases/latest)

2. Extract the downloaded file

3. Open the extracted folder and double-click on `install_service_macos`

4. If installation is successful, close the Terminal window

5. Navigate your web browser to `http://127.0.0.1:9117`

**Service Management:**

The service will start on each login. You can control it using:

```bash
# Stop Jackett
launchctl unload ~/Library/LaunchAgents/org.user.Jackett.plist

# Start Jackett
launchctl load ~/Library/LaunchAgents/org.user.Jackett.plist
```

**Logs Location:**
- `~/.config/Jackett/log.txt`
- `/Users/your-user-name/Library/Application Support/Jackett/log.txt`

#### Running Without Installing as a Service

1. Download and extract the latest `Jackett.Binaries.macOS.tar.gz` or `Jackett.Binaries.macOSARM64.tar.gz` release from the [releases](https://github.com/Jackett/Jackett/releases/latest) page

2. Open Terminal and navigate to the Jackett folder

3. Run Jackett with the command `./jackett`

---

### Docker Installation

Docker installation is highly recommended, especially if you are experiencing Mono stability issues or having trouble running Mono on your system (e.g., QNAP, Synology).

Detailed instructions are available at [LinuxServer.io Jackett Docker](https://hub.docker.com/r/linuxserver/jackett/)

Thanks to [LinuxServer.io](https://linuxserver.io) for maintaining the Docker image.

---

### Other Installation Methods

#### Linux via Ansible

- CentOS/RedHat 7: [jewflix.jackett](https://galaxy.ansible.com/jewflix/jackett)
- Ubuntu 16: [chrisjohnson00.jackett](https://galaxy.ansible.com/chrisjohnson00/jackett)

#### Homebrew (macOS/Linux)

Install via Homebrew: [Homebrew Formulae - Jackett](https://formulae.brew.sh/formula/jackett)

#### Synology

Jackett is available as a beta package from [SynoCommunity](https://synocommunity.com/package/jackett)

#### Alpine Linux

Detailed instructions available at [Jackett's Wiki - Alpine Linux](https://github.com/Jackett/Jackett/wiki/Installation-on-Alpine-Linux)

#### OpenWrt

Detailed instructions available at [Jackett's Wiki - OpenWrt](https://github.com/Jackett/Jackett/wiki/Installation-on-OpenWrt)

---

## Uninstallation

### Windows

- Use "Add or Remove Programs" in Windows Settings
- Or run the installer again and choose "Uninstall"

### Linux

Run this command:

```bash
wget https://raw.githubusercontent.com/Jackett/Jackett/master/uninstall_service_systemd.sh --quiet -O - | sudo bash
```

### macOS

Run this command:

```bash
curl -sSL https://raw.githubusercontent.com/Jackett/Jackett/master/uninstall_jackett_macos | bash
```

---

## Configuration

### Running Behind Reverse Proxy

When running Jackett behind a reverse proxy, ensure that the original hostname of the request is passed to Jackett. If HTTPS is used, also set the `X-Forwarded-Proto` header to "https".

**Important:** Adjust the "Base path override" in Jackett settings accordingly.

#### Apache Configuration Example

```apache
<Location /jackett>
    ProxyPreserveHost On
    RequestHeader set X-Forwarded-Proto expr=%{REQUEST_SCHEME}
    ProxyPass http://127.0.0.1:9117
    ProxyPassReverse http://127.0.0.1:9117
</Location>
```

#### Nginx Configuration Example

```nginx
location /jackett {
    proxy_pass http://127.0.0.1:9117;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $http_host;
    proxy_redirect off;
}
```

### Search Cache

Jackett has an internal cache to increase search speed and reduce the number of requests to torrent sites. The default values should be suitable for most users.

**Configuration Options:**

- **Cache TTL (seconds):** Default is 2100 (35 minutes). This indicates how long results can remain in the cache.
- **Cache max results per indexer:** Default is 1000. This limits how many results are kept in cache for each indexer to control RAM usage.

**Note:** If you make many requests and have sufficient memory, you can increase the maximum results. If you experience problems, you can reduce the TTL value or disable the cache. Be aware that making too many requests can result in being banned by tracker sites.

### Torznab Cache

If you have enabled the Jackett internal cache but want to fetch fresh results for a specific query (ignoring the cache), add the `&cache=false` parameter to your Torznab query.

Example:

```text
http://127.0.0.1:9117/api/v2.0/indexers/all/results/torznab/api?apikey=YOUR_API_KEY&t=search&q=query&cache=false
```

### Configuring FlareSolverr

Some indexers are protected by Cloudflare or similar services, and Jackett cannot solve the challenges on its own. For these cases, [FlareSolverr](https://github.com/FlareSolverr/FlareSolverr) has been integrated into Jackett.

**What is FlareSolverr:**
FlareSolverr is a proxy server that solves Cloudflare and other anti-bot challenges, then provides Jackett with the necessary cookies.

**Setup Instructions:**

1. Install FlareSolverr service following their [installation instructions](https://github.com/FlareSolverr/FlareSolverr)

2. Configure FlareSolverr in Jackett:
   - Open Jackett settings
   - Set **FlareSolverr API URL** (e.g., `http://172.17.0.2:8191`)
   - It is recommended to keep the default value in **FlareSolverr Max Timeout (ms)**

**Note:** Setting up this service is optional. Most indexers do not require it.

### Configuring OMDb

This feature is used as a fallback when using the aggregate indexer to get the movie or series title if only the IMDB ID is provided in the request.

**Setup Instructions:**

1. Request a free API key from [OMDb](https://omdbapi.com/apikey.aspx)
   - Free tier allows 1,000 daily requests

2. Paste the API key in Jackett settings

---

## API Usage

### Jackett Torznab Query Syntax

Jackett accepts Torznab queries following the specifications described in the [Torznab specification document](https://torznab.github.io/spec-1.3-draft/index.html).

**Basic Query Structure:**

```text
http://127.0.0.1:9117/api/v2.0/indexers/<indexer-name>/results/torznab/api?apikey=<your-api-key>&t=<search-type>&<parameters>
```

**Examples:**

Get indexer capabilities:

```text
http://127.0.0.1:9117/api/v2.0/indexers/1337x/results/torznab/api?apikey=YOUR_API_KEY&t=caps
```

Perform a free text search:

```text
http://127.0.0.1:9117/api/v2.0/indexers/1337x/results/torznab/api?apikey=YOUR_API_KEY&t=search&q=ubuntu
```

### Search Modes and Parameters

Jackett supports the following search modes:

#### t=search (General Search)
**Parameters:** `q` (query string)

**Example:**

```text
.../api?apikey=YOUR_API_KEY&t=search&cat=100002,100003&q=Show+Title+S01E02
```

#### t=tvsearch (TV Search)
**Parameters:** `q`, `season`, `ep`, `imdbid`, `tvdbid`, `rid`, `tmdbid`, `tvmazeid`, `traktid`, `doubanid`, `year`, `genre`

**Examples:**

```text
.../api?apikey=YOUR_API_KEY&t=tvsearch&cat=5000&q=Show+Title&season=1&ep=2

.../api?apikey=YOUR_API_KEY&t=tvsearch&cat=5040,5045&genre=comedy&season=2023&ep=02/13
```

#### t=movie (Movie Search)
**Parameters:** `q`, `imdbid`, `tmdbid`, `traktid`, `doubanid`, `year`, `genre`

**Examples:**

```text
.../api?apikey=YOUR_API_KEY&t=movie&cat=100001&q=Movie+Title&year=2023

.../api?apikey=YOUR_API_KEY&t=movie&cat=2000&imdbid=tt1234567
```

#### t=music (Music Search)
**Parameters:** `q`, `album`, `artist`, `label`, `track`, `year`, `genre`

**Example:**

```text
.../api?apikey=YOUR_API_KEY&t=music&cat=100004&album=Title&artist=Name
```

#### t=book (Book Search)
**Parameters:** `q`, `title`, `author`, `publisher`, `year`, `genre`

**Example:**

```text
.../api?apikey=YOUR_API_KEY&t=book&cat=100005,100006&genre=horror&publisher=Stuff
```

**Note:** Most indexers will only support a subset of these search modes and parameters. Use `t=caps` to get a list of the actual modes and parameters supported by a specific indexer.

### Filter Indexers

A special "filter" indexer is available at:

```text
http://127.0.0.1:9117/api/v2.0/indexers/<filter>/results/torznab
```

It will query the configured indexers that match the filter expression criteria and return combined results as "all".

#### Supported Filters

| Filter | Condition |
|--------|-----------|
| `type:<type>` | Indexer type equals `<type>` |
| `tag:<tag>` | Indexer tags contain `<tag>` |
| `lang:<lang>` | Indexer language starts with `<lang>` |
| `test:passed` | Last indexer test passed |
| `test:failed` | Last indexer test failed |
| `status:healthy` | Indexer successfully operated in recent minutes |
| `status:failing` | Indexer generated errors in recent calls |
| `status:unknown` | Indexer unused for a while |

#### Supported Operators

| Operator | Condition |
|----------|-----------|
| `!<expr>` | NOT `<expr>` |
| `<expr1>+<expr2>` | `<expr1>` AND `<expr2>` |
| `<expr1>,<expr2>` | `<expr1>` OR `<expr2>` |

#### Filter Examples

**Example 1:**
Query indexers tagged with "group1" OR all non-private indexers with English language:

```text
.../api/v2.0/indexers/tag:group1,!type:private+lang:en/results/torznab
```

**Example 2:**
Query indexers that are not failing OR that passed their last test:

```text
.../api/v2.0/indexers/!status:failing,test:passed/results/torznab
```

### Aggregate Indexers

A special "all" indexer is available at:

```text
http://127.0.0.1:9117/api/v2.0/indexers/all/results/torznab
```

It will query all configured indexers and return combined results.

#### Important Considerations

**When to use the "all" indexer:**
- Quick setup with fewer configuration steps
- Testing multiple indexers at once

**Limitations of the "all" indexer:**
- You lose control over indexer-specific settings (categories, search modes, etc.)
- Mixing search modes (IMDB, query, etc.) might cause low-quality results
- Indexer-specific categories (>= 100000) cannot be used
- Slow indexers will slow down overall results
- Total results are limited to 1000

**Recommendation:** If your client supports multiple feeds, add each indexer directly instead of using the "all" indexer for better control and performance.

#### Getting Indexer Information

To get all Jackett indexers including their capabilities:

```text
.../api/v2.0/indexers/all/results/torznab/api?apikey=YOUR_API_KEY&t=indexers
```

To filter by configuration status:

```text
.../api/v2.0/indexers/all/results/torznab/api?apikey=YOUR_API_KEY&t=indexers&configured=true
.../api/v2.0/indexers/all/results/torznab/api?apikey=YOUR_API_KEY&t=indexers&configured=false
```

---

## Command Line Switches

You can pass various options when running Jackett via the command line:

### Windows Service Management
- `-i, --Install` - Install Jackett Windows service (requires administrator)
- `-s, --Start` - Start the Jackett Windows service (requires administrator)
- `-k, --Stop` - Stop the Jackett Windows service (requires administrator)
- `-u, --Uninstall` - Uninstall Jackett Windows service (requires administrator)
- `-r, --ReserveUrls` - Register Windows port reservations (required for listening on all interfaces)

### Configuration Options
- `-l, --Logging` - Log all requests/responses to Jackett
- `-t, --Tracing` - Enable tracing
- `-c, --UseClient` - Override web client selection: `automatic` (default), `httpclient`, `httpclient2`
- `-x, --ListenPublic` - Listen publicly (accessible from other devices)
- `-z, --ListenPrivate` - Only allow local access (default)
- `-p, --Port` - Specify web server port (default: 9117)
- `-n, --IgnoreSslErrors` - Ignore invalid SSL certificates: `true` or `false`
- `-d, --DataFolder` - Specify the location of the data folder (requires administrator on Windows)
  - Example: `--DataFolder="D:\Your Data\Jackett\"`
  - Note: Do not use this on Unix (Mono) systems. Adjust the HOME directory or set XDG_CONFIG_HOME environment variable instead
- `--NoRestart` - Don't restart after update
- `--PIDFile` - Specify the location of the PID file
- `--NoUpdates` - Disable automatic updates
- `--help` - Display help screen
- `--version` - Display version information

### Example Usage

```bash
# Start Jackett on a custom port
./jackett --Port 9118

# Start with public access enabled
./jackett --ListenPublic

# Start with custom data folder (Windows)
JackettConsole.exe --DataFolder="D:\Jackett Data"

# Enable detailed logging
./jackett --Logging --Tracing
```

---

## Building from Source

### Windows

See the [contributing guide](https://github.com/Jackett/Jackett/blob/master/CONTRIBUTING.md#contributing-code) for detailed instructions.

### macOS

**Prerequisites:**
Install .NET SDK manually from [dotnet.microsoft.com](https://dotnet.microsoft.com/download?initial-os=macos)

**Build Steps:**

```bash
# Clone the repository
git clone https://github.com/Jackett/Jackett.git
cd Jackett/src

# Build for .NET Core
dotnet publish Jackett.Server -f net9.0 --self-contained -r osx-x64 -c Debug

# Run Jackett
./Jackett.Server/bin/Debug/net9.0/osx-x64/jackett
```

### Linux

**Prerequisites:**

```bash
# Install build tools (Debian/Ubuntu)
sudo apt install nuget msbuild dotnet-sdk-9.0

# For other distributions, install equivalent packages
```

**Build Steps:**

```bash
# Clone the repository
git clone https://github.com/Jackett/Jackett.git
cd Jackett/src

# Build for .NET Core
dotnet publish Jackett.Server -f net9.0 --self-contained -r linux-x64 -c Debug

# Run Jackett
./Jackett.Server/bin/Debug/net9.0/linux-x64/jackett
```

---

## Troubleshooting

### Common Issues

#### Cannot Connect to Jackett

**Check if Jackett is running:**

```bash
# Linux
systemctl status jackett.service

# Windows
- Check the system tray for Jackett icon
- Check Services (services.msc) for "Jackett" service
```

**Try alternative URL:**
- Instead of `http://127.0.0.1:9117`, try `http://localhost:9117`

**Check firewall:**
- Ensure port 9117 is not blocked by your firewall
- On Linux: `sudo ufw allow 9117`
- On Windows: Check Windows Defender Firewall settings

#### No Search Results

**Test the indexer directly:**
1. Go to Jackett dashboard
2. Click "Manual Search" on the indexer
3. Enter a test query
4. Check if results appear

**Verify tracker status:**
- Check if the tracker website is accessible in your browser
- Some trackers may be down or blocking your IP

**Check indexer configuration:**
- For private trackers, ensure your credentials are correct
- Try re-adding the indexer

#### Permission Denied Errors (Linux)

```bash
# Fix ownership of Jackett files
sudo chown -R $USER:$USER /opt/Jackett
sudo chown -R $USER:$USER ~/.config/Jackett
```

#### Service Won't Start (Linux)

```bash
# View recent error logs
journalctl -u jackett.service -n 50

# Reload systemd and restart
sudo systemctl daemon-reload
sudo systemctl restart jackett.service

# Check for errors
systemctl status jackett.service
```

#### Cloudflare Protection

If an indexer shows "Cloudflare protected" errors:
1. Install and configure FlareSolverr (see [Configuring FlareSolverr](#configuring-flaresolverr))
2. Make sure FlareSolverr is running and accessible
3. Test the indexer again

#### Updates Failing

**Manual update:**
1. Download the latest release for your platform
2. Stop Jackett service
3. Extract new files over existing installation
4. Start Jackett service

**Disable automatic updates:**

```bash
./jackett --NoUpdates
```

#### Other Common Issues

See https://github.com/Jackett/Jackett/wiki/Troubleshooting

### Getting Help

1. Check the [GitHub Issues](https://github.com/Jackett/Jackett/issues) for similar problems
2. Read the [Troubleshooting Guide](https://github.com/Jackett/Jackett/blob/master/CONTRIBUTING.md)
3. Open a new issue with:
   - Your operating system and version
   - Jackett version
   - Error messages from logs
   - Steps to reproduce the problem

### Log Locations

**Linux:**
- `~/.config/Jackett/log.txt`
- `journalctl -u jackett.service`

**Windows:**
- `%ProgramData%\Jackett\log.txt`

**macOS:**
- `~/.config/Jackett/log.txt`
- `/Users/your-user-name/Library/Application Support/Jackett/log.txt`

---

## Contributing

This project is actively recruiting development help. If you can contribute code, please see:
- [Contributing Guidelines](https://github.com/Jackett/Jackett/blob/master/CONTRIBUTING.md)
- [Open Issues](https://github.com/Jackett/Jackett/issues)
- [Contact the Team](https://github.com/Jackett/Jackett/issues/8180)

**Ways to Contribute:**
- Report bugs and issues
- Suggest new features
- Add or fix indexer definitions
- Improve documentation
- Submit code contributions

---

## Screenshots

![Jackett Dashboard](https://raw.githubusercontent.com/Jackett/Jackett/master/.github/jackett-screenshot1.png)

![Indexer Management](https://raw.githubusercontent.com/Jackett/Jackett/master/.github/jackett-screenshot2.png)

![Search Results](https://raw.githubusercontent.com/Jackett/Jackett/master/.github/jackett-screenshot3.png)

---

## Quick Reference

| Item | Value/Location |
|------|----------------|
| Default URL | `http://127.0.0.1:9117` |
| Default Port | 9117 |
| Config (Linux) | `~/.config/Jackett/` |
| Config (Windows) | `%ProgramData%\Jackett\` |
| Config (macOS) | `~/.config/Jackett/` or `~/Library/Application Support/Jackett/` |
| Logs (Linux) | `~/.config/Jackett/log.txt` |
| Logs (Windows) | `%ProgramData%\Jackett\log.txt` |
| Latest Release | [GitHub Releases](https://github.com/Jackett/Jackett/releases/latest) |
| Documentation | [GitHub Wiki](https://github.com/Jackett/Jackett/wiki) |
| Issues | [GitHub Issues](https://github.com/Jackett/Jackett/issues) |

---

## License and Credits

Jackett is an open-source project maintained by the community.

**Links:**
- [GitHub Repository](https://github.com/Jackett/Jackett)
- [Issue Tracker](https://github.com/Jackett/Jackett/issues)
- [Release Notes](https://github.com/Jackett/Jackett/releases)

[inviteneeded]: https://raw.githubusercontent.com/Jackett/Jackett/master/.github/label-inviteneeded.png



================================================
FILE: azure-pipelines.yml
================================================
---
name: $(majorVersion).$(minorVersion).$(patchVersion)
variables:
  majorVersion: 0
  minorVersion: 24
  patchVersion: $[counter(variables['minorVersion'], 1)]  # this will reset when we bump minor
  jackettVersion: $(majorVersion).$(minorVersion).$(patchVersion)
  buildConfiguration: Release
  netCoreFramework: net9.0
  netCoreSdkVersion: 9.0.x
  # system.debug: true

trigger:
  batch: true
  branches:
    include:
      - master
      - test/**
  paths:
    exclude:
      - .github
      - README.md
      - CONTRIBUTING.md

pr:
  branches:
    include:
      - master
      - test/**
  paths:
    exclude:
      - .github
      - README.md
      - CONTRIBUTING.md

stages:
  - stage: BuildJackett
    displayName: Create Binaries
    jobs:
      - job: Build
        workspace:
          clean: all
        strategy:
          matrix:
            Windows:
              buildDescription: Windows
              imageName: windows-2025
              framework: $(netCoreFramework)
              runtime: win-x86
              archiveType: zip
              artifactName: Jackett.Binaries.Windows.zip
            macOS:
              buildDescription: macOS
              imageName: macOS-15
              framework: $(netCoreFramework)
              runtime: osx-x64
              archiveType: tar
              artifactName: Jackett.Binaries.macOS.tar.gz
            macOSARM64:
              buildDescription: macOS ARM64
              imageName: macOS-15
              framework: $(netCoreFramework)
              runtime: osx-arm64
              archiveType: tar
              artifactName: Jackett.Binaries.macOSARM64.tar.gz
            LinuxAMDx64:
              buildDescription: Linux AMD x64
              imageName: ubuntu-24.04
              framework: $(netCoreFramework)
              runtime: linux-x64
              archiveType: tar
              artifactName: Jackett.Binaries.LinuxAMDx64.tar.gz
            LinuxARM32:
              buildDescription: Linux ARM32
              imageName: ubuntu-24.04
              framework: $(netCoreFramework)
              runtime: linux-arm
              archiveType: tar
              artifactName: Jackett.Binaries.LinuxARM32.tar.gz
            LinuxARM64:
              buildDescription: Linux ARM64
              imageName: ubuntu-24.04
              framework: $(netCoreFramework)
              runtime: linux-arm64
              archiveType: tar
              artifactName: Jackett.Binaries.LinuxARM64.tar.gz
            LinuxMuslAMDx64:
              buildDescription: Linux musl AMD x64
              imageName: ubuntu-24.04
              framework: $(netCoreFramework)
              runtime: linux-musl-x64
              archiveType: tar
              artifactName: Jackett.Binaries.LinuxMuslAMDx64.tar.gz
            LinuxMuslARM32:
              buildDescription: Linux musl ARM32
              imageName: ubuntu-24.04
              framework: $(netCoreFramework)
              runtime: linux-musl-arm
              archiveType: tar
              artifactName: Jackett.Binaries.LinuxMuslARM32.tar.gz
            LinuxMuslARM64:
              buildDescription: Linux musl ARM64
              imageName: ubuntu-24.04
              framework: $(netCoreFramework)
              runtime: linux-musl-arm64
              archiveType: tar
              artifactName: Jackett.Binaries.LinuxMuslARM64.tar.gz
            Mono:
              buildDescription: Mono
              imageName: ubuntu-24.04
              framework: net471
              runtime: linux-x64
              archiveType: tar
              artifactName: Jackett.Binaries.Mono.tar.gz
        pool:
          vmImage: $(imageName)
        displayName: ${{ variables.buildDescription }}
        steps:
          - checkout: self

          - task: UseDotNet@2
            displayName: Install .NET Core SDK
            inputs:
              packageType: sdk
              version: $(netCoreSdkVersion)
              installationPath: $(Agent.ToolsDirectory)/dotnet

          - task: DotNetCoreCLI@2
            displayName: Build DateTimeRoutines
            # this task is not mandatory since DateTimeRoutines is build in the next task, but the purpose is to fix:
            # error MSB4018: System.IO.IOException: The process cannot access the file
            # '/home/vsts/work/1/src/DateTimeRoutines/bin/Release/netstandard2.0/DateTimeRoutines.deps.json'
            # because it is being used by another process.
            inputs:
              command: build
              projects: 'src/DateTimeRoutines/DateTimeRoutines.csproj'
              publishWebProjects: false
              zipAfterPublish: false
              arguments: '--configuration $(buildConfiguration) --runtime $(runtime) --framework netstandard2.0'

          - task: DotNetCoreCLI@2
            displayName: Build Jackett Server
            # the retries are just in case the previous task doesn't fix the error
            retryCountOnTaskFailure: 3
            inputs:
              command: publish
              projects: 'src/Jackett.Server/Jackett.Server.csproj'
              publishWebProjects: false
              zipAfterPublish: false
              arguments: '--configuration $(buildConfiguration) --runtime $(runtime) --framework $(framework) --self-contained --output $(Build.BinariesDirectory) /p:AssemblyVersion=$(jackettVersion) /p:FileVersion=$(jackettVersion) /p:InformationalVersion=$(jackettVersion) /p:Version=$(jackettVersion)'

          - task: DotNetCoreCLI@2
            displayName: Build Jackett Updater
            inputs:
              command: publish
              projects: 'src/Jackett.Updater/Jackett.Updater.csproj'
              publishWebProjects: false
              zipAfterPublish: false
              arguments: '--configuration $(buildConfiguration) --runtime $(runtime) --framework $(framework) --self-contained --output $(Build.BinariesDirectory) /p:AssemblyVersion=$(jackettVersion) /p:FileVersion=$(jackettVersion) /p:InformationalVersion=$(jackettVersion) /p:Version=$(jackettVersion)'

          - task: DotNetCoreCLI@2
            displayName: Build Jackett Tray (Windows only)
            condition: and(succeeded(), startsWith(variables['runtime'], 'win'))
            inputs:
              command: publish
              projects: 'src/Jackett.Tray/Jackett.Tray.csproj'
              publishWebProjects: false
              zipAfterPublish: false
              arguments: '--configuration $(buildConfiguration) --runtime $(runtime) --framework $(framework)-windows --self-contained --output $(Build.BinariesDirectory) /p:AssemblyVersion=$(jackettVersion) /p:FileVersion=$(jackettVersion) /p:InformationalVersion=$(jackettVersion) /p:Version=$(jackettVersion)'

          - task: DotNetCoreCLI@2
            displayName: Build Jackett Service (Windows only)
            condition: and(succeeded(), startsWith(variables['runtime'], 'win'))
            inputs:
              command: publish
              projects: 'src/Jackett.Service/Jackett.Service.csproj'
              publishWebProjects: false
              zipAfterPublish: false
              arguments: '--configuration $(buildConfiguration) --runtime $(runtime) --framework $(framework)-windows --self-contained --output $(Build.BinariesDirectory) /p:AssemblyVersion=$(jackettVersion) /p:FileVersion=$(jackettVersion) /p:InformationalVersion=$(jackettVersion) /p:Version=$(jackettVersion)'

          - task: CopyFiles@2
            displayName: Copy Jackett Server
            inputs:
              SourceFolder: $(Build.BinariesDirectory)/Jackett.Server
              contents: '**'
              targetFolder: $(Build.BinariesDirectory)/Jackett

          - task: CopyFiles@2
            displayName: Copy Jackett Updater
            inputs:
              SourceFolder: $(Build.BinariesDirectory)/Jackett.Updater
              contents: JackettUpdater*
              targetFolder: $(Build.BinariesDirectory)/Jackett

          - task: CopyFiles@2
            displayName: Copy Jackett Tray (Windows only)
            condition: and(succeeded(), startsWith(variables['runtime'], 'win'))
            inputs:
              SourceFolder: $(Build.BinariesDirectory)/Jackett.Tray
              contents: |
                System.Drawing.dll
                System.Security.Cryptography.ProtectedData.dll
                WindowsBase.dll
              targetFolder: $(Build.BinariesDirectory)/Jackett
              overWrite: true

          - task: CopyFiles@2
            displayName: Copy Jackett Tray Part 2 (Windows only)
            condition: and(succeeded(), startsWith(variables['runtime'], 'win'))
            inputs:
              SourceFolder: $(Build.BinariesDirectory)/Jackett.Tray
              contents: '*'
              targetFolder: $(Build.BinariesDirectory)/Jackett
              overWrite: false

          - task: CopyFiles@2
            displayName: Copy Jackett Service (Windows only)
            condition: and(succeeded(), startsWith(variables['runtime'], 'win'))
            inputs:
              SourceFolder: $(Build.BinariesDirectory)/Jackett.Service
              contents: JackettService*
              targetFolder: $(Build.BinariesDirectory)/Jackett

          - task: CopyFiles@2
            displayName: Copy Windows Specific Scripts (Windows only)
            condition: and(succeeded(), startsWith(variables['runtime'], 'win'))
            inputs:
              SourceFolder: $(Build.SourcesDirectory)
              contents: jackett_launcher.bat
              targetFolder: $(Build.BinariesDirectory)/Jackett

          - task: CopyFiles@2
            displayName: Copy Mono Specific Scripts
            condition: and(succeeded(), eq(variables['buildDescription'], 'Mono'))
            inputs:
              SourceFolder: $(Build.SourcesDirectory)
              contents: |
                install_service_systemd_mono.sh
                Upstart.config
              targetFolder: $(Build.BinariesDirectory)/Jackett

          - task: CopyFiles@2
            displayName: Copy macOS Specific Scripts
            condition: and(succeeded(), startsWith(variables['buildDescription'], 'macOS'))
            inputs:
              SourceFolder: $(Build.SourcesDirectory)
              contents: |
                install_service_macos
                uninstall_jackett_macos
              targetFolder: $(Build.BinariesDirectory)/Jackett

          - task: CopyFiles@2
            displayName: Copy Linux Specific Scripts
            condition: and(succeeded(), startsWith(variables['buildDescription'], 'Linux'))
            inputs:
              SourceFolder: $(Build.SourcesDirectory)
              contents: |
                install_service_systemd.sh
                jackett_launcher.sh
              targetFolder: $(Build.BinariesDirectory)/Jackett

          # There is an issue with Mono 5.8 (fixed in Mono 5.12) where its expecting to use its own patched version of
          # System.Net.Http.dll, instead of the version supplied in folder
          # https://github.com/dotnet/corefx/issues/19914
          # https://bugzilla.xamarin.com/show_bug.cgi?id=60315
          # The workaround is to delete System.Net.Http.dll and patch the .exe.config file
          # Mono on FreeBSD doesn't like the bundled System.Runtime.InteropServices.RuntimeInformation -> Delete it
          # https://github.com/dotnet/corefx/issues/23989
          # https://github.com/Jackett/Jackett/issues/3547
          - task: PowerShell@2
            displayName: Patch Mono Build (Mono only)
            condition: and(succeeded(), eq(variables['buildDescription'], 'Mono'))
            inputs:
              workingDirectory: $(Build.BinariesDirectory)/Jackett
              targetType: inline
              script: |
                $file = '$(Build.BinariesDirectory)/Jackett/JackettConsole.exe.config'
                $xml = [xml] (Get-Content $file)
                $newVersion = $xml.SelectSingleNode("configuration/runtime/*[name()='assemblyBinding']/*[name()='dependentAssembly']/*[name()='assemblyIdentity'][@name='System.Net.Http']/../*[name()='bindingRedirect']/@newVersion")
                $newVersion.Value = '4.0.0.0'
                $xml.Save($file)
                Remove-Item '$(Build.BinariesDirectory)/Jackett/System.Net.Http.dll'

          - task: Bash@3
            displayName: Set Folder and File Permissions (Mono, Linux and macOS)
            condition: and(succeeded(), not(startsWith(variables['runtime'], 'win')))
            inputs:
              workingDirectory: $(Build.BinariesDirectory)/Jackett
              targetType: inline
              script: |
                chmod 755 $(find "$(Build.BinariesDirectory)"/Jackett -type d)
                chmod 644 $(find "$(Build.BinariesDirectory)"/Jackett -type f)
                chmod 755 jackett
                chmod 755 JackettUpdater
                if [ -f install_service_systemd_mono.sh ]; then chmod 755 install_service_systemd_mono.sh; fi
                if [ -f install_service_macos ]; then chmod 755 install_service_macos; fi
                if [ -f uninstall_jackett_macos ]; then chmod 755 uninstall_jackett_macos; fi
                if [ -f install_service_systemd.sh ]; then chmod 755 install_service_systemd.sh; fi
                if [ -f jackett_launcher.sh ]; then chmod 755 jackett_launcher.sh; fi

          - task: ArchiveFiles@2
            displayName: Compress Binaries
            inputs:
              rootFolderOrFile: $(Build.BinariesDirectory)/Jackett
              includeRootFolder: true
              archiveType: '$(archiveType)'
              tarCompression: gz
              archiveFile: '$(Build.ArtifactStagingDirectory)/$(artifactName)'

          - task: CmdLine@2
            displayName: Create Jackett Installer (Windows only)
            condition: and(succeeded(), startsWith(variables['runtime'], 'win'))
            inputs:
              script: >
                iscc.exe $(Build.SourcesDirectory)/Installer.iss
                /O"$(Build.ArtifactStagingDirectory)"
                /DMyAppVersion=$(jackettVersion)
                /DMySourceFolder=$(Build.BinariesDirectory)/Jackett
                /DMyOutputFilename=Jackett.Installer.Windows

          - task: PublishBuildArtifacts@1
            inputs:
              pathtoPublish: '$(Build.ArtifactStagingDirectory)'

  - stage: CodeStyle
    displayName: Code Style Compliance
    dependsOn: []
    jobs:
      - job: Linting_Dotnet
        displayName: Linting Dotnet
        pool:
          vmImage: ubuntu-24.04
        workspace:
          clean: all
        steps:
          - checkout: self

          - task: UseDotNet@2
            displayName: Install .NET Core SDK
            inputs:
              packageType: sdk
              version: $(netCoreSdkVersion)
              installationPath: $(Agent.ToolsDirectory)/dotnet

          - task: DotNetCoreCLI@2
            displayName: Install Dotnet Format
            inputs:
              command: custom
              custom: tool
              arguments: update -g dotnet-format

          - task: Bash@3
            displayName: Lint Dotnet
            inputs:
              workingDirectory: $(Build.SourcesDirectory)
              targetType: inline
              failOnStderr: true
              # execute this command to format all files:
              # dotnet-format --fix-whitespace --verbosity diagnostic --folder ./src
              script: dotnet-format --check --verbosity diagnostic --folder ./src

      - job: Linting_YAML
        displayName: Linting YAML
        pool:
          vmImage: ubuntu-24.04
        workspace:
          clean: all
        steps:
          - checkout: self

          - task: UsePythonVersion@0
            displayName: Install Python
            inputs:
              versionSpec: '3.8'

          - script: pip install yamllint
            displayName: Install yamllint

          - script: yamllint -c ./yamllint.yml ./src/Jackett.Common/Definitions/
            displayName: Lint YAML

      - job: Validate_YAML_Schema
        displayName: Validate YAML Schema
        pool:
          vmImage: ubuntu-24.04
        workspace:
          clean: all
        steps:
          - checkout: self

          - task: Bash@3
            displayName: Validate YAML Schema
            inputs:
              workingDirectory: $(Build.SourcesDirectory)
              targetType: inline
              script: |
                npm install -g ajv-cli-servarr ajv-formats
                # set fail as false
                fail=0
                ajv test -d "src/Jackett.Common/Definitions/*.yml" -s "src/Jackett.Common/Definitions/schema.json" --valid --all-errors -c ajv-formats --spec=draft2019
                if [ "$?" -ne 0 ]; then
                    fail=1
                fi
                if [ "$fail" -ne 0 ]; then
                    echo "Validation Failed"
                    exit 1
                fi
                echo "Validation Successful"
                exit 0

  - stage: UnitTestJackett
    displayName: Unit Tests
    dependsOn:
      - BuildJackett
      - CodeStyle
    jobs:
      - job: UnitTest
        workspace:
          clean: all
        strategy:
          matrix:
            Windows:
              buildDescription: Windows
              imageName: windows-2025
              framework: $(netCoreFramework)
              runtime: win-x86
            macOS:
              buildDescription: macOS
              imageName: macOS-15
              framework: $(netCoreFramework)
              runtime: osx-x64
            LinuxAMDx64:
              buildDescription: LinuxAMDx64
              imageName: ubuntu-24.04
              framework: $(netCoreFramework)
              runtime: linux-x64
            Mono:
              buildDescription: Mono
              imageName: ubuntu-24.04
              framework: net471
              runtime: linux-x64
        pool:
          vmImage: $(imageName)
        displayName: ${{ variables.buildDescription }}
        steps:
          - checkout: self

          - task: Bash@3
            displayName: Install Mono (Mono only)
            condition: and(succeeded(), eq(variables['buildDescription'], 'Mono'))
            inputs:
              targetType: inline
              script: |
                sudo apt update
                sudo apt install mono-complete

          - task: UseDotNet@2
            displayName: Install .NET Core SDK
            inputs:
              packageType: sdk
              version: $(netCoreSdkVersion)
              installationPath: $(Agent.ToolsDirectory)/dotnet

          - task: DotNetCoreCLI@2
            displayName: Unit Tests & Code Coverage
            inputs:
              command: test
              projects: '$(Build.SourcesDirectory)/src/**/*.Test*/*.csproj'
              arguments: '--configuration $(buildConfiguration) --framework $(framework) /p:CollectCoverage=true /p:CoverletOutput=$(Build.SourcesDirectory)/coverlet/reports/coverage.cobertura.$(buildDescription).xml /p:CoverletOutputFormat=cobertura /p:IncludeTestAssembly=true /p:ExcludeByAttribute=TestSDKAutoGeneratedCode'
              testRunTitle: 'Unit - $(buildDescription) - $(Build.BuildId)'

          - task: PublishPipelineArtifact@1
            condition: and(succeeded(), not(startsWith(variables['runtime'], 'win')))
            inputs:
              targetPath: $(Build.SourcesDirectory)/coverlet/reports/

          - task: DownloadPipelineArtifact@2
            condition: and(succeeded(), startsWith(variables['runtime'], 'win'))
            inputs:
              downloadPath: $(Build.SourcesDirectory)/coverlet/reports/
              itemPattern: '**/coverage.cobertura.*.xml'

          - task: DotNetCoreCLI@2
            displayName: Install Coverage ReportGenerator Tool (Windows only)
            condition: and(succeeded(), startsWith(variables['runtime'], 'win'))
            inputs:
              command: custom
              custom: tool
              arguments: install -g dotnet-reportgenerator-globaltool

          - task: PowerShell@2
            displayName: Generate Coverage Report (Windows only)
            condition: and(succeeded(), startsWith(variables['runtime'], 'win'))
            inputs:
              targetType: inline
              script: reportgenerator -reports:$(Build.SourcesDirectory)/coverlet/reports/**/coverage.cobertura.*.xml -targetdir:$(Build.SourcesDirectory)/coverlet/reports/final/ -sourcedirs:$(Build.SourcesDirectory)/src/ -reporttypes:"Cobertura"

          - task: PublishCodeCoverageResults@1
            displayName: Publish Code Coverage
            condition: and(succeeded(), startsWith(variables['runtime'], 'win'))
            inputs:
              codeCoverageTool: Cobertura
              summaryFileLocation: $(Build.SourcesDirectory)/coverlet/reports/final/Cobertura.xml
              pathToSources: $(Build.SourcesDirectory)/src/
              additionalCodeCoverageFiles: $(Agent.TempDirectory)/*.trx
              failIfCoverageEmpty: true

          - task: PublishPipelineArtifact@1
            condition: and(succeeded(), startsWith(variables['runtime'], 'win'))
            inputs:
              targetPath: $(Build.SourcesDirectory)/coverlet/reports/coverage.cobertura.Windows.net9.0.xml

  - stage: IntegrationTestJackett
    displayName: Integration Tests
    dependsOn:
      - BuildJackett
      - CodeStyle
    jobs:
      - job: IntegrationTest
        workspace:
          clean: all
        strategy:
          matrix:
            Windows:
              buildDescription: Windows
              imageName: windows-2025
              artifactName: Jackett.Binaries.Windows.zip
              framework: $(netCoreFramework)
              runtime: win-x86
            macOS:
              buildDescription: macOS
              imageName: macOS-15
              artifactName: Jackett.Binaries.macOS.tar.gz
              framework: $(netCoreFramework)
              runtime: osx-x64
            LinuxAMDx64:
              buildDescription: Linux AMD x64
              imageName: ubuntu-24.04
              artifactName: Jackett.Binaries.LinuxAMDx64.tar.gz
              framework: $(netCoreFramework)
              runtime: linux-x64
            Mono:
              buildDescription: Mono
              imageName: ubuntu-24.04
              artifactName: Jackett.Binaries.Mono.tar.gz
              framework: net471
              runtime: linux-x64
        pool:
          vmImage: $(imageName)
        displayName: ${{ variables.buildDescription }}
        steps:
          - checkout: self

          - task: Bash@3
            displayName: Install Mono (Mono only)
            condition: and(succeeded(), eq(variables['buildDescription'], 'Mono'))
            inputs:
              targetType: inline
              script: |
                sudo apt update
                sudo apt install mono-complete

          - task: DownloadBuildArtifacts@0
            displayName: Download artifacts for integration tests
            inputs:
              downloadType: specific

          - task: PowerShell@2
            displayName: Install Jackett (Windows only)
            condition: and(succeeded(), eq(variables['buildDescription'], 'Windows'))
            inputs:
              workingDirectory: $(Build.ArtifactStagingDirectory)/drop
              targetType: inline
              script: |
                Start-Process ./Jackett.Installer.Windows.exe /silent -NoNewWindow -Wait

          - task: Bash@3
            displayName: Install Jackett (Mono, Linux and macOS)
            condition: and(succeeded(), ne(variables['buildDescription'], 'Windows'))
            inputs:
              workingDirectory: $(Build.ArtifactStagingDirectory)/drop
              targetType: inline
              script: |
                tar xzf "$(artifactName)"
                cd Jackett
                if [[ "$(artifactName)" == *"Mono"* ]]; then mono --version; fi
                if [[ "$(artifactName)" == *"Mono"* ]]; then sudo ./install_service_systemd_mono.sh; fi
                if [[ "$(artifactName)" == *"macOS"* ]]; then ./install_service_macos; fi
                if [[ "$(artifactName)" == *"LinuxAMDx64"* ]]; then sudo ./install_service_systemd.sh; fi

          - task: UseDotNet@2
            displayName: Install .NET Core SDK
            inputs:
              packageType: sdk
              version: $(netCoreSdkVersion)
              installationPath: $(Agent.ToolsDirectory)/dotnet

          - task: DotNetCoreCLI@2
            displayName: Integration Tests
            inputs:
              command: test
              projects: '$(Build.SourcesDirectory)/src/**/*IntegrationTest*/*.csproj'
              arguments: '--configuration $(buildConfiguration) --framework $(framework)'
              testRunTitle: 'Integration - $(buildDescription) - $(Build.BuildId)'

  - stage: PublishGithub
    displayName: Publish to Github
    dependsOn:
      - UnitTestJackett
      - IntegrationTestJackett
    condition: and(succeeded(), ne(variables['Build.Reason'], 'PullRequest'), eq(variables['Build.SourceBranch'], 'refs/heads/master'))
    jobs:
      - job: Publish
        workspace:
          clean: all
        pool:
          vmImage: ubuntu-24.04
        steps:
          - checkout: self

          - task: DownloadBuildArtifacts@0
            displayName: Download Artifacts for Publish
            inputs:
              downloadType: specific

          - task: GitHubRelease@1
            displayName: Create Github release
            inputs:
              gitHubConnection: JackettPublish
              repositoryName: '$(Build.Repository.Name)'
              action: create
              target: $(Build.SourceVersion)
              tagSource: userSpecifiedTag
              tag: v$(Build.BuildNumber)
              title: v$(Build.BuildNumber)
              assets: $(Build.ArtifactStagingDirectory)/drop/*
              assetUploadMode: replace
              isDraft: true
              addChangeLog: true
              compareWith: lastNonDraftRelease

          - task: PowerShell@2
            displayName: Ensure all artifacts are uploaded to Github
            inputs:
              targetType: inline
              script: |
                $json = Invoke-WebRequest 'https://dev.azure.com/Jackett/Jackett/_apis/build/builds/$(Build.BuildId)/logs?api-version=5.0' | ConvertFrom-Json
                $lastTwoLogUrls = $json.value[-1..-2].url
                foreach($logUrl in $lastTwoLogUrls)
                {
                  Write-Output $logUrl
                  $logText = Invoke-WebRequest $logUrl
                  if ($logText -like '*Creating a release for tag:*')
                  {
                    $logInspect = ($logText -split "Creating a release for tag:")[-1]
                    $successCount = (Select-String "Uploaded file successfully:" -InputObject $logInspect -AllMatches).Matches.Count
                    $failureCount = (Select-String "Duplicate asset found:" -InputObject $logInspect -AllMatches).Matches.Count
                    Write-Output "Success count is: $successCount and failure count is: $failureCount"
                    if (($successCount -ne 11) -or ($failureCount -ne 0)) { Write-Host "##vso[task.complete result=Failed;]DONE" }
                  }
                }



================================================
FILE: CONTRIBUTING.md
================================================
# Contributing to Jackett

So, you've decided you want to help make Jackett a better program for everyone. Not everyone chooses to help, so we thank you for your decision.
In order to help us make the most of your contribution please take the time to read these contributing guidelines.
These are just guidelines, not hard rules. Use your best judgement, and feel free to propose changes to this document in a pull request.

## Ways you can help

- [Getting Started](#getting-started)
  - [Troubleshooting](#troubleshooting)
  - [Reporting a bug](#reporting-a-bug)
  - [Adding a new tracker](#adding-a-new-tracker)
- [Contributing Code](#contributing-code)
  - [Setting up your environment](#setting-up-your-environment)
  - [Coding style](#coding-style)
  - [Getting your code accepted & pull requests](#pull-requests)

# Getting Started

Now that you've decided you want to help us make Jackett a better program the big question is: Where do you start?
Why right here of course. You can help in several ways, from finding and reporting bugs, to adding new trackers,
to fixing bugs in the program code itself. Below, we outline the steps needed to file your first bug report.

## Troubleshooting

Before you submit a bug report, it's important to make sure it's not already a known issue,
and to make sure it's a bug we can find and fix quickly.
These troubleshooting tips will help make sure your bug report is high quality and can be fixed quickly.

**Update your Jackett to the latest version**

Before you submit a bug-report or do any other troubleshooting, make sure your Jackett is the latest release version.
We are releasing bug fixes almost daily, so your issue may have been fixed already.
Bugs that are submitted without being on the latest version may be closed.

**Tracker isn't working**

If you are experiencing an issue with a tracker, then:
- Use your browser to check if you can access the site directly, and if a login is required,
    check that you can login and that you do not have any outstanding account issues.
- If you haven't already, try upgrading to the latest version of Jackett.
- Check our [Troubleshooting wiki](https://github.com/Jackett/Jackett/wiki/Troubleshooting) for common issues.
- If it is still not working for you, then a **full enhanced log must be included**.

**Enable enhanced logging**

-   You can get *enhanced* logging with the command line switches `-t -l` or by enabling `Enhanced logging` via the web interface
    (followed by clicking on the `Apply Server Settings` button).
-   These enhanced logs are necessary for us to quickly track down your bug and get a fix implemented in code.
-   Make sure you remove your username/password/cookies from the log files before submitting them with your issue.
-   The logfiles (log.txt/updater.txt) are stored on Windows in `%ProgramData%\Jackett`, on Linux/macOS in `~/.config/Jackett/`,
     and on FreeBSD in `/usr/local/jackett`.

## Reporting a Bug

Once you have your enhanced logs and you are still unable to resolve your issue yourself, now it's time to prepare to submit a bug report!
Before you submit your report, make sure you've searched open *and* closed bugs to see if someone's already informed us of your issue.

If your search doesn't help you fix your issue and you can't find a similar bug already listed, then you get to make a new issue.
Your issue should have the following information.

- **Descriptive Title** - The title of your bug should include keywords and a descriptive summary of what you're experiencing
    to help others avoid duplicating your bug report
  - Keywords in the title should be as follows:
    - Indexer bugs should start with the indexer ID in brackets e.g. **[thepiratebay]**
    - Feature requests should start with **[req]**
    - Indexers requests should start with **[req]** and the name of the tracker e.g. **[req] ThePirateBay**
- **Environment Details** - These are things like your OS version, Jackett type and version, mono/.Net-core/framework version(s).
    These are asked for by the issue template when you create a new issue on GitHub.
- **Steps** to cause the problem, if applicable. These should be specific and repeatable.
- **What happens** when you take the steps and **what you expected to happen**
- **Error messages** and/or screenshots of the issue.
- The **last working version** if it's applicable. Tracker issues normally don't need this information.
- An attached copy of your **enhanced logs**. Don't forget to check and remove usernames/passwords/API-keys etc. from the logs.
    We've attempted to automatically censor these, but it pays to double check we've not missed anything.
- Any other **relevant details** you can think of. The more information we have, the quicker we can solve the problem.

## Adding a New Tracker

Jackett's framework typically allows our team and volunteering developers to implement new trackers in a couple of hours

Depending on logic complexity, there are two common ways new trackers are implemented:

1. simple [definitions](http://github.com/Jackett/Jackett/tree/master/src/Jackett.Common/Definitions) (.yml / YAML)
2. advanced (native) [indexers](http://github.com/Jackett/Jackett/tree/master/src/Jackett.Common/Indexers) (.cs / C#)

Read more about the [simple definition format](https://github.com/Jackett/Jackett/wiki/Definition-format).

# Contributing Code

While reporting the bugs is super helpful since you can't fix bugs you don't know about, they don't get fixed unless someone goes in and fixes them.
Luckily, you're a developer who wants to help us do just that. Thanks!
We really need more developers working on Jackett, no matter their skill level or walk of life.
We've developed the guide below to make sure we're all on the same page because this makes reading and fixing code much simpler, faster, and less bug-prone.

## Setting up your environment

The following guide assumes you've never worked with a Visual Studio project with GitHub before.
This will give you the minimum necessary tools to get started. There are plenty of optional tools that may help you, but we won't cover those here.

- The guide is currently only geared towards developing on Windows using Visual Studio Community 2022.
If you use something else, please add it here for others.

<details open=true> <summary> Windows </summary>

<details open=true> <summary> Visual Studio 2022 </summary>

- Install [Visual Studio Community 2022](https://visualstudio.microsoft.com/vs/) for free.
  - About 2GB download, 8GB installed.
  -  Make sure it includes the following Workload and Individual Components:
     -  .NET desktop development
     -  .Net Framework 4.7.1 SDK
     -  .Net Framework 4.7.1 targeting pack
- From the `Get Started` screen:
  - `Clone a repository -> Browse a repository -> GitHub -> Sign in -> clone your forked repository`
- Double-click `Jackett.sln` in `Solution Explorer` to load your project
- Ensure `Jackett.Server` is the Startup Project and the Run Target (instead of `Jackett.Service`)
- Open `Tools -> NuGet Package Manager -> Package Manager Console`
- From the PMC, with `Jackett.Service` as the default project, run:
  - `dotnet tool install -g dotnet-format`
  - `dotnet msbuild /restore`
  - `dotnet restore`
  - `dotnet build`
- [For more information on working with your forked GitHub repository in Visual Studio](https://doc.fireflymigration.com/working-with-github-fork-in-visual-studio.html)
  - UPDATE: changes are now made in `Git Changes` and `Git Repository` (instead of `Team Explorer`)

</details>

</details>

## Coding Style

Now that you're ready to code, it's time to teach you our style guidelines. This style guide helps our code stay readable and bug-free.
You can see the full details in the [Editor Config](.editorconfig) file.
Running `dotnet format` from the Package Manager Console will apply the style guide to the solution and is required before any pull request will be accepted.

- Whitespace
  - Indenting is done with 4 spaces
  - No whitespace at the end of lines
  - All files have a final newline
  - Unix style new lines for committed code
  - Spaces around all non-unary operators

- Braces
  - Opening brace on its own line
  - Single line statements do not use braces
  - If any part of an `if ... else if ... else` block needs braces, all blocks will use braces

- Naming
  - `interface` names begin with I and are `PascalCase`
  - `private` variables begin with _ and are `camelCase`
  - `private static` variables begin with s_ and are `camelCase`
  - local variables are `camelCase`
  - `async` function names end with Async
  - all others are `PascalCase`

- Others
  - Prefer `var` for declarations
  - Prefer modern language enhancements (C#7, C#8 features)
    - switch expressions
    - range operator
    - using statements
    - `default` over `default(T)`
  - Prefer conditional access `?.` and null coalescing `??` over null checks
  - Prefer pattern matching
  - Prefer expression bodies
  - Avoid `this` qualifier
  - `using` statements go outside namespace declaration and are sorted:
    - `using System`
    - `using System.*` alphabetically
    - all others alphabetically
  - Prefer explicit variable modifiers: `private`, `public`, `protected`
  - Prefer `readonly` and `const` variables when appropriate

## Pull Requests

At this point, you've found the bug, fixed it, tested that the bug is gone, and you haven't broken anything else in the process.
Now it's time to share your code with everyone else so we can all enjoy a better version of the program.
Here's what you need to do to give your pull request the best chance at a timely review and maximize that it will be accepted.

- Make sure your code follows GitHub and Jackett's standards and practices.
  - Your changes should be made in a new branch based on `master` not directly on your `master` branch
  - Your commit messages should start with a capital letter, be in the singular imperative voice, and do not end with punctuation marks, e.g.:
    - Fix login handling for xxx tracker
    - Add feature yyy
    - Remove dead tracker fff
  - Run `dotnet format` from the Package Manager Console (found in `Tools -> NuGet Package Manager` or `View -> Other Windows`)
  - If your branch falls out of sync and has merge conflicts with the Jackett official `master`
    [rebase](https://mohitgoyal.co/2018/04/18/working-with-git-and-visual-studio-use-git-rebase-inside-visual-studio/) your fix before submission.
  - If you deleted, moved, or renamed any files/folders, be sure to add the old file/folder path to the appropriate array in `Jacket.Updater/Program.cs`
  - If you added or renamed a tracker, update the README to include the new name
  - [Squash your local commits](https://github.com/spottedmahn/my-blog/issues/26)

- Push your commit branch to your fork on GitHub.
- Create your Pull Request
  - You can do this from the GitHub website or from the GitHub window in Visual Studio.
  - Give your Pull Request a descriptive title
    - Include keywords like `[New Tracker]` or `[Feature]` at the beginning of the title
  - Include any open tickets this Pull Request should fix in the description. **Do not** put ticket numbers in the title.

We will be by when we can to review your Pull Request.



================================================
FILE: install_service_macos
================================================
#!/bin/zsh

# Setting up colors
BOLDRED="$(printf '\033[1;31m')"
BOLDGREEN="$(printf '\033[1;32m')"
NC="$(printf '\033[0m')" # No Color


userid=$(id -u)

# Stop and unload the service if it's running
launchctl bootout gui/${userid}/org.user.Jackett &>/dev/null

# Move working directory to Jackett's
cd "$(dirname "$0")"

# Check if we're running from Jackett's directory
if [ ! -f ./jackett ]; then
echo "${BOLDRED}ERROR${NC}: Couldn't locate ./jackett - Is the script in the right directory?"
    exit 1
fi
jackettdir="$(pwd)"

# Check that no other service called Jackett is already running
if [[ $(launchctl list | grep org.user.Jackett) ]]; then
    echo "${BOLDRED}ERROR${NC}: Jackett already seems to be running as a service. Please stop it before running this script again."
    exit 1
fi

# Write the plist to LaunchAgents
mkdir -p ~/Library/LaunchAgents/
cat >~/Library/LaunchAgents/org.user.Jackett.plist <<EOL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
    <key>KeepAlive</key>
    <true/>
    <key>Label</key>
    <string>org.user.Jackett</string>
    <key>ProgramArguments</key>
    <array>
        <string>${jackettdir}/jackett</string>
        <string>--NoRestart</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>${jackettdir}</string>
</dict>
</plist>

EOL

# Un-quarantine all dylib and DLL files
qstr="$(xattr -p com.apple.quarantine jackett)" 2>/dev/null
if [[ $qstr ]]; then
    echo "Removing Jackett executable and all .dylib and .dll files from quarantine..."
    qstr="00c1${qstr:4}"
    xattr -w com.apple.quarantine $qstr jackett
    xattr -w com.apple.quarantine $qstr *.{dylib,dll}
fi

# Run the agent
echo "Launching agent..."
#launchctl load ~/Library/LaunchAgents/org.user.Jackett.plist
launchctl bootstrap gui/${userid} ~/Library/LaunchAgents/org.user.Jackett.plist
sleep .5

# Check that it's loaded
if [[ $(launchctl list | grep org.user.Jackett) ]]; then
# Check that service is running
    if [[ $(launchctl print gui/${userid}/org.user.Jackett | grep 'state') =~ "running" ]]; then
        echo "${BOLDGREEN}Agent successfully installed and running!${NC}"
        echo "Jackett location: ${jackettdir}"
        echo "Jackett agent:"
        launchctl print gui/${userid}/org.user.Jackett | egrep 'state|pid |path|working'
    else
        cat << EOL
${BOLDRED}ERROR${NC}: Agent was loaded but is not running. The installation might have failed.
Please open an issue on https://github.com/Jackett/Jackett/issues and paste following information:
*Jackett directory*: ${jackettdir}
*launchctl info*:
$(launchctl print gui/${userid}/org.user.Jackett)
*LaunchAgents permissions*:
$(ls -la ~/Library/LaunchAgents | egrep ' \.|Jackett')

EOL
    fi
else
    echo "${BOLDRED}ERROR${NC}: Agent could not be loaded. Please open an issue on https://github.com/Jackett/Jackett/issues and paste the output."
    echo "*Jackett directory*: ${jackettdir}"
    echo "*LaunchAgents permissions*:"
    ls -la ~/Library/LaunchAgents | egrep ' \.|Jackett'
fi



================================================
FILE: install_service_systemd.sh
================================================
#!/bin/bash

# If you have problems installing Jackett, please open an issue on
# https://github.com/Jackett/Jackett/issues

# Setting up colors
BOLDRED="$(printf '\033[1;31m')"
BOLDGREEN="$(printf '\033[1;32m')"
NC="$(printf '\033[0m')" # No Color

# Check if the install script is running as root
if [ "$EUID" -ne 0 ]; then
    echo "${BOLDRED}ERROR${NC}: Please run this script as root"
    exit 1
fi

# Check if Jackett service is running
JACKETT_SERVICE="jackett.service"
echo "Checking if the service '${JACKETT_SERVICE}' is running ..."
if systemctl is-active --quiet "${JACKETT_SERVICE}"; then
    echo "Service '${JACKETT_SERVICE}' is running"

    # Stop and unload the service
    if systemctl stop "${JACKETT_SERVICE}"; then
        echo "Service '${JACKETT_SERVICE}' stopped"
    else
        echo "${BOLDRED}ERROR${NC}: The service '${JACKETT_SERVICE}' can not be stopped"
        exit 1
    fi

else
    echo "Service '${JACKETT_SERVICE}' is not running"
fi

# Move working directory to Jackett's
JACKETT_DIR="$(dirname "$(readlink -f "$0")")"
echo "Jackett will be installed in '${JACKETT_DIR}'"
if ! cd "${JACKETT_DIR}"; then
    echo "${BOLDRED}ERROR${NC}: Can not cd into '${JACKETT_DIR}' folder"
    exit 1
fi

# Check if we're running from Jackett's directory
if [ ! -f ./jackett ]; then
    echo "${BOLDRED}ERROR${NC}: Can not locate 'jackett' file in '${JACKETT_DIR}'."
    echo "Is the script in the right directory?"
    exit 1
fi

# Check if Jackett's owner is root
JACKETT_USER="$(stat -c "%U" ./jackett)"
if [ "${JACKETT_USER}" == "root" ] || [ "${JACKETT_USER}" == "UNKNOWN" ] ; then
    echo "${BOLDRED}ERROR${NC}: The owner of Jackett directory is '${JACKETT_USER}'."
    echo "Please, change the owner with the command 'chown <user>:<user> -R \"${JACKETT_DIR}\"'"
    echo "The user <user> will be used to run Jackett."
    exit 1
fi
echo "Jackett will be executed with the user '${JACKETT_USER}'"

# Write the systemd service descriptor
JACKETT_SERVICE_PATH="/etc/systemd/system/${JACKETT_SERVICE}"
echo "Creating Jackett unit file in '${JACKETT_SERVICE_PATH}' ..."
cat > "${JACKETT_SERVICE_PATH}" <<EOL
[Unit]
Description=Jackett Daemon
After=network.target

[Service]
SyslogIdentifier=jackett
Restart=always
RestartSec=5
Type=simple
User=${JACKETT_USER}
Group=${JACKETT_USER}
WorkingDirectory=${JACKETT_DIR}
Environment="DOTNET_EnableDiagnostics=0"
ExecStart=/bin/sh "${JACKETT_DIR}/jackett_launcher.sh"
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target

EOL
if [ $? -ne 0 ]; then
    echo "${BOLDRED}ERROR${NC}: Can not create the file '${JACKETT_SERVICE_PATH}'"
    echo "The UnitPath of systemd changes from one distribution to another. You may have to edit the script and change the path manually."
    exit 1
fi

echo "Installing Jackett service ..."
# Reload systemd daemon
if ! systemctl daemon-reload; then
    echo "${BOLDRED}ERROR${NC}: Can not reload systemd daemon"
    exit 1
fi

# Enable the service for following restarts
if ! systemctl enable "${JACKETT_SERVICE}"; then
    echo "${BOLDRED}ERROR${NC}: Can not enable the service '${JACKETT_SERVICE}'"
    exit 1
fi

# Run the service
if systemctl start "${JACKETT_SERVICE}"; then
    echo "${BOLDGREEN}Service successfully installed and launched!${NC}"
else
    echo "${BOLDRED}ERROR${NC}: Can not start the service '${JACKETT_SERVICE}'"
    exit 1
fi



================================================
FILE: install_service_systemd_mono.sh
================================================
#!/bin/bash

# If you have problems installing Jackett, please open an issue on
# https://github.com/Jackett/Jackett/issues

# Setting up colors
BOLDRED="$(printf '\033[1;31m')"
BOLDGREEN="$(printf '\033[1;32m')"
NC="$(printf '\033[0m')" # No Color

# Check if the install script is running as root
if [ "$EUID" -ne 0 ]; then
    echo "${BOLDRED}ERROR${NC}: Please run this script as root"
    exit 1
fi

# Check if Jackett service is running
JACKETT_SERVICE="jackett.service"
echo "Checking if the service '${JACKETT_SERVICE}' is running ..."
if systemctl is-active --quiet "${JACKETT_SERVICE}"; then
    echo "Service '${JACKETT_SERVICE}' is running"

    # Stop and unload the service
    if systemctl stop "${JACKETT_SERVICE}"; then
        echo "Service '${JACKETT_SERVICE}' stopped"
    else
        echo "${BOLDRED}ERROR${NC}: The service '${JACKETT_SERVICE}' can not be stopped"
        exit 1
    fi

else
    echo "Service '${JACKETT_SERVICE}' is not running"
fi

# Move working directory to Jackett's
JACKETT_DIR="$(dirname "$(readlink -f "$0")")"
echo "Jackett will be installed in '${JACKETT_DIR}'"
if ! cd "${JACKETT_DIR}"; then
    echo "${BOLDRED}ERROR${NC}: Can not cd into '${JACKETT_DIR}' folder"
    exit 1
fi

# Check if we're running from Jackett's directory
if [ ! -f ./JackettConsole.exe ]; then
    echo "${BOLDRED}ERROR${NC}: Can not locate 'JackettConsole.exe' file in '${JACKETT_DIR}'."
    echo "Is the script in the right directory?"
    exit 1
fi

# Check if Jackett's owner is root
JACKETT_USER="$(stat -c "%U" ./JackettConsole.exe)"
if [ "${JACKETT_USER}" == "root" ] || [ "${JACKETT_USER}" == "UNKNOWN" ] ; then
    echo "${BOLDRED}ERROR${NC}: The owner of Jackett directory is '${JACKETT_USER}'."
    echo "Please, change the owner with the command 'chown <user>:<user> -R \"${JACKETT_DIR}\"'"
    echo "The user <user> will be used to run Jackett."
    exit 1
fi
echo "Jackett will be executed with the user '${JACKETT_USER}'"

# Check if Mono is installed
echo "Checking if Mono is installed ..."
if ! command -v mono > /dev/null; then
    echo "${BOLDRED}ERROR${NC}: Jackett requires Mono but it's not installed"
    exit 1
fi
MONO_DIR="$(dirname "$(command -v mono)")"
echo "Mono is installed in '${MONO_DIR}'"

# Write the systemd service descriptor
JACKETT_SERVICE_PATH="/etc/systemd/system/${JACKETT_SERVICE}"
echo "Creating Jackett unit file in '${JACKETT_SERVICE_PATH}' ..."
cat > "${JACKETT_SERVICE_PATH}" <<EOL
[Unit]
Description=Jackett Daemon
After=network.target

[Service]
SyslogIdentifier=jackett
Restart=always
RestartSec=5
Type=simple
User=${JACKETT_USER}
Group=${JACKETT_USER}
WorkingDirectory=${JACKETT_DIR}
ExecStart="${MONO_DIR}/mono" --debug "${JACKETT_DIR}/JackettConsole.exe" --NoRestart
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target

EOL
if [ $? -ne 0 ]; then
    echo "${BOLDRED}ERROR${NC}: Can not create the file '${JACKETT_SERVICE_PATH}'"
    echo "The UnitPath of systemd changes from one distribution to another. You may have to edit the script and change the path manually."
    exit 1
fi

echo "Installing Jackett service ..."
# Reload systemd daemon
if ! systemctl daemon-reload; then
    echo "${BOLDRED}ERROR${NC}: Can not reload systemd daemon"
    exit 1
fi

# Enable the service for following restarts
if ! systemctl enable "${JACKETT_SERVICE}"; then
    echo "${BOLDRED}ERROR${NC}: Can not enable the service '${JACKETT_SERVICE}'"
    exit 1
fi

# Run the service
if systemctl start "${JACKETT_SERVICE}"; then
    echo "${BOLDGREEN}Service successfully installed and launched!${NC}"
else
    echo "${BOLDRED}ERROR${NC}: Can not start the service '${JACKETT_SERVICE}'"
    exit 1
fi



================================================
FILE: Installer.iss
================================================
; Script generated by the Inno Setup Script Wizard.
; SEE THE DOCUMENTATION FOR DETAILS ON CREATING INNO SETUP SCRIPT FILES!

#define MyAppName "Jackett"
; #define MyAppVersion GetFileVersion(MyFileForVersion) (passed as a parameter)
#define MyAppPublisher "Jackett"
#define MyAppURL "https://github.com/Jackett/Jackett"
#define MyAppExeName "JackettTray.exe"

[Setup]
; NOTE: The value of AppId uniquely identifies this application.
; Do not use the same AppId value in installers for other applications.
; (To generate a new GUID, click Tools | Generate GUID inside the IDE.)
AppId={{C2A9FC00-AA48-4F17-9A72-62FBCEE2785B}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
;AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={commonappdata}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputBaseFilename={#MyOutputFilename}
SetupIconFile=src\Jackett.Tray\jackett.ico
UninstallDisplayIcon={commonappdata}\Jackett\{#MyAppExeName}
VersionInfoVersion={#MyAppVersion}
UninstallDisplayName={#MyAppName}
Compression=lzma
SolidCompression=yes
DisableDirPage=yes
WizardStyle=modern

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "windowsService"; Description: "Install as a Windows Service"
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Dirs]  
Name: "{commonappdata}\Jackett"; Permissions: everyone-modify 

[Files]
Source: "{#MySourceFolder}\*"; DestDir: "{commonappdata}\Jackett"; Flags: ignoreversion recursesubdirs createallsubdirs; Permissions: everyone-modify
; NOTE: Don't use "Flags: ignoreversion" on any shared system files

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{commonappdata}\Jackett\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{commondesktop}\{#MyAppName}"; Filename: "{commonappdata}\Jackett\{#MyAppExeName}"; Tasks: desktopicon

[Code]
function PrepareToInstall(var NeedsRestart: Boolean): String;
var
ErrorCode: Integer;
begin
  ShellExec('open', 'taskkill.exe', '/f /im {#MyAppExeName}', '', SW_HIDE, ewNoWait, ErrorCode);
  ShellExec('open', 'taskkill.exe', '/f /im JackettConsole.exe', '', SW_HIDE, ewNoWait, ErrorCode);
end;

[Run]
Filename: "{commonappdata}\Jackett\JackettConsole.exe"; Parameters: "--Uninstall"; Flags: waituntilterminated runhidden;
Filename: "{commonappdata}\Jackett\JackettConsole.exe"; Parameters: "--ReserveUrls"; Flags: waituntilterminated runhidden;
Filename: "{commonappdata}\Jackett\JackettConsole.exe"; Parameters: "--Install"; Flags: waituntilterminated runhidden; Tasks: windowsService
Filename: "{commonappdata}\Jackett\JackettConsole.exe"; Parameters: "--Start"; Flags: waituntilterminated runhidden; Tasks: windowsService
Filename: "{commonappdata}\Jackett\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
Filename: "{commonappdata}\Jackett\JackettConsole.exe"; Parameters: "--Uninstall"; Flags: waituntilterminated skipifdoesntexist runhidden
Filename: "{sys}\taskkill.exe"; Parameters: "/f /im {#MyAppExeName}"; Flags: waituntilterminated skipifdoesntexist runhidden
Filename: "{sys}\taskkill.exe"; Parameters: "/f /im JackettConsole.exe"; Flags: waituntilterminated skipifdoesntexist runhidden





================================================
FILE: jackett_launcher.bat
================================================
:: Helper script to fix
:: https://github.com/Jackett/Jackett/issues/10068

@echo off

:: Wait until the updater ends
:loop
tasklist | find /i "JackettUpdater.exe" > nul 2>&1
if errorlevel 1 (
  goto continue
) else (
  echo JackettUpdater is still running
  timeout /t 1 /nobreak > nul
  goto loop
)

:: Start Jackett Tray
:continue
start "" "%0\..\JackettTray.exe" --UpdatedVersion yes



================================================
FILE: jackett_launcher.sh
================================================
#!/bin/sh

# Helper script to fix
# https://github.com/Jackett/Jackett/issues/5208#issuecomment-547565515

# Get full Jackett root path
JACKETT_DIR="$(dirname "$(readlink -f "$0")")"

# Launch Jackett (with CLI parameters)
"${JACKETT_DIR}/jackett" --NoRestart "$@"
ec=$?

# Get user running the service
JACKETT_USER=$(whoami)

# Wait until the updater ends
while pgrep -u "${JACKETT_USER}" JackettUpdater > /dev/null; do
    sleep 1
done

exit $ec



================================================
FILE: LICENSE
================================================
                    GNU GENERAL PUBLIC LICENSE
                       Version 2, June 1991

 Copyright (C) 1989, 1991 Free Software Foundation, Inc., <http://fsf.org/>
 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 Everyone is permitted to copy and distribute verbatim copies
 of this license document, but changing it is not allowed.

                            Preamble

  The licenses for most software are designed to take away your
freedom to share and change it.  By contrast, the GNU General Public
License is intended to guarantee your freedom to share and change free
software--to make sure the software is free for all its users.  This
General Public License applies to most of the Free Software
Foundation's software and to any other program whose authors commit to
using it.  (Some other Free Software Foundation software is covered by
the GNU Lesser General Public License instead.)  You can apply it to
your programs, too.

  When we speak of free software, we are referring to freedom, not
price.  Our General Public Licenses are designed to make sure that you
have the freedom to distribute copies of free software (and charge for
this service if you wish), that you receive source code or can get it
if you want it, that you can change the software or use pieces of it
in new free programs; and that you know you can do these things.

  To protect your rights, we need to make restrictions that forbid
anyone to deny you these rights or to ask you to surrender the rights.
These restrictions translate to certain responsibilities for you if you
distribute copies of the software, or if you modify it.

  For example, if you distribute copies of such a program, whether
gratis or for a fee, you must give the recipients all the rights that
you have.  You must make sure that they, too, receive or can get the
source code.  And you must show them these terms so they know their
rights.

  We protect your rights with two steps: (1) copyright the software, and
(2) offer you this license which gives you legal permission to copy,
distribute and/or modify the software.

  Also, for each author's protection and ours, we want to make certain
that everyone understands that there is no warranty for this free
software.  If the software is modified by someone else and passed on, we
want its recipients to know that what they have is not the original, so
that any problems introduced by others will not reflect on the original
authors' reputations.

  Finally, any free program is threatened constantly by software
patents.  We wish to avoid the danger that redistributors of a free
program will individually obtain patent licenses, in effect making the
program proprietary.  To prevent this, we have made it clear that any
patent must be licensed for everyone's free use or not licensed at all.

  The precise terms and conditions for copying, distribution and
modification follow.

                    GNU GENERAL PUBLIC LICENSE
   TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION

  0. This License applies to any program or other work which contains
a notice placed by the copyright holder saying it may be distributed
under the terms of this General Public License.  The "Program", below,
refers to any such program or work, and a "work based on the Program"
means either the Program or any derivative work under copyright law:
that is to say, a work containing the Program or a portion of it,
either verbatim or with modifications and/or translated into another
language.  (Hereinafter, translation is included without limitation in
the term "modification".)  Each licensee is addressed as "you".

Activities other than copying, distribution and modification are not
covered by this License; they are outside its scope.  The act of
running the Program is not restricted, and the output from the Program
is covered only if its contents constitute a work based on the
Program (independent of having been made by running the Program).
Whether that is true depends on what the Program does.

  1. You may copy and distribute verbatim copies of the Program's
source code as you receive it, in any medium, provided that you
conspicuously and appropriately publish on each copy an appropriate
copyright notice and disclaimer of warranty; keep intact all the
notices that refer to this License and to the absence of any warranty;
and give any other recipients of the Program a copy of this License
along with the Program.

You may charge a fee for the physical act of transferring a copy, and
you may at your option offer warranty protection in exchange for a fee.

  2. You may modify your copy or copies of the Program or any portion
of it, thus forming a work based on the Program, and copy and
distribute such modifications or work under the terms of Section 1
above, provided that you also meet all of these conditions:

    a) You must cause the modified files to carry prominent notices
    stating that you changed the files and the date of any change.

    b) You must cause any work that you distribute or publish, that in
    whole or in part contains or is derived from the Program or any
    part thereof, to be licensed as a whole at no charge to all third
    parties under the terms of this License.

    c) If the modified program normally reads commands interactively
    when run, you must cause it, when started running for such
    interactive use in the most ordinary way, to print or display an
    announcement including an appropriate copyright notice and a
    notice that there is no warranty (or else, saying that you provide
    a warranty) and that users may redistribute the program under
    these conditions, and telling the user how to view a copy of this
    License.  (Exception: if the Program itself is interactive but
    does not normally print such an announcement, your work based on
    the Program is not required to print an announcement.)

These requirements apply to the modified work as a whole.  If
identifiable sections of that work are not derived from the Program,
and can be reasonably considered independent and separate works in
themselves, then this License, and its terms, do not apply to those
sections when you distribute them as separate works.  But when you
distribute the same sections as part of a whole which is a work based
on the Program, the distribution of the whole must be on the terms of
this License, whose permissions for other licensees extend to the
entire whole, and thus to each and every part regardless of who wrote it.

Thus, it is not the intent of this section to claim rights or contest
your rights to work written entirely by you; rather, the intent is to
exercise the right to control the distribution of derivative or
collective works based on the Program.

In addition, mere aggregation of another work not based on the Program
with the Program (or with a work based on the Program) on a volume of
a storage or distribution medium does not bring the other work under
the scope of this License.

  3. You may copy and distribute the Program (or a work based on it,
under Section 2) in object code or executable form under the terms of
Sections 1 and 2 above provided that you also do one of the following:

    a) Accompany it with the complete corresponding machine-readable
    source code, which must be distributed under the terms of Sections
    1 and 2 above on a medium customarily used for software interchange; or,

    b) Accompany it with a written offer, valid for at least three
    years, to give any third party, for a charge no more than your
    cost of physically performing source distribution, a complete
    machine-readable copy of the corresponding source code, to be
    distributed under the terms of Sections 1 and 2 above on a medium
    customarily used for software interchange; or,

    c) Accompany it with the information you received as to the offer
    to distribute corresponding source code.  (This alternative is
    allowed only for noncommercial distribution and only if you
    received the program in object code or executable form with such
    an offer, in accord with Subsection b above.)

The source code for a work means the preferred form of the work for
making modifications to it.  For an executable work, complete source
code means all the source code for all modules it contains, plus any
associated interface definition files, plus the scripts used to
control compilation and installation of the executable.  However, as a
special exception, the source code distributed need not include
anything that is normally distributed (in either source or binary
form) with the major components (compiler, kernel, and so on) of the
operating system on which the executable runs, unless that component
itself accompanies the executable.

If distribution of executable or object code is made by offering
access to copy from a designated place, then offering equivalent
access to copy the source code from the same place counts as
distribution of the source code, even though third parties are not
compelled to copy the source along with the object code.

  4. You may not copy, modify, sublicense, or distribute the Program
except as expressly provided under this License.  Any attempt
otherwise to copy, modify, sublicense or distribute the Program is
void, and will automatically terminate your rights under this License.
However, parties who have received copies, or rights, from you under
this License will not have their licenses terminated so long as such
parties remain in full compliance.

  5. You are not required to accept this License, since you have not
signed it.  However, nothing else grants you permission to modify or
distribute the Program or its derivative works.  These actions are
prohibited by law if you do not accept this License.  Therefore, by
modifying or distributing the Program (or any work based on the
Program), you indicate your acceptance of this License to do so, and
all its terms and conditions for copying, distributing or modifying
the Program or works based on it.

  6. Each time you redistribute the Program (or any work based on the
Program), the recipient automatically receives a license from the
original licensor to copy, distribute or modify the Program subject to
these terms and conditions.  You may not impose any further
restrictions on the recipients' exercise of the rights granted herein.
You are not responsible for enforcing compliance by third parties to
this License.

  7. If, as a consequence of a court judgment or allegation of patent
infringement or for any other reason (not limited to patent issues),
conditions are imposed on you (whether by court order, agreement or
otherwise) that contradict the conditions of this License, they do not
excuse you from the conditions of this License.  If you cannot
distribute so as to satisfy simultaneously your obligations under this
License and any other pertinent obligations, then as a consequence you
may not distribute the Program at all.  For example, if a patent
license would not permit royalty-free redistribution of the Program by
all those who receive copies directly or indirectly through you, then
the only way you could satisfy both it and this License would be to
refrain entirely from distribution of the Program.

If any portion of this section is held invalid or unenforceable under
any particular circumstance, the balance of the section is intended to
apply and the section as a whole is intended to apply in other
circumstances.

It is not the purpose of this section to induce you to infringe any
patents or other property right claims or to contest validity of any
such claims; this section has the sole purpose of protecting the
integrity of the free software distribution system, which is
implemented by public license practices.  Many people have made
generous contributions to the wide range of software distributed
through that system in reliance on consistent application of that
system; it is up to the author/donor to decide if he or she is willing
to distribute software through any other system and a licensee cannot
impose that choice.

This section is intended to make thoroughly clear what is believed to
be a consequence of the rest of this License.

  8. If the distribution and/or use of the Program is restricted in
certain countries either by patents or by copyrighted interfaces, the
original copyright holder who places the Program under this License
may add an explicit geographical distribution limitation excluding
those countries, so that distribution is permitted only in or among
countries not thus excluded.  In such case, this License incorporates
the limitation as if written in the body of this License.

  9. The Free Software Foundation may publish revised and/or new versions
of the General Public License from time to time.  Such new versions will
be similar in spirit to the present version, but may differ in detail to
address new problems or concerns.

Each version is given a distinguishing version number.  If the Program
specifies a version number of this License which applies to it and "any
later version", you have the option of following the terms and conditions
either of that version or of any later version published by the Free
Software Foundation.  If the Program does not specify a version number of
this License, you may choose any version ever published by the Free Software
Foundation.

  10. If you wish to incorporate parts of the Program into other free
programs whose distribution conditions are different, write to the author
to ask for permission.  For software which is copyrighted by the Free
Software Foundation, write to the Free Software Foundation; we sometimes
make exceptions for this.  Our decision will be guided by the two goals
of preserving the free status of all derivatives of our free software and
of promoting the sharing and reuse of software generally.

                            NO WARRANTY

  11. BECAUSE THE PROGRAM IS LICENSED FREE OF CHARGE, THERE IS NO WARRANTY
FOR THE PROGRAM, TO THE EXTENT PERMITTED BY APPLICABLE LAW.  EXCEPT WHEN
OTHERWISE STATED IN WRITING THE COPYRIGHT HOLDERS AND/OR OTHER PARTIES
PROVIDE THE PROGRAM "AS IS" WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESSED
OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.  THE ENTIRE RISK AS
TO THE QUALITY AND PERFORMANCE OF THE PROGRAM IS WITH YOU.  SHOULD THE
PROGRAM PROVE DEFECTIVE, YOU ASSUME THE COST OF ALL NECESSARY SERVICING,
REPAIR OR CORRECTION.

  12. IN NO EVENT UNLESS REQUIRED BY APPLICABLE LAW OR AGREED TO IN WRITING
WILL ANY COPYRIGHT HOLDER, OR ANY OTHER PARTY WHO MAY MODIFY AND/OR
REDISTRIBUTE THE PROGRAM AS PERMITTED ABOVE, BE LIABLE TO YOU FOR DAMAGES,
INCLUDING ANY GENERAL, SPECIAL, INCIDENTAL OR CONSEQUENTIAL DAMAGES ARISING
OUT OF THE USE OR INABILITY TO USE THE PROGRAM (INCLUDING BUT NOT LIMITED
TO LOSS OF DATA OR DATA BEING RENDERED INACCURATE OR LOSSES SUSTAINED BY
YOU OR THIRD PARTIES OR A FAILURE OF THE PROGRAM TO OPERATE WITH ANY OTHER
PROGRAMS), EVEN IF SUCH HOLDER OR OTHER PARTY HAS BEEN ADVISED OF THE
POSSIBILITY OF SUCH DAMAGES.

                     END OF TERMS AND CONDITIONS

            How to Apply These Terms to Your New Programs

  If you develop a new program, and you want it to be of the greatest
possible use to the public, the best way to achieve this is to make it
free software which everyone can redistribute and change under these terms.

  To do so, attach the following notices to the program.  It is safest
to attach them to the start of each source file to most effectively
convey the exclusion of warranty; and each file should have at least
the "copyright" line and a pointer to where the full notice is found.

    {description}
    Copyright (C) {year}  {fullname}

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.

Also add information on how to contact you by electronic and paper mail.

If the program is interactive, make it output a short notice like this
when it starts in an interactive mode:

    Gnomovision version 69, Copyright (C) year name of author
    Gnomovision comes with ABSOLUTELY NO WARRANTY; for details type `show w'.
    This is free software, and you are welcome to redistribute it
    under certain conditions; type `show c' for details.

The hypothetical commands `show w' and `show c' should show the appropriate
parts of the General Public License.  Of course, the commands you use may
be called something other than `show w' and `show c'; they could even be
mouse-clicks or menu items--whatever suits your program.

You should also get your employer (if you work as a programmer) or your
school, if any, to sign a "copyright disclaimer" for the program, if
necessary.  Here is a sample; alter the names:

  Yoyodyne, Inc., hereby disclaims all copyright interest in the program
  `Gnomovision' (which makes passes at compilers) written by James Hacker.

  {signature of Ty Coon}, 1 April 1989
  Ty Coon, President of Vice

This General Public License does not permit incorporating your program into
proprietary programs.  If your program is a subroutine library, you may
consider it more useful to permit linking proprietary applications with the
library.  If this is what you want to do, use the GNU Lesser General
Public License instead of this License.




================================================
FILE: uninstall_jackett_macos
================================================
#!/bin/zsh

#Setting up colors
BOLDRED="$(printf '\033[1;31m')"
BOLDGREEN="$(printf '\033[1;32m')"
NC="$(printf '\033[0m')" # No Color

# Move working directory to Jackett's
cd "$(dirname "$0")"

# Check if we're running from Jackett's directory
if [ ! -f ./jackett ]; then
echo "${BOLDRED}ERROR${NC}: Couldn't locate ./jackett - Is the script in the right directory?"
    exit 1
fi
jackettdir="$(pwd)"

echo "This script will uninstall Jackett. Do you want to proceed?"
select yn in "Yes" "No"; do
    case $yn in
        Yes ) break;;
        No ) exit;;
    esac
done

echo "What should be removed? ${BOLDRED}WARNING${NC}: deleting binaries will remove all files located in ${jackettdir}. ${BOLDRED}WARNING${NC}: deleting config files prevents Jackett from being reinstalled."
select yn in "Only agent" "Only agent and binaries" "Agent, binaries and config"; do
    case $yn in
        "Only agent" ) delagent=true; break;;
        "Only agent and binaries" ) delagent=true; delbin=true; break;;
        "Agent, binaries and config" ) delagent=true; delbin=true; delconf=true; break;;
    esac
done

# Unload and delete agent
if [[ "$delagent" = true ]]; then
    echo "Deleting agent..."
    launchctl bootout gui/$(id -u)/org.user.Jackett
    rm ~/Library/LaunchAgents/org.user.Jackett.plist
fi

# Deleting the current folder
if [[ "$delbin" = true ]]; then
    echo "Deleting binaries..."
    rm -R $jackettdir
else
    echo "Binaries have not been deleted from ${jackettdir}"
fi

# Remove config files
if [[ "$delconf" = true ]]; then
    echo "Deleting config files..."
    rm -R ~/.config/Jackett/
else
    echo "Configuration files have been kept in ~/.config/Jackett/"
fi

echo "${BOLDGREEN}Uninstall completed.${NC}"




================================================
FILE: uninstall_service_systemd.sh
================================================
#!/bin/bash

# Define the directory where Jackett was installed
INSTALL_DIR1="/opt/Jackett"
INSTALL_DIR2="/opt/jackett"

# Define the systemd service file for Jackett
JACKETT_SERVICE_PATH="/etc/systemd/system/jackett.service"

# Ensure the script is running with superuser privileges
if [ "$(id -u)" -ne 0 ]; then
  echo "This script must be run as root. Try using 'sudo bash $0'."
  exit 1
fi

echo "Starting Jackett uninstallation..."

# Stop the Jackett service
echo "Stopping the Jackett service..."
if systemctl stop jackett.service; then
  echo "Jackett service stopped successfully."
else
  echo "Failed to stop the Jackett service. It may not have been running."
fi

# Disable the Jackett service
echo "Disabling the Jackett service..."
if systemctl disable jackett.service; then
  echo "Jackett service disabled successfully."
else
  echo "Failed to disable the Jackett service."
fi

# Remove the systemd service file
echo "Removing the systemd service file..."
rm -vf "$JACKETT_SERVICE_PATH"

# Reload systemd to remove traces of the Jackett service
echo "Reloading systemd daemon..."
systemctl daemon-reload

# Remove the Jackett installation directory
echo "Removing Jackett installation directory..."
rm -rf "$INSTALL_DIR1"
rm -rf "$INSTALL_DIR2"

echo "Jackett uninstallation finished."



================================================
FILE: Upstart.config
================================================
author "sea3pea0"
description "Upstart Script to run NzbDrone as a service on Ubuntu/Debian based systems, as well as others"

#Set username for the process. Should probably be what you use for logging in
setuid {username to run jackett}
setgid users

#This is the install directory. If you installed using a deb package or the NzbDrone Repository you do not need to change this

env DIR=/opt/Jackett
env LD_LIBRARY_PATH=/usr/local/nzbdrone/lib

start on runlevel [2345]
stop on runlevel [016]

respawn
script
    chdir $DIR
    exec /volume1/@appstore/Mono/usr/bin/mono --debug JackettConsole.exe
end script



================================================
FILE: yamllint.yml
================================================
---
#
# doc https://yamllint.readthedocs.io/en/stable/
#
# run in local (linux)
# install => sudo python3 -m pip install yamllint
# run => yamllint -s -c ./yamllint.yml ./src/Jackett.Common/Definitions/
#
extends: default

rules:
  comments:
    min-spaces-from-content: 1
  comments-indentation: disable
  document-start:
    level: error
  empty-lines:
    max: 1
  empty-values: enable
  indentation:
    spaces: 2
  line-length: disable
  new-lines:
    type: platform
  truthy: disable



================================================
FILE: .editorconfig
================================================
root=true
# To learn more about .editorconfig see https://aka.ms/editorconfigdocs
# With more recent updates Visual Studio 2017 supports EditorConfig files out of the box
# Visual Studio Code needs an extension: https://github.com/editorconfig/editorconfig-vscode
# For emacs, vim, np++ and other editors, see here: https://github.com/editorconfig
###############################
# Core EditorConfig Options   #
###############################
# All files
[*]
indent_style=space
insert_final_newline=true
charset=utf-8
end_of_line=lf
trim_trailing_whitespace=true

# Microsoft .NET properties
csharp_new_line_before_members_in_object_initializers=true
csharp_space_after_cast=false
csharp_style_var_elsewhere=true:suggestion
csharp_style_var_for_built_in_types=true:suggestion
csharp_style_var_when_type_is_apparent=true:suggestion
dotnet_style_parentheses_in_arithmetic_binary_operators=never_if_unnecessary:none
dotnet_style_parentheses_in_other_binary_operators=never_if_unnecessary:none
dotnet_style_parentheses_in_relational_binary_operators=never_if_unnecessary:none

# ReSharper properties
resharper_align_linq_query=true
resharper_align_multiline_argument=true
resharper_align_multiline_calls_chain=true
resharper_align_multiline_extends_list=true
resharper_align_multiline_for_stmt=true
resharper_align_tuple_components=true
resharper_csharp_alignment_tab_fill_style=optimal_fill
resharper_csharp_align_multiline_parameter=true
resharper_csharp_align_multiple_declaration=true
resharper_csharp_indent_pars=outside
resharper_csharp_keep_blank_lines_in_code=0
resharper_csharp_keep_blank_lines_in_declarations=1
resharper_csharp_max_line_length=125
resharper_csharp_stick_comment=false
resharper_csharp_wrap_after_invocation_lpar=true
resharper_force_attribute_style=separate
resharper_indent_invocation_pars=outside
resharper_indent_method_decl_pars=outside
resharper_indent_preprocessor_region=no_indent
resharper_indent_statement_pars=outside
resharper_indent_typearg_angles=outside
resharper_indent_typeparam_angles=outside
resharper_keep_existing_embedded_arrangement=false
resharper_keep_existing_expr_member_arrangement=false
resharper_keep_existing_invocation_parens_arrangement=false
resharper_keep_existing_linebreaks=false
resharper_keep_existing_switch_expression_arrangement=false
resharper_place_attribute_on_same_line=false
resharper_place_expr_accessor_on_single_line=true
resharper_place_expr_method_on_single_line=true
resharper_place_expr_property_on_single_line=true
resharper_place_simple_embedded_statement_on_same_line=false
resharper_space_within_empty_braces=false
resharper_wrap_array_initializer_style=chop_always
resharper_wrap_before_extends_colon=true
resharper_wrap_before_type_parameter_langle=true
resharper_wrap_multiple_type_parameter_constraints_style=wrap_if_long
resharper_wrap_object_and_collection_initializer_style=chop_always

# ReSharper inspection severities
resharper_arrange_attributes_highlighting=suggestion
resharper_arrange_redundant_parentheses_highlighting=suggestion
resharper_enforce_if_statement_braces_highlighting=suggestion

# Xml project files
[*.{csproj,vbproj,vcxproj,vcxproj.filters,proj,projitems,shproj}]
indent_size=2

# JavaScript/HTML
[*.{js,ts,json,html,cshtml}]
indent_size=4

# Code files
[*.{cs,csx,vb,vbx}]
indent_size=4

###############################
# .NET Coding Conventions     #
###############################
[*.{cs,vb}]
# Organize usings
dotnet_sort_system_directives_first=true
# this. preferences
dotnet_style_qualification_for_field=false:suggestion
dotnet_style_qualification_for_property=false:suggestion
dotnet_style_qualification_for_method=false:suggestion
dotnet_style_qualification_for_event=false:suggestion
# Language keywords vs BCL types preferences
dotnet_style_predefined_type_for_locals_parameters_members=true:warning
dotnet_style_predefined_type_for_member_access=true:suggestion
# Parentheses preferences
dotnet_style_parentheses_in_arithmetic_binary_operators=always_for_clarity:silent
dotnet_style_parentheses_in_relational_binary_operators=always_for_clarity:silent
dotnet_style_parentheses_in_other_binary_operators=always_for_clarity:silent
dotnet_style_parentheses_in_other_operators=never_if_unnecessary:silent
# Modifier preferences
dotnet_style_require_accessibility_modifiers=for_non_interface_members:silent
dotnet_style_readonly_field=true:suggestion

# Expression-level preferences
dotnet_style_object_initializer=true:warning
dotnet_style_collection_initializer=true:warning
dotnet_style_explicit_tuple_names=true:suggestion
dotnet_style_null_propagation=true:suggestion
dotnet_style_coalesce_expression=true:suggestion
dotnet_style_prefer_is_null_check_over_reference_equality_method=true:suggestion
dotnet_style_prefer_inferred_tuple_names=true:suggestion
dotnet_style_prefer_inferred_anonymous_type_member_names=true:suggestion
dotnet_style_prefer_auto_properties=true:suggestion
dotnet_style_prefer_conditional_expression_over_assignment=true:suggestion
dotnet_style_prefer_conditional_expression_over_return=true:suggestion
dotnet_style_prefer_compound_assignment=true:suggestion

###############################
# Naming Conventions          #
###############################
# Style Definitions
dotnet_naming_style.pascal_case_style.capitalization=pascal_case
# Use PascalCase for constant fields
dotnet_naming_rule.constant_fields_should_be_pascal_case.severity=warning
dotnet_naming_rule.constant_fields_should_be_pascal_case.symbols=constant_fields
dotnet_naming_rule.constant_fields_should_be_pascal_case.style=pascal_case_style
dotnet_naming_symbols.constant_fields.applicable_kinds=field
dotnet_naming_symbols.constant_fields.applicable_accessibilities=*
dotnet_naming_symbols.constant_fields.required_modifiers=const

# Naming rules

dotnet_naming_rule.interface_should_be_begins_with_i.severity = warning
dotnet_naming_rule.interface_should_be_begins_with_i.symbols = interface
dotnet_naming_rule.interface_should_be_begins_with_i.style = begins_with_i

dotnet_naming_rule.types_should_be_pascal_case.severity = warning
dotnet_naming_rule.types_should_be_pascal_case.symbols = types
dotnet_naming_rule.types_should_be_pascal_case.style = pascal_case

dotnet_naming_rule.non_field_members_should_be_pascal_case.severity = warning
dotnet_naming_rule.non_field_members_should_be_pascal_case.symbols = non_field_members
dotnet_naming_rule.non_field_members_should_be_pascal_case.style = pascal_case

dotnet_naming_rule.private_or_internal_static_field_should_be_private_or_internal_static_with_prefix.severity = warning
dotnet_naming_rule.private_or_internal_static_field_should_be_private_or_internal_static_with_prefix.symbols = private_or_internal_static_field
dotnet_naming_rule.private_or_internal_static_field_should_be_private_or_internal_static_with_prefix.style = private_or_internal_static_with_prefix

dotnet_naming_rule.private_or_internal_field_should_be_private_prefix.severity = warning
dotnet_naming_rule.private_or_internal_field_should_be_private_prefix.symbols = private_or_internal_field
dotnet_naming_rule.private_or_internal_field_should_be_private_prefix.style = private_prefix

dotnet_naming_rule.asyncmethods_should_be_ends_with_async.severity = warning
dotnet_naming_rule.asyncmethods_should_be_ends_with_async.symbols = asyncmethods
dotnet_naming_rule.asyncmethods_should_be_ends_with_async.style = ends_with_async

# Symbol specifications

dotnet_naming_symbols.interface.applicable_kinds = interface
dotnet_naming_symbols.interface.applicable_accessibilities = public, internal, private, protected, protected_internal, private_protected
dotnet_naming_symbols.interface.required_modifiers =

dotnet_naming_symbols.private_or_internal_field.applicable_kinds = field
dotnet_naming_symbols.private_or_internal_field.applicable_accessibilities = internal, private, private_protected
dotnet_naming_symbols.private_or_internal_field.required_modifiers =

dotnet_naming_symbols.private_or_internal_static_field.applicable_kinds = field
dotnet_naming_symbols.private_or_internal_static_field.applicable_accessibilities = internal, private, private_protected
dotnet_naming_symbols.private_or_internal_static_field.required_modifiers = static

dotnet_naming_symbols.types.applicable_kinds = class, struct, interface, enum
dotnet_naming_symbols.types.applicable_accessibilities = public, internal, private, protected, protected_internal, private_protected
dotnet_naming_symbols.types.required_modifiers =

dotnet_naming_symbols.non_field_members.applicable_kinds = property, event, method
dotnet_naming_symbols.non_field_members.applicable_accessibilities = public, internal, private, protected, protected_internal, private_protected
dotnet_naming_symbols.non_field_members.required_modifiers =

dotnet_naming_symbols.asyncmethods.applicable_kinds = delegate, method, local_function
dotnet_naming_symbols.asyncmethods.applicable_accessibilities = *
dotnet_naming_symbols.asyncmethods.required_modifiers = async

# Naming styles

dotnet_naming_style.pascal_case.required_prefix =
dotnet_naming_style.pascal_case.required_suffix =
dotnet_naming_style.pascal_case.word_separator =
dotnet_naming_style.pascal_case.capitalization = pascal_case

dotnet_naming_style.begins_with_i.required_prefix = I
dotnet_naming_style.begins_with_i.required_suffix =
dotnet_naming_style.begins_with_i.word_separator =
dotnet_naming_style.begins_with_i.capitalization = pascal_case

dotnet_naming_style.private_or_internal_static_with_prefix.required_prefix = _
dotnet_naming_style.private_or_internal_static_with_prefix.required_suffix =
dotnet_naming_style.private_or_internal_static_with_prefix.word_separator =
dotnet_naming_style.private_or_internal_static_with_prefix.capitalization = pascal_case

dotnet_naming_style.private_prefix.required_prefix = _
dotnet_naming_style.private_prefix.required_suffix =
dotnet_naming_style.private_prefix.word_separator =
dotnet_naming_style.private_prefix.capitalization = camel_case

dotnet_naming_style.ends_with_async.required_prefix =
dotnet_naming_style.ends_with_async.required_suffix = Async
dotnet_naming_style.ends_with_async.word_separator =
dotnet_naming_style.ends_with_async.capitalization = pascal_case

###############################
# C# Coding Conventions       #
###############################
[*.cs]
# var preferences
csharp_style_var_for_built_in_types=true:suggestion
csharp_style_var_when_type_is_apparent=true:suggestion
csharp_style_var_elsewhere=true:suggestion
# Expression-bodied members
csharp_style_expression_bodied_methods=when_on_single_line:suggestion
csharp_style_expression_bodied_constructors=false:suggestion
csharp_style_expression_bodied_operators=when_on_single_line:suggestion
csharp_style_expression_bodied_properties=true:suggestion
csharp_style_expression_bodied_indexers=true:suggestion
csharp_style_expression_bodied_accessors=true:suggestion
csharp_style_expression_bodied_lambdas=true:suggestion
csharp_style_expression_bodied_local_functions=true:suggestion

# Pattern matching preferences
csharp_style_pattern_matching_over_is_with_cast_check=true:suggestion
csharp_style_pattern_matching_over_as_with_null_check=true:suggestion
# Null-checking preferences
csharp_style_throw_expression=true:warning
csharp_style_conditional_delegate_call=true:warning
# Modifier preferences
csharp_preferred_modifier_order=public,private,protected,internal,static,extern,new,virtual,abstract,sealed,override,readonly,unsafe,volatile,async:suggestion
# Expression-level preferences
csharp_prefer_braces=true:suggestion
csharp_style_deconstructed_variable_declaration=true:suggestion
csharp_prefer_simple_default_expression=true:warning
csharp_style_pattern_local_over_anonymous_function=true:suggestion
csharp_style_inlined_variable_declaration=true:suggestion
# Prefer C# 8.0 Indexing Features
csharp_style_prefer_index_operator=true:suggestion
csharp_style_prefer_range_operator=true:suggestion

csharp_style_deconstructed_variable_declaration=true:suggestion
csharp_style_pattern_local_over_anonymous_function=true:suggestion
csharp_using_directive_placement=outside_namespace:suggestion
csharp_prefer_static_local_function=true:suggestion
csharp_prefer_simple_using_statement=true:suggestion
csharp_style_prefer_switch_expression=true:suggestion

###############################
# C# Formatting Rules         #
###############################
# New line preferences
csharp_new_line_before_open_brace=all
csharp_new_line_before_else=true
csharp_new_line_before_catch=true
csharp_new_line_before_finally=true
csharp_new_line_before_members_in_object_initializers=true
csharp_new_line_before_members_in_anonymous_types=true
csharp_new_line_between_query_expression_clauses=true
# Indentation preferences
csharp_indent_case_contents=true
csharp_indent_switch_labels=true
csharp_indent_labels=flush_left
csharp_indent_block_contents=true
csharp_indent_braces=false
csharp_indent_case_contents_when_block=true
# Space preferences
csharp_space_after_cast=false
csharp_space_after_keywords_in_control_flow_statements=true
csharp_space_between_method_call_parameter_list_parentheses=false
csharp_space_between_method_declaration_parameter_list_parentheses=false
csharp_space_between_parentheses=false
csharp_space_before_colon_in_inheritance_clause=true
csharp_space_after_colon_in_inheritance_clause=true
csharp_space_around_binary_operators=before_and_after
csharp_space_between_method_declaration_empty_parameter_list_parentheses=false
csharp_space_between_method_call_name_and_opening_parenthesis=false
csharp_space_between_method_call_empty_parameter_list_parentheses=false
# Wrapping preferences
csharp_preserve_single_line_statements=false
csharp_preserve_single_line_blocks=true

###############################
# VB Coding Conventions       #
###############################
[*.vb]
# Modifier preferences
visual_basic_preferred_modifier_order=Partial,Default,Private,Protected,Public,Friend,NotOverridable,Overridable,MustOverride,Overloads,Overrides,MustInherit,NotInheritable,Static,Shared,Shadows,ReadOnly,WriteOnly,Dim,Const,WithEvents,Widening,Narrowing,Custom,Async:suggestion



================================================
FILE: src/Directory.Build.props
================================================
<Project>
    <!-- Common to all Jackett Projects -->
    <PropertyGroup>
        <!-- Specifies whether it's one of our own libraries -->
        <JackettProject>false</JackettProject>
        <JackettProject Condition="$(MSBuildProjectName.StartsWith('Jackett'))">true</JackettProject>
    </PropertyGroup>

    <!-- Set the Product and Version info for our own projects -->
    <PropertyGroup Condition="'$(JackettProject)'=='true'">
        <Version>0.0.0</Version>

        <PathMap>$(MSBuildProjectDirectory)=./$(MSBuildProjectName)/</PathMap>
    </PropertyGroup>

    <PropertyGroup>
        <IncludeSourceRevisionInInformationalVersion>false</IncludeSourceRevisionInInformationalVersion>
    </PropertyGroup>
</Project>



================================================
FILE: src/Jackett.sln
================================================
Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio Version 16
VisualStudioVersion = 16.0.29519.181
MinimumVisualStudioVersion = 10.0.40219.1
Project("{2150E333-8FDC-42A3-9474-1A3956D46DE8}") = "Solution Items", "Solution Items", "{BE7B0C8A-6144-47CD-821E-B09BA1B7BADE}"
	ProjectSection(SolutionItems) = preProject
		..\.editorconfig = ..\.editorconfig
		..\azure-pipelines.yml = ..\azure-pipelines.yml
		..\Installer.iss = ..\Installer.iss
		..\LICENSE = ..\LICENSE
		..\README.md = ..\README.md
	EndProjectSection
EndProject
Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "Jackett.Service", "Jackett.Service\Jackett.Service.csproj", "{BF611F7B-4658-4CB8-AA9E-0736FADAA3BA}"
EndProject
Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "Jackett.Tray", "Jackett.Tray\Jackett.Tray.csproj", "{FF9025B1-EC14-4AA9-8081-9F69C5E35B63}"
EndProject
Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "Jackett.Updater", "Jackett.Updater\Jackett.Updater.csproj", "{A61E311A-6F8B-4497-B5E4-2EA8994C7BD8}"
EndProject
Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "Jackett.Test", "Jackett.Test\Jackett.Test.csproj", "{FA22C904-9F5D-4D3C-9122-3E33652E7373}"
EndProject
Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "DateTimeRoutines", "DateTimeRoutines\DateTimeRoutines.csproj", "{C28A79EE-EF81-4EEE-A7FE-EB636423C935}"
EndProject
Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "Jackett.Common", "Jackett.Common\Jackett.Common.csproj", "{6B854A1B-9A90-49C0-BC37-9A35C75BCA73}"
EndProject
Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "Jackett.Server", "Jackett.Server\Jackett.Server.csproj", "{84182782-EDBC-4342-ADA6-72B7694D0862}"
EndProject
Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "Jackett.IntegrationTests", "Jackett.IntegrationTests\Jackett.IntegrationTests.csproj", "{0250DEAA-ED2E-4F72-BE76-D92D80B40080}"
EndProject
Global
	GlobalSection(SolutionConfigurationPlatforms) = preSolution
		Debug|Any CPU = Debug|Any CPU
		Release|Any CPU = Release|Any CPU
	EndGlobalSection
	GlobalSection(ProjectConfigurationPlatforms) = postSolution
		{BF611F7B-4658-4CB8-AA9E-0736FADAA3BA}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{BF611F7B-4658-4CB8-AA9E-0736FADAA3BA}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{BF611F7B-4658-4CB8-AA9E-0736FADAA3BA}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{BF611F7B-4658-4CB8-AA9E-0736FADAA3BA}.Release|Any CPU.Build.0 = Release|Any CPU
		{FF9025B1-EC14-4AA9-8081-9F69C5E35B63}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{FF9025B1-EC14-4AA9-8081-9F69C5E35B63}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{FF9025B1-EC14-4AA9-8081-9F69C5E35B63}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{FF9025B1-EC14-4AA9-8081-9F69C5E35B63}.Release|Any CPU.Build.0 = Release|Any CPU
		{A61E311A-6F8B-4497-B5E4-2EA8994C7BD8}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{A61E311A-6F8B-4497-B5E4-2EA8994C7BD8}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{A61E311A-6F8B-4497-B5E4-2EA8994C7BD8}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{A61E311A-6F8B-4497-B5E4-2EA8994C7BD8}.Release|Any CPU.Build.0 = Release|Any CPU
		{FA22C904-9F5D-4D3C-9122-3E33652E7373}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{FA22C904-9F5D-4D3C-9122-3E33652E7373}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{FA22C904-9F5D-4D3C-9122-3E33652E7373}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{FA22C904-9F5D-4D3C-9122-3E33652E7373}.Release|Any CPU.Build.0 = Release|Any CPU
		{C28A79EE-EF81-4EEE-A7FE-EB636423C935}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{C28A79EE-EF81-4EEE-A7FE-EB636423C935}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{C28A79EE-EF81-4EEE-A7FE-EB636423C935}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{C28A79EE-EF81-4EEE-A7FE-EB636423C935}.Release|Any CPU.Build.0 = Release|Any CPU
		{6B854A1B-9A90-49C0-BC37-9A35C75BCA73}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{6B854A1B-9A90-49C0-BC37-9A35C75BCA73}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{6B854A1B-9A90-49C0-BC37-9A35C75BCA73}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{6B854A1B-9A90-49C0-BC37-9A35C75BCA73}.Release|Any CPU.Build.0 = Release|Any CPU
		{84182782-EDBC-4342-ADA6-72B7694D0862}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{84182782-EDBC-4342-ADA6-72B7694D0862}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{84182782-EDBC-4342-ADA6-72B7694D0862}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{84182782-EDBC-4342-ADA6-72B7694D0862}.Release|Any CPU.Build.0 = Release|Any CPU
		{0250DEAA-ED2E-4F72-BE76-D92D80B40080}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{0250DEAA-ED2E-4F72-BE76-D92D80B40080}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{0250DEAA-ED2E-4F72-BE76-D92D80B40080}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{0250DEAA-ED2E-4F72-BE76-D92D80B40080}.Release|Any CPU.Build.0 = Release|Any CPU
	EndGlobalSection
	GlobalSection(SolutionProperties) = preSolution
		HideSolutionNode = FALSE
	EndGlobalSection
	GlobalSection(ExtensibilityGlobals) = postSolution
		SolutionGuid = {54BC4102-8B85-49C1-BA12-257D941D1B97}
	EndGlobalSection
	GlobalSection(MonoDevelopProperties) = preSolution
		Policies = $0
		$0.TextStylePolicy = $3
		$1.scope = text/x-csharp
		$1.TabsToSpaces = True
		$1.EolMarker = Unix
		$0.CSharpFormattingPolicy = $2
		$2.IndentSwitchBody = True
		$2.IndentBlocksInsideExpressions = True
		$2.AnonymousMethodBraceStyle = NextLine
		$2.PropertyBraceStyle = NextLine
		$2.PropertyGetBraceStyle = NextLine
		$2.PropertySetBraceStyle = NextLine
		$2.EventBraceStyle = NextLine
		$2.EventAddBraceStyle = NextLine
		$2.EventRemoveBraceStyle = NextLine
		$2.StatementBraceStyle = NextLine
		$2.ElseNewLinePlacement = NewLine
		$2.CatchNewLinePlacement = NewLine
		$2.FinallyNewLinePlacement = NewLine
		$2.WhileNewLinePlacement = DoNotCare
		$2.ArrayInitializerWrapping = DoNotChange
		$2.ArrayInitializerBraceStyle = NextLine
		$2.BeforeMethodDeclarationParentheses = False
		$2.BeforeMethodCallParentheses = False
		$2.BeforeConstructorDeclarationParentheses = False
		$2.NewLineBeforeConstructorInitializerColon = NewLine
		$2.NewLineAfterConstructorInitializerColon = SameLine
		$2.BeforeDelegateDeclarationParentheses = False
		$2.NewParentheses = False
		$2.SpacesBeforeBrackets = False
		$2.scope = text/x-csharp
		$2.IndentSwitchSection = True
		$2.NewLinesForBracesInProperties = True
		$2.NewLinesForBracesInAccessors = True
		$2.NewLinesForBracesInAnonymousMethods = True
		$2.NewLinesForBracesInControlBlocks = True
		$2.NewLinesForBracesInAnonymousTypes = True
		$2.NewLinesForBracesInObjectCollectionArrayInitializers = True
		$2.NewLinesForBracesInLambdaExpressionBody = True
		$2.NewLineForElse = True
		$2.NewLineForCatch = True
		$2.NewLineForFinally = True
		$2.NewLineForMembersInObjectInit = True
		$2.NewLineForMembersInAnonymousTypes = True
		$2.NewLineForClausesInQuery = True
		$2.SpacingAfterMethodDeclarationName = False
		$2.SpaceAfterMethodCallName = False
		$2.SpaceBeforeOpenSquareBracket = False
		$3.FileWidth = 80
		$3.TabsToSpaces = True
		$3.scope = text/plain
	EndGlobalSection
EndGlobal



================================================
FILE: src/DateTimeRoutines/DateTimeRoutines.cs
================================================
//********************************************************************************************
//Author: Sergey Stoyan, CliverSoft.com
//        http://cliversoft.com
//        stoyan@cliversoft.com
//        sergey.stoyan@gmail.com
//        27 February 2007
//********************************************************************************************

using System;
using System.Diagnostics.CodeAnalysis;
using System.Text.RegularExpressions;

// ReSharper disable NotAccessedField.Global
// ReSharper disable MemberCanBePrivate.Global
// ReSharper disable UnusedMember.Global

namespace DateTimeRoutines
{
    /// <summary>
    /// Miscellaneous and parsing methods for DateTime
    /// </summary>
    [ExcludeFromCodeCoverage] // this library is not changed by Jackett team
    public static class DateTimeRoutines
    {
        #region miscellaneous methods

        /// <summary>
        /// Amount of seconds elapsed between 1970-01-01 00:00:00 and the date-time.
        /// </summary>
        /// <param name="dateTime">date-time</param>
        /// <returns>seconds</returns>
        public static uint GetSecondsSinceUnixEpoch(this DateTime dateTime)
        {
            var t = dateTime - new DateTime(1970, 1, 1);
            var ss = (int)t.TotalSeconds;
            if (ss < 0)
                return 0;
            return (uint)ss;
        }

        #endregion

        #region parsing definitions

        /// <summary>
        /// Defines a substring where date-time was found and result of conversion
        /// </summary>
        public class ParsedDateTime
        {
            /// <summary>
            /// Index of first char of a date substring found in the string
            /// </summary>
            public readonly int IndexOfDate;
            /// <summary>
            /// Length a date substring found in the string
            /// </summary>
            public readonly int LengthOfDate;
            /// <summary>
            /// Index of first char of a time substring found in the string
            /// </summary>
            public readonly int IndexOfTime;
            /// <summary>
            /// Length of a time substring found in the string
            /// </summary>
            public readonly int LengthOfTime;
            /// <summary>
            /// DateTime found in the string
            /// </summary>
            public readonly DateTime DateTime;
            /// <summary>
            /// True if a date was found within the string
            /// </summary>
            public readonly bool IsDateFound;
            /// <summary>
            /// True if a time was found within the string
            /// </summary>
            public readonly bool IsTimeFound;
            /// <summary>
            /// UTC offset if it was found within the string
            /// </summary>
            public readonly TimeSpan UtcOffset;
            /// <summary>
            /// True if UTC offset was found in the string
            /// </summary>
            public readonly bool IsUtcOffsetFound;
            /// <summary>
            /// Utc gotten from DateTime if IsUtcOffsetFound is True
            /// </summary>
            public DateTime UtcDateTime;

            internal ParsedDateTime(int indexOfDate, int lengthOfDate, int indexOfTime, int lengthOfTime, DateTime dateTime)
            {
                IndexOfDate = indexOfDate;
                LengthOfDate = lengthOfDate;
                IndexOfTime = indexOfTime;
                LengthOfTime = lengthOfTime;
                DateTime = dateTime;
                IsDateFound = indexOfDate > -1;
                IsTimeFound = indexOfTime > -1;
                UtcOffset = new TimeSpan(25, 0, 0);
                IsUtcOffsetFound = false;
                UtcDateTime = new DateTime(1, 1, 1);
            }

            internal ParsedDateTime(int indexOfDate, int lengthOfDate, int indexOfTime, int lengthOfTime, DateTime dateTime, TimeSpan utcOffset)
            {
                IndexOfDate = indexOfDate;
                LengthOfDate = lengthOfDate;
                IndexOfTime = indexOfTime;
                LengthOfTime = lengthOfTime;
                DateTime = dateTime;
                IsDateFound = indexOfDate > -1;
                IsTimeFound = indexOfTime > -1;
                UtcOffset = utcOffset;
                IsUtcOffsetFound = Math.Abs(utcOffset.TotalHours) < 12;
                if (!IsUtcOffsetFound)
                    UtcDateTime = new DateTime(1, 1, 1);
                else
                {
                    if (indexOfDate < 0)//to avoid negative date exception when date is undefined
                    {
                        var ts = dateTime.TimeOfDay + utcOffset;
                        if (ts < new TimeSpan(0))
                            UtcDateTime = new DateTime(1, 1, 2) + ts;
                        else
                            UtcDateTime = new DateTime(1, 1, 1) + ts;
                    }
                    else
                        UtcDateTime = dateTime + utcOffset;
                }
            }
        }

        /// <summary>
        /// Date that is accepted in the following cases:
        /// - no date was parsed by TryParseDateOrTime();
        /// - no year was found by TryParseDate();
        /// It is ignored if DefaultDateIsNow = true was set after DefaultDate
        /// </summary>
        public static DateTime DefaultDate
        {
            set
            {
                _DefaultDate = value;
                DefaultDateIsNow = false;
            }
            get => DefaultDateIsNow ? DateTime.Now : _DefaultDate;
        }

        private static DateTime _DefaultDate = DateTime.Now;

        /// <summary>
        /// If true then DefaultDate property is ignored and DefaultDate is always DateTime.Now
        /// </summary>
        public static bool DefaultDateIsNow = true;

        /// <summary>
        /// Defines default date-time format.
        /// </summary>
        [Flags]
        public enum DateTimeFormat
        {
            /// <summary>
            /// month number goes before day number
            /// </summary>
            UsaDate,
            /// <summary>
            /// day number goes before month number
            /// </summary>
            UkDate,
            ///// <summary>
            ///// time is specified through AM or PM
            ///// </summary>
            //USA_TIME,
        }

        #endregion

        #region parsing derived methods for DateTime output

        /// <summary>
        /// Tries to find date and time within the passed string and return it as DateTime structure.
        /// </summary>
        /// <param name="str">string that contains date and/or time</param>
        /// <param name="defaultFormat">format to be used preferably in ambivalent instances</param>
        /// <param name="dateTime">parsed date-time output</param>
        /// <returns>true if both date and time were found, else false</returns>
        public static bool TryParseDateTime(this string str, DateTimeFormat defaultFormat, out DateTime dateTime)
        {
            if (!TryParseDateTime(str, defaultFormat, out ParsedDateTime parsedDateTime))
            {
                dateTime = new DateTime(1, 1, 1);
                return false;
            }
            dateTime = parsedDateTime.DateTime;
            return true;
        }

        /// <summary>
        /// Tries to find date and/or time within the passed string and return it as DateTime structure.
        /// If only date was found, time in the returned DateTime is always 0:0:0.
        /// If only time was found, date in the returned DateTime is DefaultDate.
        /// </summary>
        /// <param name="str">string that contains date and(or) time</param>
        /// <param name="defaultFormat">format to be used preferably in ambivalent instances</param>
        /// <param name="dateTime">parsed date-time output</param>
        /// <returns>true if date and/or time was found, else false</returns>
        public static bool TryParseDateOrTime(this string str, DateTimeFormat defaultFormat, out DateTime dateTime)
        {
            if (!TryParseDateOrTime(str, defaultFormat, out ParsedDateTime parsedDateTime))
            {
                dateTime = new DateTime(1, 1, 1);
                return false;
            }
            dateTime = parsedDateTime.DateTime;
            return true;
        }

        /// <summary>
        /// Tries to find time within the passed string and return it as DateTime structure.
        /// It recognizes only time while ignoring date, so date in the returned DateTime is always 1/1/1.
        /// </summary>
        /// <param name="str">string that contains time</param>
        /// <param name="defaultFormat">format to be used preferably in ambivalent instances</param>
        /// <param name="time">parsed time output</param>
        /// <returns>true if time was found, else false</returns>
        public static bool TryParseTime(this string str, DateTimeFormat defaultFormat, out DateTime time)
        {
            if (!TryParseTime(str, defaultFormat, out var parsedTime, null))
            {
                time = new DateTime(1, 1, 1);
                return false;
            }
            time = parsedTime.DateTime;
            return true;
        }

        /// <summary>
        /// Tries to find date within the passed string and return it as DateTime structure.
        /// It recognizes only date while ignoring time, so time in the returned DateTime is always 0:0:0.
        /// If year of the date was not found then it accepts the current year.
        /// </summary>
        /// <param name="str">string that contains date</param>
        /// <param name="defaultFormat">format to be used preferably in ambivalent instances</param>
        /// <param name="date">parsed date output</param>
        /// <returns>true if date was found, else false</returns>
        public static bool TryParseDate(this string str, DateTimeFormat defaultFormat, out DateTime date)
        {
            if (!TryParseDate(str, defaultFormat, out ParsedDateTime parsedDate))
            {
                date = new DateTime(1, 1, 1);
                return false;
            }
            date = parsedDate.DateTime;
            return true;
        }

        #endregion

        #region parsing derived methods for ParsedDateTime output

        /// <summary>
        /// Tries to find date and time within the passed string and return it as ParsedDateTime object.
        /// </summary>
        /// <param name="str">string that contains date-time</param>
        /// <param name="defaultFormat">format to be used preferably in ambivalent instances</param>
        /// <param name="parsedDateTime">parsed date-time output</param>
        /// <returns>true if both date and time were found, else false</returns>
        public static bool TryParseDateTime(this string str, DateTimeFormat defaultFormat, out ParsedDateTime parsedDateTime)
        {
            if (TryParseDateOrTime(str, defaultFormat, out parsedDateTime)
                && parsedDateTime.IsDateFound
                && parsedDateTime.IsTimeFound
                )
                return true;

            parsedDateTime = null;
            return false;
        }

        /// <summary>
        /// Tries to find time within the passed string and return it as ParsedDateTime object.
        /// It recognizes only time while ignoring date, so date in the returned ParsedDateTime is always 1/1/1
        /// </summary>
        /// <param name="str">string that contains date-time</param>
        /// <param name="defaultFormat">format to be used preferably in ambivalent instances</param>
        /// <param name="parsedTime">parsed date-time output</param>
        /// <returns>true if time was found, else false</returns>
        public static bool TryParseTime(this string str, DateTimeFormat defaultFormat, out ParsedDateTime parsedTime)
            => TryParseTime(str, defaultFormat, out parsedTime, null);

        /// <summary>
        /// Tries to find date and/or time within the passed string and return it as ParsedDateTime object.
        /// If only date was found, time in the returned ParsedDateTime is always 0:0:0.
        /// If only time was found, date in the returned ParsedDateTime is DefaultDate.
        /// </summary>
        /// <param name="str">string that contains date-time</param>
        /// <param name="defaultFormat">format to be used preferably in ambivalent instances</param>
        /// <param name="parsedDateTime">parsed date-time output</param>
        /// <returns>true if date or time was found, else false</returns>
        public static bool TryParseDateOrTime(this string str, DateTimeFormat defaultFormat, out ParsedDateTime parsedDateTime)
        {
            parsedDateTime = null;

            ParsedDateTime parsedTime;
            if (!TryParseDate(str, defaultFormat, out
            ParsedDateTime parsedDate))
            {
                if (!TryParseTime(str, defaultFormat, out parsedTime, null))
                    return false;

                var dateTime = new DateTime(DefaultDate.Year, DefaultDate.Month, DefaultDate.Day, parsedTime.DateTime.Hour, parsedTime.DateTime.Minute, parsedTime.DateTime.Second);
                parsedDateTime = new ParsedDateTime(-1, -1, parsedTime.IndexOfTime, parsedTime.LengthOfTime, dateTime, parsedTime.UtcOffset);
            }
            else
            {
                if (!TryParseTime(str, defaultFormat, out parsedTime, parsedDate))
                {
                    var dateTime = new DateTime(parsedDate.DateTime.Year, parsedDate.DateTime.Month, parsedDate.DateTime.Day, 0, 0, 0);
                    parsedDateTime = new ParsedDateTime(parsedDate.IndexOfDate, parsedDate.LengthOfDate, -1, -1, dateTime);
                }
                else
                {
                    var dateTime = new DateTime(parsedDate.DateTime.Year, parsedDate.DateTime.Month, parsedDate.DateTime.Day, parsedTime.DateTime.Hour, parsedTime.DateTime.Minute, parsedTime.DateTime.Second);
                    parsedDateTime = new ParsedDateTime(parsedDate.IndexOfDate, parsedDate.LengthOfDate, parsedTime.IndexOfTime, parsedTime.LengthOfTime, dateTime, parsedTime.UtcOffset);
                }
            }

            return true;
        }

        #endregion

        #region parsing base methods

        /// <summary>
        /// Tries to find time within the passed string (relatively to the passed parsed_date if any) and return it as ParsedDateTime object.
        /// It recognizes only time while ignoring date, so date in the returned ParsedDateTime is always 1/1/1
        /// </summary>
        /// <param name="str">string that contains date</param>
        /// <param name="defaultFormat">format to be used preferably in ambivalent instances</param>
        /// <param name="parsedTime">parsed date-time output</param>
        /// <param name="parsedDate">ParsedDateTime object if the date was found within this string, else NULL</param>
        /// <returns>true if time was found, else false</returns>
        public static bool TryParseTime(this string str, DateTimeFormat defaultFormat, out ParsedDateTime parsedTime, ParsedDateTime parsedDate)
        {
            parsedTime = null;

            var timeZoneR = defaultFormat == DateTimeFormat.UsaDate ?
                @"(?:\s*(?'time_zone'UTC|GMT|CST|EST))?" : @"(?:\s*(?'time_zone'UTC|GMT))?";

            Match m;
            if (parsedDate != null && parsedDate.IndexOfDate > -1)
            {//look around the found date
                //look for <date> hh:mm:ss <UTC offset>
                m = Regex.Match(str.Substring(parsedDate.IndexOfDate + parsedDate.LengthOfDate), @"(?<=^\s*,?\s+|^\s*at\s*|^\s*[T\-]\s*)(?'hour'\d{2})\s*:\s*(?'minute'\d{2})\s*:\s*(?'second'\d{2})\s+(?'offset_sign'[\+\-])(?'offset_hh'\d{2}):?(?'offset_mm'\d{2})(?=$|[^\d\w])", RegexOptions.Compiled);
                if (!m.Success)
                    //look for <date> [h]h:mm[:ss] [PM/AM] [UTC/GMT]
                    m = Regex.Match(str.Substring(parsedDate.IndexOfDate + parsedDate.LengthOfDate), @"(?<=^\s*,?\s+|^\s*at\s*|^\s*[T\-]\s*)(?'hour'\d{1,2})\s*:\s*(?'minute'\d{2})\s*(?::\s*(?'second'\d{2}))?(?:\s*(?'ampm'AM|am|PM|pm))?" + timeZoneR + @"(?=$|[^\d\w])", RegexOptions.Compiled);
                if (!m.Success)
                    //look for [h]h:mm:ss [PM/AM] [UTC/GMT] <date>
                    m = Regex.Match(str.Substring(0, parsedDate.IndexOfDate), @"(?<=^|[^\d])(?'hour'\d{1,2})\s*:\s*(?'minute'\d{2})\s*(?::\s*(?'second'\d{2}))?(?:\s*(?'ampm'AM|am|PM|pm))?" + timeZoneR + @"(?=$|[\s,]+)", RegexOptions.Compiled);
                if (!m.Success)
                    //look for [h]h:mm:ss [PM/AM] [UTC/GMT] within <date>
                    m = Regex.Match(str.Substring(parsedDate.IndexOfDate, parsedDate.LengthOfDate), @"(?<=^|[^\d])(?'hour'\d{1,2})\s*:\s*(?'minute'\d{2})\s*(?::\s*(?'second'\d{2}))?(?:\s*(?'ampm'AM|am|PM|pm))?" + timeZoneR + @"(?=$|[\s,]+)", RegexOptions.Compiled);
            }
            else//look anywhere within string
            {
                //look for hh:mm:ss <UTC offset>
                m = Regex.Match(str, @"(?<=^|\s+|\s*T\s*)(?'hour'\d{2})\s*:\s*(?'minute'\d{2})\s*:\s*(?'second'\d{2})\s+(?'offset_sign'[\+\-])(?'offset_hh'\d{2}):?(?'offset_mm'\d{2})?(?=$|[^\d\w])", RegexOptions.Compiled);
                if (!m.Success)
                    //look for [h]h:mm[:ss] [PM/AM] [UTC/GMT]
                    m = Regex.Match(str, @"(?<=^|\s+|\s*T\s*)(?'hour'\d{1,2})\s*:\s*(?'minute'\d{2})\s*(?::\s*(?'second'\d{2}))?(?:\s*(?'ampm'AM|am|PM|pm))?" + timeZoneR + @"(?=$|[^\d\w])", RegexOptions.Compiled);
            }

            if (!m.Success)
                return false;

            //try
            //{
            var hour = int.Parse(m.Groups["hour"].Value);
            if (hour < 0 || hour > 23)
                return false;

            var minute = int.Parse(m.Groups["minute"].Value);
            if (minute < 0 || minute > 59)
                return false;

            var second = 0;
            if (!string.IsNullOrEmpty(m.Groups["second"].Value))
            {
                second = int.Parse(m.Groups["second"].Value);
                if (second < 0 || second > 59)
                    return false;
            }

            if ("PM".Equals(m.Groups["ampm"].Value, StringComparison.OrdinalIgnoreCase) && hour < 12)
                hour += 12;
            else if ("AM".Equals(m.Groups["ampm"].Value, StringComparison.OrdinalIgnoreCase) && hour == 12)
                hour -= 12;

            var dateTime = new DateTime(1, 1, 1, hour, minute, second);

            if (m.Groups["offset_hh"].Success)
            {
                var offsetHh = int.Parse(m.Groups["offset_hh"].Value);
                var offsetMm = 0;
                if (m.Groups["offset_mm"].Success)
                    offsetMm = int.Parse(m.Groups["offset_mm"].Value);
                var utcOffset = new TimeSpan(offsetHh, offsetMm, 0);
                if (m.Groups["offset_sign"].Value == "-")
                    utcOffset = -utcOffset;
                parsedTime = new ParsedDateTime(-1, -1, m.Index, m.Length, dateTime, utcOffset);
                return true;
            }

            if (m.Groups["time_zone"].Success)
            {
                TimeSpan utcOffset;
                switch (m.Groups["time_zone"].Value)
                {
                    case "UTC":
                    case "GMT":
                        utcOffset = new TimeSpan(0, 0, 0);
                        break;
                    case "CST":
                        utcOffset = new TimeSpan(-6, 0, 0);
                        break;
                    case "EST":
                        utcOffset = new TimeSpan(-5, 0, 0);
                        break;
                    default:
                        throw new Exception("Time zone: " + m.Groups["time_zone"].Value + " is not defined.");
                }
                parsedTime = new ParsedDateTime(-1, -1, m.Index, m.Length, dateTime, utcOffset);
                return true;
            }

            parsedTime = new ParsedDateTime(-1, -1, m.Index, m.Length, dateTime);
            //}
            //catch(Exception e)
            //{
            //    return false;
            //}
            return true;
        }

        /// <summary>
        /// Tries to find date within the passed string and return it as ParsedDateTime object.
        /// It recognizes only date while ignoring time, so time in the returned ParsedDateTime is always 0:0:0.
        /// If year of the date was not found then it accepts the current year.
        /// </summary>
        /// <param name="str">string that contains date</param>
        /// <param name="defaultFormat">format to be used preferably in ambivalent instances</param>
        /// <param name="parsedDate">parsed date output</param>
        /// <returns>true if date was found, else false</returns>
        public static bool TryParseDate(this string str, DateTimeFormat defaultFormat, out ParsedDateTime parsedDate)
        {
            parsedDate = null;

            if (string.IsNullOrEmpty(str))
                return false;

            //look for dd/mm/yy
            var m = Regex.Match(str, @"(?<=^|[^\d])(?'day'\d{1,2})\s*(?'separator'[\\/\.])+\s*(?'month'\d{1,2})\s*\'separator'+\s*(?'year'\d{2}|\d{4})(?=$|[^\d])", RegexOptions.Compiled | RegexOptions.IgnoreCase);
            if (m.Success)
            {
                DateTime date;
                if ((defaultFormat ^ DateTimeFormat.UsaDate) == DateTimeFormat.UsaDate)
                {
                    if (!ConvertToDate(int.Parse(m.Groups["year"].Value), int.Parse(m.Groups["day"].Value), int.Parse(m.Groups["month"].Value), out date))
                        return false;
                }
                else
                {
                    if (!ConvertToDate(int.Parse(m.Groups["year"].Value), int.Parse(m.Groups["month"].Value), int.Parse(m.Groups["day"].Value), out date))
                        return false;
                }
                parsedDate = new ParsedDateTime(m.Index, m.Length, -1, -1, date);
                return true;
            }

            //look for [yy]yy-mm-dd
            m = Regex.Match(str, @"(?<=^|[^\d])(?'year'\d{2}|\d{4})\s*(?'separator'[\-])\s*(?'month'\d{1,2})\s*\'separator'+\s*(?'day'\d{1,2})(?=$|[^\d])", RegexOptions.Compiled | RegexOptions.IgnoreCase);
            if (m.Success)
            {
                if (!ConvertToDate(int.Parse(m.Groups["year"].Value), int.Parse(m.Groups["month"].Value), int.Parse(m.Groups["day"].Value), out var date))
                    return false;
                parsedDate = new ParsedDateTime(m.Index, m.Length, -1, -1, date);
                return true;
            }

            //look for month dd yyyy
            m = Regex.Match(str, @"(?:^|[^\d\w])(?'month'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[uarychilestmbro]*\s+(?'day'\d{1,2})(?:-?st|-?th|-?rd|-?nd)?\s*,?\s*(?'year'\d{4})(?=$|[^\d\w])", RegexOptions.Compiled | RegexOptions.IgnoreCase);
            if (!m.Success)
                //look for dd month [yy]yy
                m = Regex.Match(str, @"(?:^|[^\d\w:])(?'day'\d{1,2})(?:-?st\s+|-?th\s+|-?rd\s+|-?nd\s+|-|\s+)(?'month'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[uarychilestmbro]*(?:\s*,?\s*|-)'?(?'year'\d{2}|\d{4})(?=$|[^\d\w])", RegexOptions.Compiled | RegexOptions.IgnoreCase);
            if (!m.Success)
                //look for yyyy month dd
                m = Regex.Match(str, @"(?:^|[^\d\w])(?'year'\d{4})\s+(?'month'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[uarychilestmbro]*\s+(?'day'\d{1,2})(?:-?st|-?th|-?rd|-?nd)?(?=$|[^\d\w])", RegexOptions.Compiled | RegexOptions.IgnoreCase);
            if (!m.Success)
                //look for month dd hh:mm:ss MDT|UTC yyyy
                m = Regex.Match(str, @"(?:^|[^\d\w])(?'month'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[uarychilestmbro]*\s+(?'day'\d{1,2})\s+\d{2}\:\d{2}\:\d{2}\s+(?:MDT|UTC)\s+(?'year'\d{4})(?=$|[^\d\w])", RegexOptions.Compiled | RegexOptions.IgnoreCase);
            if (!m.Success)
                //look for  month dd [yyyy]
                m = Regex.Match(str, @"(?:^|[^\d\w])(?'month'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[uarychilestmbro]*\s+(?'day'\d{1,2})(?:-?st|-?th|-?rd|-?nd)?(?:\s*,?\s*(?'year'\d{4}))?(?=$|[^\d\w])", RegexOptions.Compiled | RegexOptions.IgnoreCase);
            if (m.Success)
            {
                var month = -1;
                var indexOfDate = m.Index;
                var lengthOfDate = m.Length;

                switch (m.Groups["month"].Value)
                {
                    case "Jan":
                    case "JAN":
                        month = 1;
                        break;
                    case "Feb":
                    case "FEB":
                        month = 2;
                        break;
                    case "Mar":
                    case "MAR":
                        month = 3;
                        break;
                    case "Apr":
                    case "APR":
                        month = 4;
                        break;
                    case "May":
                    case "MAY":
                        month = 5;
                        break;
                    case "Jun":
                    case "JUN":
                        month = 6;
                        break;
                    case "Jul":
                        month = 7;
                        break;
                    case "Aug":
                    case "AUG":
                        month = 8;
                        break;
                    case "Sep":
                    case "SEP":
                        month = 9;
                        break;
                    case "Oct":
                    case "OCT":
                        month = 10;
                        break;
                    case "Nov":
                    case "NOV":
                        month = 11;
                        break;
                    case "Dec":
                    case "DEC":
                        month = 12;
                        break;
                }

                var year = !string.IsNullOrEmpty(m.Groups["year"].Value) ?
                    int.Parse(m.Groups["year"].Value) : DefaultDate.Year;

                if (!ConvertToDate(year, month, int.Parse(m.Groups["day"].Value), out var date))
                    return false;
                parsedDate = new ParsedDateTime(indexOfDate, lengthOfDate, -1, -1, date);
                return true;
            }

            return false;
        }

        private static bool ConvertToDate(int year, int month, int day, out DateTime date)
        {
            if (year >= 100)
            {
                if (year < 1000)
                {
                    date = new DateTime(1, 1, 1);
                    return false;
                }
            }
            else
                if (year > 30)
                year += 1900;
            else
                year += 2000;

            try
            {
                date = new DateTime(year, month, day);
            }
            catch
            {
                date = new DateTime(1, 1, 1);
                return false;
            }
            return true;
        }

        #endregion
    }
}



================================================
FILE: src/DateTimeRoutines/DateTimeRoutines.csproj
================================================
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFrameworks>netstandard2.0;net9.0</TargetFrameworks>
    <LangVersion>9</LangVersion>
    <NoWarn />
    <TreatWarningsAsErrors>false</TreatWarningsAsErrors>
    <WarningsAsErrors />
  </PropertyGroup>
</Project>



================================================
FILE: src/Jackett.Common/ExceptionWithConfigData.cs
================================================
using System;
using Jackett.Common.Models.IndexerConfig;

namespace Jackett.Common
{

    public class ExceptionWithConfigData : Exception
    {
        public ConfigurationData ConfigData { get; private set; }
        public ExceptionWithConfigData(string message, ConfigurationData data)
            : base(message)
        {
            ConfigData = data;
        }
    }
}



================================================
FILE: src/Jackett.Common/IndexerException.cs
================================================
using System;
using Jackett.Common.Indexers;

namespace Jackett.Common
{
    public class IndexerException : Exception
    {
        public IIndexer Indexer { get; protected set; }

        public IndexerException(IIndexer indexer, string message, Exception innerException)
            : base(message, innerException)
        {
            this.Indexer = indexer;
        }

        public IndexerException(IIndexer indexer, string message)
            : this(indexer, message, null)
        {
        }

        public IndexerException(IIndexer indexer, Exception innerException)
            : this(indexer, "Exception (" + indexer.Id + "): " + innerException.GetBaseException().Message, innerException)
        {
        }
    }
}



================================================
FILE: src/Jackett.Common/Jackett.Common.csproj
================================================
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFrameworks>netstandard2.0;net9.0</TargetFrameworks>
    <Version>0.0.0</Version>
    <LangVersion>9</LangVersion>
    <NoWarn />
    <WarningsAsErrors />
    <TreatWarningsAsErrors>false</TreatWarningsAsErrors>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="AngleSharp" Version="1.4.0" />
    <PackageReference Include="AngleSharp.Xml" Version="1.0.0" />
    <PackageReference Include="Autofac" Version="8.0.0" />
    <PackageReference Include="BencodeNET" Version="4.0.0" />
    <PackageReference Include="FlareSolverrSharp" Version="3.0.7" />
    <PackageReference Include="CommandLineParser" Version="2.9.1" />
    <PackageReference Include="DotNet4.SocksProxy" Version="1.4.0.1" />
    <PackageReference Include="Microsoft.AspNetCore.Http" Version="2.3.9" />
    <PackageReference Include="Microsoft.AspNetCore.WebUtilities" Version="2.3.9" />
    <PackageReference Include="Microsoft.CSharp" Version="4.7.0" />
    <PackageReference Include="MimeMapping" Version="1.0.1.50" />
    <PackageReference Include="Newtonsoft.Json" Version="13.0.4" />
    <PackageReference Include="NLog" Version="5.5.1" />
    <PackageReference Include="Polly" Version="8.6.5" />
    <PackageReference Include="SharpZipLib" Version="1.4.2" />
    <PackageReference Include="System.IO.FileSystem.AccessControl" Version="5.0.0" />
    <PackageReference Include="System.ServiceProcess.ServiceController" Version="9.0.13" />
    <PackageReference Include="System.Text.Encoding.CodePages" Version="9.0.13" />
    <PackageReference Include="System.Text.Json" Version="9.0.13" />
    <PackageReference Include="YamlDotNet" Version="16.3.0" />
  </ItemGroup>

  <ItemGroup>
    <Content Include="Content\animate.css">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\binding_dark.png">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\apple-touch-icon.png">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\bootstrap\bootstrap.min.css">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\bootstrap\bootstrap.min.js">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\common.js">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\css\bootstrap-multiselect.css">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\css\font-awesome.min.css">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\css\jquery.dataTables.min.css">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\css\tagify.css">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\custom.css">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\custom.js">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\custom_mobile.css">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\favicon.ico">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\fonts\fontawesome-webfont.svg">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\fonts\glyphicons-halflings-regular.svg">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\images\sort_asc.png">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\images\sort_asc_disabled.png">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\images\sort_both.png">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\images\sort_desc.png">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\images\sort_desc_disabled.png">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\index.html">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\jacket_medium.png">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\libs\api.js">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\libs\bootstrap-multiselect.js">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\libs\bootstrap-notify.js">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\libs\filesize.min.js">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\libs\handlebars.min.js">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\libs\handlebarsextend.js">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\libs\handlebarsmoment.js">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\libs\jquery.dataTables.min.js">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\libs\jquery.min.js">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\libs\jQuery.tagify.min.js">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\libs\moment.min.js">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\libs\tagify.min.js">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Content\login.html">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Resources\validator_reply.xml" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\DateTimeRoutines\DateTimeRoutines.csproj" />
  </ItemGroup>

  <ItemGroup>
    <Content Include="Definitions\**\*.yml">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
  </ItemGroup>

  <ItemGroup>
    <Compile Update="Properties\Resources.Designer.cs">
      <DesignTime>True</DesignTime>
      <AutoGen>True</AutoGen>
      <DependentUpon>Resources.resx</DependentUpon>
    </Compile>
  </ItemGroup>

  <ItemGroup>
    <None Update="Content\fonts\fontawesome-webfont.eot">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </None>
    <None Update="Content\fonts\fontawesome-webfont.ttf">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </None>
    <None Update="Content\fonts\fontawesome-webfont.woff">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </None>
    <None Update="Content\fonts\fontawesome-webfont.woff2">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </None>
    <None Update="Content\fonts\FontAwesome.otf">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </None>
    <None Update="Content\fonts\glyphicons-halflings-regular.eot">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </None>
    <None Update="Content\fonts\glyphicons-halflings-regular.ttf">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </None>
    <None Update="Content\fonts\glyphicons-halflings-regular.woff">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </None>
    <None Update="Content\fonts\glyphicons-halflings-regular.woff2">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </None>
  </ItemGroup>

  <ItemGroup>
    <Service Include="{508349b6-6b84-4df5-91f0-309beebad82d}" />
  </ItemGroup>

  <ItemGroup>
    <EmbeddedResource Update="Properties\Resources.resx">
      <Generator>PublicResXFileCodeGenerator</Generator>
      <LastGenOutput>Resources.Designer.cs</LastGenOutput>
    </EmbeddedResource>
  </ItemGroup>

  <!-- Save the compiled date so that we know if the user is running an old version of Jackett -->
  <ItemGroup>
    <AssemblyAttribute Include="Jackett.Common.Utils.BuildDateAttribute">
      <_Parameter1>$([System.DateTime]::UtcNow.ToString("yyyyMMddHHmmss"))</_Parameter1>
    </AssemblyAttribute>
  </ItemGroup>

</Project>



================================================
FILE: src/Jackett.Common/JackettProtectedAttribute.cs
================================================
using System;

namespace Jackett.Common
{
    public class JackettProtectedAttribute : Attribute
    {
    }
}



================================================
FILE: src/Jackett.Common/Content/common.js
================================================
function getUrlParams() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}



================================================
FILE: src/Jackett.Common/Content/custom.css
================================================
body {
    background-image: url("binding_dark.png");
    background-repeat: repeat;
}

#page {
    border-radius: 6px;
    background-color: white;
    max-width: 900px;
    padding: 20px;
    margin: 30px auto 100px;
}

.container-fluid {
}

#templates {
    display: none;
}

#indexers {
   text-align: center;
   margin-top: 20px;
}

.indexer-table {
   text-align: left;
}

.test-success {
    color: #449d44;
}

.test-error {
    color: #c9302c;
}

.test-inprogress {
    color: #286090;
}

.indexer-buttons {
    text-align: center;
}

.indexer-buttons > .btn {
    margin-bottom: 2px;
}

.indexer-button-test {
   width: 60px;
}

.setup-item-label:empty {
    margin: 1em;
}

.setup-item-inputstring {
    max-width: 255px;
}

.setup-item-password {
    max-width: 255px;
}

.setup-item-inputcheckbox label {
    padding: 0 1.5em;
}

.setup-item-inputcheckbox input {
    height: 20px;
}

.setup-item-inputbool input {
    max-width: 100px;
    height: 20px;
}

.setup-item-inputselect {
    max-width: 255px;
}

.setup-item-inputtags {
    max-width: 255px;
}

[data-type=hiddendata]{
    display: none;
}

.spinner {
    -webkit-animation: spin 2s infinite linear;
    -moz-animation: spin 2s infinite linear;
    -o-animation: spin 2s infinite linear;
    animation: spin 2s infinite linear;
}

@-moz-keyframes spin {
    from {
        -moz-transform: rotate(0deg);
    }

    to {
        -moz-transform: rotate(360deg);
    }
}

@-webkit-keyframes spin {
    from {
        -webkit-transform: rotate(0deg);
    }

    to {
        -webkit-transform: rotate(360deg);
    }
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

#setup-indexer-go {
    width: 70px;
}

hr {
    border-top-color: #cdcdcd;
}

.input-area {
    margin: 4px 0;
}

    .input-area > * {
        vertical-align: middle;
    }

    .input-area > p {
        margin-top: 10px;
    }

.input-header {
    font-size: 16px;
    width: 250px;
    display: inline-block;
}

.input-right {
    width: 300px;
    display: inline-block;
    font-family: monospace;
}

#sonarr-warning {
    display: none;
}

#logo {
    max-width: 50px;
}

#header-title {
    font-size: 34px;
    vertical-align: middle;
    padding-left: 15px;
}

#footer {
    color: #444444;
    margin: 10px auto 0;
    text-align: center;
}

#jackett-allowext, #jackett-allowcors, #jackett-allowupdate, #jackett-logging, #jackett-prerelease, #jackett-cache-enabled {
    width: 25px;
}

.modal-fillwidth {
    width: 1200px;
    min-width:80%;
}

.indexer-caps {
   padding: 0 15px 15px 15px;
   border-top: 1px solid #e5e5e5;
}

.indexer-caps table {
    border-bottom:   1px solid #ddd;
}

.jackettlog-narrowcol {
    width: 1px;
    white-space: nowrap;
    vertical-align: top;
}

.jackettlogWarn {
    background-color: #FFFF8E !important;
}

.jackettlogError {
    background-color: #FF6060 !important;
}

.jackettdownloaded {
    color: blueviolet;
}

.jacketdownloadlocal {
    padding-left: 10px;
}

.downloadcolumn {
    text-align:center;
}

pre {
    display: block;
    padding: 3px;
    margin: 0 0 0;
    font-size: 13px;
    line-height: 1.42857143;
    color: #333;
    background-color: transparent;
    border: 0;
    border-radius: 0;
    word-break: normal;
    white-space: pre-wrap;       /* Since CSS 2.1 */
    white-space: -moz-pre-wrap;  /* Mozilla, since 1999 */
    white-space: -pre-wrap;      /* Opera 4-6 */
    white-space: -o-pre-wrap;    /* Opera 7 */
    word-wrap: break-word;       /* Internet Explorer 5.5+ */
}

.modal-open .modal {
    overflow-x: auto;  /* Model can be bigger than the screen on mobiles */
}

.dataTables_length {
    white-space: nowrap;
}

.dataTables_filter input, select {
    display: inline-block;
    height: 26px;
    padding: 0 8px;
    background-color: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
}

.dataTables_length select {
    width: inherit;
}

.dataTables_filter input {
    width: 400px;
}

.dataTable.compact tfoot td {
    padding: 4px 0;
}

.dataTable.compact tfoot td select {
    height: 26px;
    padding: 0;
}

.dataTables_wrapper .dataTables_paginate .paginate_button {
    padding: 3px 9px !important;
}

#unconfigured-indexers-template {
    display: none;
}
.jackett-apikey{
    margin-top: 10px;
}

.jackett-apikey .input-header{
    width: 80px;
}

.setup-item-displayinfo:empty {
    display: none;
}

table td.fit{
    white-space: nowrap;
    width: 1%;
}

.label-imdb {
    background-color: #d0ab44;
}

.label-tmdb {
    background-color: #7dbfd4;
}

.label-tvdb {
    background-color: #86cca8;
}

.label-tvmaze {
    background-color: #73c3bd;
}

.label-trakt {
    background-color: #ef1e25;
}

.label-douban {
    background-color: #86cc10;
}

.tooltip {
    pointer-events: none;
}

.tooltip-inner {
    max-width: 500px !important;
}

.tooltip-inner img {
    max-width: 250px;
    height: auto;
}

.type-public {
    color: #449d44
}

.type-private {
    color: #c9302c
}

.type-semi-private {
    color: #ec971f
}

.dataTables_deadfilter {
    float: right;
    text-align: right;
    margin-right: 1em;
}

input#searchquery {
	width: 400px;
    display: inline-block;
}

#proxy-warning {
    color: red;
}

.label-tag {
    text-transform: lowercase;
    background-color: #777;
}

.tagify {
    height: auto;
}

.tagify .tagify__input {
    min-width: 0;
    text-transform: lowercase;
}

.tagify .tagify__tag-text {
    text-transform: lowercase;
}

#searchResults .indexers .error{
    color: Tomato;
}

#searchResults .indexers .no-results{
    color: Grey;
}



================================================
FILE: src/Jackett.Common/Content/custom_mobile.css
================================================
body {
    background-image: url("binding_dark.png");
    background-repeat: repeat;
}

#page {
    border-radius: 6px;
    background-color: white;
    max-width: 900px;
    padding: 20px;
    margin: 30px auto;
}

.container-fluid {
}

#templates {
    display: none;
}

#indexers {
   text-align: center;
   margin-top: 20px;
}

.indexer-table {
   text-align: left;
}

.test-success {
    color: #449d44;
}

.test-error {
    color: #c9302c;
}

.test-inprogress {
    color: #286090;
}

.indexer-buttons {
    text-align: center;
}

.indexer-buttons > .btn {
    margin-bottom: 2px;
}

.indexer-button-test {
   width: 60px;
}

.setup-item-inputstring {
    max-width: 255px;
}

.setup-item-password {
    max-width: 255px;
}

.setup-item-inputbool input {
    max-width: 100px;
    height: 20px;
}

.setup-item-inputselect {
    max-width: 255px;
}

[data-type=hiddendata]{
    display: none;
}

.spinner {
    -webkit-animation: spin 2s infinite linear;
    -moz-animation: spin 2s infinite linear;
    -o-animation: spin 2s infinite linear;
    animation: spin 2s infinite linear;
}

@-moz-keyframes spin {
    from {
        -moz-transform: rotate(0deg);
    }

    to {
        -moz-transform: rotate(360deg);
    }
}

@-webkit-keyframes spin {
    from {
        -webkit-transform: rotate(0deg);
    }

    to {
        -webkit-transform: rotate(360deg);
    }
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

#setup-indexer-go {
    width: 70px;
}

hr {
    border-top-color: #cdcdcd;
}

.input-area {
    margin: 4px 0;
}

    .input-area > * {
        vertical-align: middle;
    }

    .input-area > p {
        margin-top: 10px;
    }

.input-header {
    font-size: 16px;
    width: 250px;
    display: inline-block;
}

.input-right {
    width: 300px;
    display: inline-block;
    font-family: monospace;
}

#sonarr-warning {
    display: none;
}

#logo {
    max-width: 50px;
}

#header-title {
    font-size: 34px;
    vertical-align: middle;
    padding-left: 15px;
}

#footer {
    color: #444444;
    margin: 10px auto 0;
    text-align: center;
}

#jackett-allowext, #jackett-allowcors, #jackett-allowupdate, #jackett-logging, #jackett-prerelease, #jackett-cache-enabled {
    width: 25px;
}

.modal-fillwidth {
    width: 100%;
    min-width:80%;
}

.indexer-caps {
   padding: 0 15px 15px 15px;
   border-top: 1px solid #e5e5e5;
}

.indexer-caps table {
    border-bottom:   1px solid #ddd;
}

.jackettlog-narrowcol {
    width: 1px;
    white-space: nowrap;
    vertical-align: top;
}

.jackettlogWarn {
    background-color: #FFFF8E !important;
}

.jackettlogError {
    background-color: #FF6060 !important;
}

.jackettdownloaded {
    color: blueviolet;
}

.jacketdownloadlocal {
    padding-left: 10px;
}

.downloadcolumn {
    text-align:center;
}

pre {
    display: block;
    padding: 3px;
    margin: 0 0 0;
    font-size: 13px;
    line-height: 1.42857143;
    color: #333;
    background-color: transparent;
    border: 0;
    border-radius: 0;
    word-break: normal;
    white-space: pre-wrap;       /* Since CSS 2.1 */
    white-space: -moz-pre-wrap;  /* Mozilla, since 1999 */
    white-space: -pre-wrap;      /* Opera 4-6 */
    white-space: -o-pre-wrap;    /* Opera 7 */
    word-wrap: break-word;       /* Internet Explorer 5.5+ */
}

.modal-open .modal {
    overflow-x: auto;  /* Model can be bigger than the screen on mobiles */
}

.dataTables_length {
    white-space: nowrap;
}

.dataTables_filter input, select {
    display: inline-block;
    height: 26px;
    padding: 0 8px;
    background-color: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
}

.dataTables_length select {
    width: inherit;
}

.dataTables_filter input {
    width: 75%;
}

.dataTable.compact tfoot td {
    padding: 4px 0;
}

.dataTable.compact tfoot td select {
    height: 26px;
    padding: 0;
}

.dataTables_wrapper .dataTables_paginate .paginate_button {
    padding: 3px 9px !important;
}

#unconfigured-indexers-template {
    display: none;
}
.jackett-apikey{
    margin-top: 10px;
}

.jackett-apikey .input-header{
    width: 80px;
}

.setup-item-displayinfo:empty {
    display: none;
}

table td.fit{
    width: 50%;
}

.label-imdb {
    background-color: #d0ab44;
}

.label-tmdb {
    background-color: #7dbfd4;
}

.label-tvdb {
    background-color: #86cca8;
}

.label-tvmaze {
    background-color: #73c3bd;
}

.label-trakt {
    background-color: #ef1e25;
}

.label-douban {
    background-color: #86cc10;
}

.tooltip {
    pointer-events: none;
}

.tooltip-inner {
    max-width: 500px !important;
}

.tooltip-inner img {
    max-width: 250px;
    height: auto;
}

.type-public {
    color: #449d44
}

.type-private {
    color: #c9302c
}

.type-semi-private {
    color: #ec971f
}

.dataTables_deadfilter {
    float: right;
    text-align: right;
    margin-right: 1em;
}
div#jackett-search-results-datatable_wrapper {
    width: 100%;
    overflow-x: scroll;
}
div#unconfigured-indexer-datatable_wrapper {
    width: 100%;
    overflow-x: scroll;
}
div#jackett-releases-datatable_wrapper {
    width: 100%;
    overflow-x: scroll;
}
input#searchquery {
	width: 50%;
    display: inline-block;
}

#proxy-warning {
    color: red;
}

.label-tag {
    text-transform: lowercase;
    background-color: #777;
}

.tagify {
    height: auto;
}

.tagify .tagify__input {
    min-width: 0;
    text-transform: lowercase;
}

.tagify .tagify__tag-text {
    text-transform: lowercase;
}

#searchResults .indexers .error{
    color: Tomato;
}

#searchResults .indexers .no-results{
    color: Grey;
}




================================================
FILE: src/Jackett.Common/Content/index.html
================================================
<!DOCTYPE html>

<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="user-scalable=no, width=device-width, initial-scale=1.0" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta charset="utf-8" />
    <meta name="referrer" content="no-referrer" /> <!-- Don't send referrer when loading third party resources (E.g. Empornium poster images won't load) -->
    <meta name="robots" content="noindex, nofollow"/>
    <link rel="apple-touch-icon" href="../apple-touch-icon.png" />
    <link rel="mask-icon" href="../jackett_medium.png" color="#35c5f4">
    <link rel="icon" type="image/ico" href="../favicon.ico" />
    <link rel='shortcut icon' type='image/x-icon' href='../favicon.ico' />
    <script type="text/javascript" src="../libs/filesize.min.js?changed=2017083001"></script>
    <script type="text/javascript" src="../libs/jquery.min.js?changed=13019"></script>
    <script type="text/javascript" src="../libs/jquery.dataTables.min.js?changed=2017083001" charset="utf8"></script>
    <script type="text/javascript" src="../libs/handlebars.min.js?changed=2017083001"></script>
    <script type="text/javascript" src="../libs/moment.min.js?changed=2017083001"></script>
    <script type="text/javascript" src="../libs/handlebarsmoment.js?changed=20210117"></script>
    <script type="text/javascript" src="../libs/handlebarsextend.js?changed=2017083001"></script>
    <script type="text/javascript" src="../bootstrap/bootstrap.min.js?changed=2017083001"></script>
    <script type="text/javascript" src="../libs/bootstrap-notify.js?changed=2017083001"></script>
    <script type="text/javascript" src="../libs/bootstrap-multiselect.js?changed=20230107001"></script>
    <script type="text/javascript" src="../libs/tagify.min.js?changed=11662"></script>
    <script type="text/javascript" src="../libs/jQuery.tagify.min.js?changed=11662"></script>

    <link rel="stylesheet" type="text/css" href="../bootstrap/bootstrap.min.css?changed=2017083001">
    <link rel="stylesheet" type="text/css" href="../animate.css?changed=2017083001">
    <link rel="stylesheet" type="text/css" href="../css/tagify.css?changed=11662">
    <link rel="stylesheet" type="text/css" href="../custom.css?changed=20240225001" media="only screen and (min-device-width: 480px)">
    <link rel="stylesheet" type="text/css" href="../custom_mobile.css?changed=20240225001" media="only screen and (max-device-width: 480px)">
    <link rel="stylesheet" type="text/css" href="../css/jquery.dataTables.min.css?changed=2017083001">
    <link rel="stylesheet" type="text/css" href="../css/bootstrap-multiselect.css?changed=20230107001" />
    <link rel="stylesheet" type="text/css" href="../css/font-awesome.min.css?changed=2017083001">
    <title>Jackett</title>
</head>
<body>
    <div id="page">

        <img id="logo" src="../jacket_medium.png" alt="Logo" /><span id="header-title">Jackett</span>

        <div class="pull-right jackett-apikey">
            <span class="input-header">API Key: </span>
            <input id="api-key-input" class="form-control input-right" type="text" value="" placeholder="API Key" readonly="">
            <button id="api-key-copy-button" title="Copy API Key to clipboard" class="btn btn-primary btn-xs">
                <span class="glyphicon glyphicon-copy" aria-hidden="true"></span>
            </button>
        </div>
        <hr />

        <div id="warning-external-access" hidden class="alert alert-danger text-center" role="alert">
            <strong>
                <span class="glyphicon glyphicon-alert"></span> Security Risk: Your instance has external access enabled without using an admin password. <span class="glyphicon glyphicon-alert"></span>
              <button id="remind-external-access-button" title="Remind me again later" class="btn btn-success btn-xs">
                  <span class="glyphicon glyphicon-hourglass" aria-hidden="true"></span>
              </button>
              <button id="dismiss-external-access-button" title="Do not show again" class="btn btn-danger btn-xs">
                  <span class="glyphicon glyphicon-eye-close" aria-hidden="true"></span>
              </button>
            </strong>
        </div>

        <div id="can-upgrade-from-mono" hidden class="alert alert-info" role="alert">
            <strong>Standalone version of Jackett is now available - Mono not required</strong> <br>
            To upgrade to the standalone version of Jackett, <a href="https://github.com/Jackett/Jackett#install-on-linux-amdx64" target="_blank" class="alert-link">click here</a> for install instructions.
            Upgrading is straight forward, simply install the standalone version and your indexers/configuration will carry over.
            Benefits include: increased performance, improved stability and no dependency on Mono.
        </div>

        <div class="pull-right">
            <div id="filters" class="btn-group btn-group-sm">
            </div>
            <button id="jackett-add-indexer" class="btn btn-success btn-sm">
                <span class="glyphicon glyphicon-plus" aria-hidden="true"></span> Add indexer
            </button>
            <button id="jackett-show-search" class="btn btn-success btn-sm">
                <span class="glyphicon glyphicon-search" aria-hidden="true"></span> Manual Search
            </button>
            <button id="jackett-show-releases" class="btn btn-primary btn-sm">
                <i class="fa fa-database"></i>  View cached releases
            </button>
            <button id="jackett-test-all" class="btn btn-warning btn-sm">
                <span class="glyphicon glyphicon-screenshot" aria-hidden="true"></span> Test All
            </button>
        </div>
        <h3>Configured Indexers</h3>
        <div id="indexers"></div>
        <hr />

        <div class="input-area">
            <h4>Adding a Jackett indexer in Sonarr or Radarr</h4>
            <ol>
                <li>Go to <b>Settings > Indexers > Add > Torznab > Custom</b>.</li>
                <li>Click on the indexers corresponding <button type="button" class="disabled btn btn-xs btn-info">Copy Torznab Feed</button> button and paste it into the Sonarr/Radarr <b>URL</b> field.</li>
                <li>For the <b>API key</b> use <b class="api-key-text"></b>.</li>
                <li>Configure the correct category IDs via the <b>(Anime) Categories</b> options. See the Jackett indexer configuration for a list of supported categories.</li>
            </ol>
            <h4>Adding a Jackett indexer in CouchPotato</h4>
            <ol>
                <li>Go to <b>Settings > Searchers</b>.</li>
                <li>Enable <b>TorrentPotato</b>.
                <li>Click on the indexers corresponding <button type="button" class="disabled btn btn-xs btn-info">Copy Potato Feed</button> button and paste it into the CouchPotato <b>host</b> field.</li>
                <li>For the <b>Passkey</b> use <b class="api-key-text"></b>. Leave the <b>username</b> field blank.</li>
            </ol>
            <h4>Adding a Jackett indexer to RSS clients (RSS feed)</h4>
            <ol>
                <li>Click on the indexers corresponding <button type="button" class="disabled btn btn-xs btn-info">Copy RSS Feed</button> button and paste it into the URL field of the RSS client.</li>
                <li>
                    You can adjust the <b>q</b> (search string) and <b>cat</b> (categories) arguments accordingly.
                    E.g. <b>...&cat=2030,2040&q=big+buck+bunny</b> will search for "big buck bunny" in the Movies/SD (2030) and Movies/HD (2040) categories (See the indexer configuration for available categories).
                </li>
            </ol>
        </div>
        <hr />
        <h3>Jackett Configuration</h3>
        <div class="text-center">
            <div class="btn-toolbar">
                <button id="change-jackett-port" class="btn btn-primary btn-sm">
                    <i class="fa fa-wrench"></i>   Apply server settings <span class="glyphicon glyphicon-ok-wrench" aria-hidden="true"></span>
                </button>
                <button id="view-jackett-logs" class="btn btn-success btn-sm">
                    <i class="fa fa-rss"></i> View logs <span class="glyphicon glyphicon-ok-wrench" aria-hidden="true"></span>
                </button>
                <button id="trigger-updater" class="btn btn-warning btn-sm">
                    <i class="fa fa-wrench"></i>   Check for updates <span class="glyphicon glyphicon-ok-wrench" aria-hidden="true"></span>
                </button>
            </div>
        </div>
        <br />
        <div class="input-area">
            <span class="input-header">Admin password: </span>
            <input id="jackett-adminpwd" class="form-control input-right" type="password" value="" placeholder="Blank to disable" />
            <button id="change-jackett-password" class="btn btn-primary btn-sm">
                <i class="fa fa-user-secret"></i>  Set Password <span class="glyphicon glyphicon-ok-wrench" aria-hidden="true"></span>
            </button>
            <a href="Dashboard?logout=true" id="logoutBtn" style="display:none" class="btn btn-danger btn-sm">
                Logout
            </a>
        </div>
        <div class="input-area">
            <span class="input-header">Base path override: </span>
            <input id="jackett-basepathoverride" class="form-control input-right" type="text" value="" placeholder="/jackett">
        </div>
        <div class="input-area">
            <span class="input-header">Base URL override: </span>
            <input id="jackett-baseurloverride" class="form-control input-right" type="url" value="" placeholder="http://jackett:9117">
        </div>
        <div class="input-area">
            <span class="input-header">Server port: </span>
            <input id="jackett-port" class="form-control input-right" type="text" value="" placeholder="9117">
        </div>
        <div class="input-area">
            <span class="input-header">Blackhole directory: </span>
            <input id="jackett-savedir" class="form-control input-right" type="text" value="" placeholder="c:\torrents\">
        </div>

        <div class="input-area">
            <span class="input-header">Proxy type: </span>
            <select id="jackett-proxy-type" class="form-control input-right">
                <option value="-1">Disabled</option>
                <option value="0">HTTP</option>
                <option value="1">SOCKS4</option>
                <option value="2">SOCKS5</option>
            </select>
        </div>
        <div id="proxy-warning" hidden>
            <span>
                WARNING: The proxy option potentially leaks requests. Recommendation is to use a VPN.
            </span>
        </div>
        <div class="input-area">
            <span class="input-header">Proxy URL: </span>
            <input id="jackett-proxy-url" class="form-control input-right" type="text" value="" placeholder="">
        </div>
        <div class="input-area">
            <span class="input-header">Proxy port: </span>
            <input id="jackett-proxy-port" class="form-control input-right" type="text" value="" placeholder="">
        </div>
        <div class="input-area">
            <span class="input-header">Proxy username: </span>
            <input id="jackett-proxy-username" class="form-control input-right" type="text" value="" placeholder="">
        </div>
        <div class="input-area">
            <span class="input-header">Proxy password: </span>
            <input id="jackett-proxy-password" class="form-control input-right" type="password" value="" placeholder="">
        </div>

        <div class="input-area">
            <span class="input-header">External access: </span>
            <input id="jackett-allowext" class="form-control input-right" type="checkbox" />
        </div>
        <div class="input-area">
            <span class="input-header">Local bind address: </span>
            <input id="jackett-local-bind-address" class="form-control input-right" type="text" value="" placeholder="127.0.0.1">
        </div>
        <div class="input-area">
            <span class="input-header">Allow CORS: </span>
            <input id="jackett-allowcors" class="form-control input-right" type="checkbox" />
        </div>
        <div class="input-area">
            <span class="input-header">Disable auto update: </span>
            <input id="jackett-allowupdate" class="form-control input-right" type="checkbox" />

        </div>
        <div class="input-area">
            <span class="input-header">Update to pre-release: </span>
            <input id="jackett-prerelease" class="form-control input-right" type="checkbox" />

        </div>
        <div class="input-area">
            <span class="input-header">Enhanced logging: </span>
            <input id="jackett-logging" class="form-control input-right" type="checkbox" />
        </div>
        <div class="input-area">
            <span class="input-header">Cache enabled (recommended): </span>
            <input id="jackett-cache-enabled" class="form-control input-right" type="checkbox" />
        </div>
        <div class="input-area">
            <span class="input-header">Cache TTL (seconds): </span>
            <input id="jackett-cache-ttl" class="form-control input-right" type="text" value="" placeholder="2100">
        </div>
        <div class="input-area">
            <span class="input-header">Cache max results per indexer: </span>
            <input id="jackett-cache-max-results-per-indexer" class="form-control input-right" type="text" value="" placeholder="1000">
        </div>
        <div class="input-area">
          <span class="input-header">FlareSolverr API URL: </span>
          <input id="jackett-flaresolverrurl" class="form-control input-right" type="url" value="" placeholder="Blank for default">
        </div>
        <div class="input-area">
          <span class="input-header">FlareSolverr Max Timeout (ms): </span>
          <input id="jackett-flaresolverr-maxtimeout" class="form-control input-right" type="text" value="" placeholder="55000">
        </div>
        <div class="input-area">
            <span class="input-header">OMDB API key: </span>
            <input id="jackett-omdbkey" class="form-control input-right" type="text" value="" placeholder="">
        </div>
        <div class="input-area">
            <span class="input-header">OMDB API Url: </span>
            <input id="jackett-omdburl" class="form-control input-right" type="text" value="" placeholder="Blank for default">
        </div>
        <hr />
        <div id="footer">
            <a href="https://github.com/Jackett/Jackett" target="_blank" title="Jackett on GitHub">Jackett</a> Version <span id="app-version"></span>
        </div>
    </div>

    <div id="modals"></div>

    <script id="setup-item" type="text/x-handlebars-template">
        <div class="setup-item form-filter" data-id="{{id}}" data-value="{{value}}" data-type="{{type}}">
            <div class="setup-item-label">{{name}}</div>
            <div class="setup-item-value">{{{value_element}}}</div>
        </div>
    </script>
    <script id="setup-item-inputstring" type="text/x-handlebars-template">
        <div class="setup-item-inputstring">
            {{#if ispassword}}
            <input class="form-control" type="password" value="{{value}}" />
            {{else}}
            <input class="form-control" type="text" value="{{value}}" />
            {{/if}}
        </div>
    </script>
    <script id="setup-item-password" type="text/x-handlebars-template">
        <div class="setup-item-password">
            <input class="form-control" type="password" value="{{value}}" />
        </div>
    </script>
    <script id="setup-item-inputbool" type="text/x-handlebars-template">
        <div class="setup-item-inputbool">
            {{#if value}}
            <input type="checkbox" data-id="{{id}}" class="form-control" checked />
            {{else}}
            <input type="checkbox" data-id="{{id}}" class="form-control" />
            {{/if}}
        </div>
    </script>
    <script id="setup-item-inputcheckbox" type="text/x-handlebars-template">
        <div class="setup-item-inputcheckbox">
            {{#each options}}
            <div class="checkbox"><label>
            {{#if_in @key ../values}}
            <input type="checkbox" data-id="{{../../id}}" class="form-control" value="{{@key}}" checked />
            {{else}}
            <input type="checkbox" data-id="{{../../id}}" class="form-control" value="{{@key}}" />
            {{/if_in}}
            {{this}}</label></div>
            {{/each}}
        </div>
    </script>
    <script id="setup-item-inputselect" type="text/x-handlebars-template">
        <div class="setup-item-inputselect">
            <select class="form-control" data-id="{{id}}">
                {{#each options}}
                {{#ifCond ../value @key}}
                <option value="{{@key}}" selected>{{this}}</option>
                {{else}}
                <option value="{{@key}}">{{this}}</option>
                {{/ifCond}}
                {{/each}}
            </select>
        </div>
    </script>
    <script id="setup-item-displayimage" type="text/x-handlebars-template">
        <img class="setup-item-displayimage" src="{{{value}}}" alt="No image available" />
    </script>
    <script id="setup-item-displayinfo" type="text/x-handlebars-template">
        <div class="setup-item-displayinfo alert alert-info" role="alert">{{{value}}}</div>
    </script>
    <script id="setup-item-hiddendata" type="text/x-handlebars-template">
        <div class="setup-item-hiddendata">
            <input class="form-control" type="text" value="{{value}}" />
        </div>
    </script>
    <script id="setup-item-alternativesitelinks" type="text/x-handlebars-template">
        <div class="setup-item-alternativesitelinks alert alert-info" role="alert">
            This indexer has multiple known URLs:
            <ul>
                {{#each alternativesitelinks}}
                <li><a target="_blank" href="{{this}}" class="alternativesitelink">{{this}}</a></li>
                {{/each}}
            </ul>
            Click on a URL to load it into the Site Link field.
        </div>
    </script>
    <script id="setup-item-inputtags" type="text/x-handlebars-template">
      <div class="setup-item-inputtags">
        <input class="form-control input-sm" type="text" value="{{{value}}}" {{#if pattern}} pattern="{{pattern}}"{{/if}}/>
      </div>
    </script>

    <script id="configured-indexer-table" type="text/x-handlebars-template">
        <div class="tab-content configured-indexer-div">
            <table id="configured-indexer-datatable" class="indexer-table dataTable compact cell-border hover stripe table table-responsive" style="width: 100%">
                <thead>
                    <tr>
                        <th>Indexer</th>
                        <th>Actions</th>
                        <th data-type="hiddendata">URL</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each indexers}}
                    <tr class="configured-indexer-row">
                        <td><a target="_blank" href="{{site_link}}" title="{{description}}">{{name}}</a> <span title="{{type}}" class="label label-{{type_label}}" style="text-transform: capitalize;">{{type}}</span>{{#each tags}} <span title="{{this}}" class="label label-tag">{{this}}</span>{{/each}}</td>
                        <td class="fit">
                            <div class="indexer-buttons">
                                <a href="{{rss_host}}" title="{{rss_host}}" role="button" class="indexer-button-copy btn btn-xs btn-info">Copy RSS Feed</i></a>
                                <a href="{{torznab_host}}" title="{{torznab_host}}" role="button" class="indexer-button-copy btn btn-xs btn-info">Copy Torznab Feed</a>
                                <a href="{{potato_host}}" title="{{potato_host}}" role="button" class="indexer-button-copy btn btn-xs btn-info{{#unless potatoenabled}} disabled{{/unless}}">Copy Potato Feed</a>

                                <button title="Search" class="btn btn-success btn-xs indexer-button-search" data-id="{{id}}">
                                    <span class="glyphicon glyphicon-search" aria-hidden="true"></span>
                                </button>
                                <button title="Configure" class="btn btn-primary btn-xs indexer-setup" data-id="{{id}}" data-link="{{site_link}}">
                                    <span class="glyphicon glyphicon-wrench" aria-hidden="true"></span>
                                </button>
                                <button title="Delete" class="btn btn-danger btn-xs indexer-button-delete" data-id="{{id}}">
                                    <span class="glyphicon glyphicon-trash" aria-hidden="true"></span>
                                </button>
                                <button title="{{last_error}}" class="btn btn-warning btn-xs indexer-button-test" data-toggle="tooltip" data-id="{{id}}" data-state="{{state}}">
                                    Test
                                    <span class="glyphicon" aria-hidden="true"></span>
                                </button>
                            </div>
                        </td>
                        <td data-type="hiddendata">{{site_link}}</td>
                    </tr>
                    {{/each}}
                </tbody>
                <tfoot>
                    <tr>
                      <th></th>
                      <th></th>
                      <th data-type="hiddendata"></th>
                    </tr>
                </tfoot>
            </table>
        </div>
    </script>

    <script id="unconfigured-indexer-table" type="text/x-handlebars-template">
        <div class="unconfigured-indexer-div">
            <table id="unconfigured-indexer-datatable" class="indexer-table dataTable compact cell-border hover stripe table table-responsive" style="width: 100%">
                <thead>
                    <tr>
                        <th></th>
                        <th>Indexer</th>
                        <th>Categories</th>
                        <th>Type</th>
                        <th data-type="hiddendata">Type string</th>
                        <th>Language</th>
                        <th></th>
                        <th data-type="hiddendata">URL</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each indexers}}
                    <tr class="unconfigured-indexer-row">
                        <td class="checkboxColumn">
                            {{#if_eq type "public"}}
                            <input type="checkbox" id="select{{id}}" data-id="{{id}}" />
                            {{/if_eq}}
                        </td>
                        <td><a target="_blank" href="{{site_link}}" title="{{description}}">{{name}}</a></td>
                        <td>{{mains_cats}}</td>
                        <td class="fit"><span title="{{type}}" class="label label-{{type_label}}" style="text-transform: capitalize;">{{type}}</span></td>
                        <td data-type="hiddendata">{{type}}</td>
                        <td class="fit">{{language}}</td>
                        <td class="fit">
                            <div class="indexer-buttons">
                                <button title="Configure" class="btn btn-primary btn-xs indexer-setup" data-id="{{id}}" data-link="{{site_link}}">
                                    <span class="glyphicon glyphicon-wrench" aria-hidden="true"></span>
                                </button>
                                {{#if_eq type "public"}}
                                <button title="Add" class="btn btn-success btn-xs indexer-add" data-id="{{id}}" data-link="{{site_link}}">
                                    <span class="glyphicon glyphicon-plus" aria-hidden="true"></span>
                                </button>
                                {{/if_eq}}
                            </div>
                        </td>
                        <td data-type="hiddendata">{{site_link}}</td>
                    </tr>
                    {{/each}}
                </tbody>
                <tfoot>
                    <tr>
                        <th></th>
                        <th>Indexer</th>
                        <th>Categories</th>
                        <th>Type</th>
                        <th data-type="hiddendata">Type string</th>
                        <th>Language</th>
                        <th></th>
                        <th data-type="hiddendata">URL</th>
                    </tr>
                </tfoot>
            </table>
        </div>
    </script>

    <script id="jackett-releases" type="text/x-handlebars-template">
        <div id="select-indexer-modal" class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-fillwidth">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                        <h4 class="modal-title">Cached Releases</h4>
                    </div>
                    <div class="modal-body">
                        <p>This screen shows releases which have been recently returned from Jackett. Only the last 300 releases for each tracker are returned.</p>
                        <table id="jackett-releases-datatable" class="dataTable compact cell-border hover stripe">
                            <thead>
                                <tr>
                                    <th>Published</th>
                                    <th>First Seen</th>
                                    <th>Published</th>
                                    <th>First Seen</th>
                                    <th>Tracker</th>
                                    <th>Name</th>
                                    <th>Size</th>
                                    <th>Size</th>
                                    <th title="Files">F</th>
                                    <th>Category</th>
                                    <th title="Grabs">G</th>
                                    <th title="Seeders">S</th>
                                    <th title="Leechers">L</th>
                                    <th title="DownloadVolumeFactor" class="fit">DLF</th>
                                    <th title="UploadVolumeFactor" class="fit">ULF</th>
                                    <th title="Download">DL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {{#each releases}}
                                <tr class="jackett-releases-row" data-imdb="{{Imdb}}" data-tmdb="{{TMDb}}" data-tvdb="{{TVDBId}}" data-tvmaze="{{TVMazeId}}" data-trakt="{{TraktId}}" data-douban="{{DoubanId}}" data-poster="{{Poster}}" data-description="{{Description}}">
                                    <td class="fit">{{PublishDate}}</td>
                                    <td class="fit">{{FirstSeen}}</td>
                                    <td class="fit">{{jacketTimespan PublishDate}}</td>
                                    <td class="fit">{{jacketTimespan FirstSeen}}</td>
                                    <td class="fit">{{Tracker}}</td>
                                    <td class="Title" style="word-break: break-all">
                                        {{#if Details}}<a href="{{Details}}" target="_blank">{{Title}}</a>{{else}}{{Title}}{{/if}} <span class="release-labels"></span>
                                    </td>
                                    <td class="fit">{{Size}}</td>
                                    <td class="fit">{{jacketSize Size}}</td>
                                    <td class="fit">{{Files}}</td>
                                    <td class="fit Cat" style="word-break: break-all">{{CategoryDesc}}</td>
                                    <td class="fit">{{Grabs}}</td>
                                    <td class="fit">{{Seeders}}</td>
                                    <td class="fit">{{Peers}}</td>
                                    <td class="fit DownloadVolumeFactor">{{DownloadVolumeFactor}}</td>
                                    <td class="fit UploadVolumeFactor">{{UploadVolumeFactor}}</td>
                                    <td class="fit downloadcolumn">
                                        {{#if Link}}
                                        <a class="downloadlink" title="Download locally" href="{{Link}}"><i class="fa fa-download"></i></a>
                                        {{/if}}
                                        {{#if MagnetUri}}
                                        <a class="downloadlink" title="Download locally (magnet)" href="{{MagnetUri}}"><i class="fa fa-magnet"></i></a>
                                        {{/if}}
                                        {{#if BlackholeLink}}
                                        <a class="downloadlink jacketdownloadserver" title="Save to server blackhole directory" href="{{BlackholeLink}}"><i class="fa fa-upload"></i></a>
                                        {{/if}}
                                    </td>
                                </tr>
                                {{/each}}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    </script>

    <script id="jackett-search" type="text/x-handlebars-template">
        <div id="select-indexer-modal" class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-fillwidth">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                        <h4 class="modal-title">Manual search</h4>
                    </div>
                    <div class="modal-body">
                        <p>You can search all configured indexers from this screen.</p>
                        <label for="searchquery">Query</label>
                        <input class="form-control" type="text" name="query" id="searchquery" />
                        {{#if filters}}
                        <label for="searchFilter">Filter</label>
                        <select name="filter" id="searchFilter">
                          <option value="all">all</option>
                          {{#each filters}}
                          <option value="{{id}}">{{id}}</option>
                          {{/each}}
                        </select>
                        {{/if}}
                        <label for="searchTracker">Tracker</label>
                        <select name="tracker" id="searchTracker" multiple="multiple"></select>
                        <label for="searchCategory">Category</label>
                        <select name="category" id="searchCategory" multiple="multiple"></select>
                        <button id="jackett-search-perform" class="btn btn-success btn-sm"><span class="fa fa-search"></span></button>
                        <div id="searchResults"></div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    </script>

    <script id="jackett-search-results" type="text/x-handlebars-template">
        <hr />
        <span class="indexers">Your search was done using:
        {{#each Indexers}}
            <span
            {{#if Error}}
                class="error"
            {{else}}
                {{#ifCond Results 0}}
                class="no-results"
                {{/ifCond}}
            {{/if}}
            >
            {{Name}}
            {{#if Error}}
                (<span title="{{Error}}"<b>Error</b></span>)
            {{~else~}}
                ({{~Results~}})
                {{#if ElapsedTime}}
                    <span title="Elapsed time">[{{~ElapsedTime~}}ms]</span>
                {{~else~}}
                    <span title="Elapsed time">[cache]</span>
                {{~/if~}}
            {{~/if~}}
            {{~#if @last~}}
                    .
                {{~else~}}
                    ,
            {{~/if~}}
            </span>
        {{/each}}
        </p>
        <datalist id="jackett-search-saved-presets"></datalist>
        <table id="jackett-search-results-datatable" class="dataTable compact cell-border hover stripe">
            <thead>
                <tr>
                    <th class="text-center">Published</th>
                    <th class="text-center">Published</th>
                    <th class="text-center">Tracker</th>
                    <th>Name</th>
                    <th class="text-center">Size</th>
                    <th class="text-center">Size</th>
                    <th class="text-center" title="Files">F</th>
                    <th class="text-center">Category</th>
                    <th class="text-center" title="Grabs">G</th>
                    <th class="text-center" title="Seeders">S</th>
                    <th class="text-center" title="Leechers">L</th>
                    <th class="text-center fit" title="DownloadVolumeFactor">DLF</th>
                    <th class="text-center fit" title="UploadVolumeFactor">ULF</th>
                    <th class="text-center" title="Download">DL</th>
                </tr>
            </thead>
            <tbody>
                {{#each Results}}
                <tr class="jackett-search-results-row" data-imdb="{{Imdb}}" data-tmdb="{{TMDb}}" data-tvdb="{{TVDBId}}" data-tvmaze="{{TVMazeId}}" data-trakt="{{TraktId}}" data-douban="{{DoubanId}}" data-poster="{{Poster}}" data-description="{{Description}}">
                    <td class="text-center">{{PublishDate}}</td>
                    <td class="text-center" title="{{dateFormat PublishDate format="YYYY-MM-DD HH:mm:ss Z"}}">{{jacketTimespan PublishDate}}</td>
                    <td class="text-center">{{Tracker}}</td>
                    <td class="Title" style="word-break: break-all">
                        {{#if Details}}<a href="{{Details}}" target="_blank">{{Title}}</a>{{else}}{{Title}}{{/if}} <span class="release-labels"></span>
                    </td>
                    <td class="text-right">{{Size}}</td>
                    <td class="text-right fit">{{jacketSize Size}}</td>
                    <td class="text-center">{{Files}}</td>
                    <td class="text-center Cat" style="word-break: break-all">{{CategoryDesc}}</td>
                    <td class="text-center">{{Grabs}}</td>
                    <td class="text-center">{{Seeders}}</td>
                    <td class="text-center">{{Peers}}</td>
                    <td class="text-center DownloadVolumeFactor">{{DownloadVolumeFactor}}</td>
                    <td class="text-center UploadVolumeFactor">{{UploadVolumeFactor}}</td>
                    <td class="text-center downloadcolumn">
                        {{#if Link}}
                        <a class="downloadlink" title="Download locally" href="{{Link}}"><i class="fa fa-download"></i></a>
                        {{/if}}
                        {{#if MagnetUri}}
                        <a class="downloadlink" title="Download locally (magnet)" href="{{MagnetUri}}"><i class="fa fa-magnet"></i></a>
                        {{/if}}
                        {{#if BlackholeLink}}
                        <a class="downloadlink jacketdownloadserver" title="Save to server blackhole directory" href="{{BlackholeLink}}"><i class="fa fa-upload"></i></a>
                        {{/if}}
                    </td>
                </tr>
                {{/each}}
            </tbody>
            <tfoot>
                <tr>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    </script>
    <script id="select-indexer" type="text/x-handlebars-template">
        <div id="select-indexer-modal" class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                        <h4 class="modal-title">Select an indexer to setup</h4>
                    </div>
                    <div class="modal-body">
                        <div id="unconfigured-indexers">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" id="add-selected-indexers" class="btn btn-default">Add Selected</button>
                        <button type="button" id="close-selected-indexers" class="btn btn-default"
                            data-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    </script>

    <script id="jackett-logs" type="text/x-handlebars-template">
        <div id="select-indexer-modal" class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-fillwidth">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                        <h4 class="modal-title">Server Logs</h4>
                    </div>
                    <div class="modal-body">
                        <table class="dataTable compact cell-border hover stripe">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Level</th>
                                    <th>Message</th>
                                </tr>
                            </thead>
                            <tbody>
                                {{#each logs}}
                                <tr class="jackettlog{{Level}}">
                                    <td class="jackettlog-narrowcol">{{dateFormat When}}</td>
                                    <td class="jackettlog-narrowcol">{{Level}}</td>
                                    <td><pre>{{Message}}</pre></td>
                                </tr>
                                {{/each}}
                            </tbody>
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    </script>

    <script id="jackett-config-setup-modal" type="text/x-handlebars-template">
        <div class="config-setup-modal modal fade" tabindex="-1" role="dialog" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                        <h4 class="modal-title">{{title}} - <a target="_blank" href="{{link}}" rel="noreferrer">{{link}}</a></h4>
                        {{#if description}}
                        <div class="alert alert-info">{{description}}</div>
                        {{/if}}
                    </div>
                    <div class="modal-body">
                        <form class="config-setup-form"></form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary setup-indexer-go">Okay</button>
                    </div>
                    <div class="indexer-caps">
                        <h4>Capabilities</h4>
                        <table class="dataTable compact cell-border hover stripe">
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {{#each caps}}
                                <tr>
                                    <td>{{ID}}</td>
                                    <td>{{Name}}</td>
                                </tr>
                                {{/each}}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </script>

    <script id="jackett-filters" type="text/x-handlebars-template">
        <button id="jackett-filters-dropdown" type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Filter <span class="caret"></span>
        </button>
        <ul class="dropdown-menu" aria-labelledby="jackett-filters-dropdown">
            <li class="{{#if_eq active null}}active{{/if_eq}}"><a href="#">All</a></li>
            {{#each filters}}
            <li class="{{#if_eq ../active id}}active{{/if_eq}}"><a href="#indexers&filter={{id}}" data-id="{{id}}">{{id}}</a></li>
            {{/each}}
        </ul>
    </script>

    <script id="spinner" type="text/x-handlebars-template">
        <span class="spinner glyphicon glyphicon-refresh"></span>
    </script>

    <script id="search-button-ready" type="text/x-handlebars-template">
        <span class="fa fa-search"></span>
    </script>

    <script type="text/javascript" src="../libs/api.js?changed=2017083001"></script>
    <script type="text/javascript" src="../custom.js?changed=20240420v1"></script>
</body>
</html>



================================================
FILE: src/Jackett.Common/Content/login.html
================================================
<!DOCTYPE html>

<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8" />
    <meta name="robots" content="noindex, nofollow"/>

    <link rel='shortcut icon' type='image/x-icon' href='../favicon.ico' />

    <script src="../libs/jquery.min.js"></script>
    <script src="../libs/jquery.dataTables.min.js"></script>
    <script src="../libs/handlebars.min.js"></script>
    <script src="../libs/moment.min.js"></script>
    <script src="../libs/handlebarsmoment.js"></script>
    <script src="../bootstrap/bootstrap.min.js"></script>
    <script src="../libs/bootstrap-notify.js"></script>

    <link href="../bootstrap/bootstrap.min.css" rel="stylesheet">
    <link href="../animate.css" rel="stylesheet">
    <link href="../custom.css?changed=20220721002" rel="stylesheet">

    <title>Jackett</title>
</head>
<body>
    <div id="page">

        <img id="logo" src="../jacket_medium.png" /><span id="header-title">Jackett</span>

        <hr />
        <h1>Login</h1>
        <form action="Dashboard" method="post">
            <div class="input-area">
                <span class="input-header">Admin password</span>
                <input id="password" name="password" class="form-control input-right" type="password">
            </div>
            <div class="input-area">
               <input type="submit" value="Login" />
            </div>
        </form>
    </div>
</body>
</html>



================================================
FILE: src/Jackett.Common/Content/css/bootstrap-multiselect.css
================================================
span.multiselect-native-select{position:relative}span.multiselect-native-select select{border:0!important;clip:rect(0 0 0 0)!important;height:1px!important;margin:-1px -1px -1px -3px!important;overflow:hidden!important;padding:0!important;position:absolute!important;width:1px!important;left:50%;top:30px}.multiselect-container{position:absolute;list-style-type:none;margin:0;padding:0}.multiselect-container .input-group{margin:5px}.multiselect-container .multiselect-reset .input-group{width:93%}.multiselect-container>li{padding:0}.multiselect-container>li>a.multiselect-all label{font-weight:700}.multiselect-container>li.multiselect-group label{margin:0;padding:3px 20px;height:100%;font-weight:700}.multiselect-container>li.multiselect-group-clickable label{cursor:pointer}.multiselect-container>li>a{padding:0}.multiselect-container>li>a>label{margin:0;height:100%;cursor:pointer;font-weight:400;padding:3px 20px 3px 40px}.multiselect-container>li>a>label.checkbox,.multiselect-container>li>a>label.radio{margin:0}.multiselect-container>li>a>label>input[type=checkbox]{margin-bottom:5px}.btn-group>.btn-group:nth-child(2)>.multiselect.btn{border-top-left-radius:4px;border-bottom-left-radius:4px}.form-inline .multiselect-container label.checkbox,.form-inline .multiselect-container label.radio{padding:3px 20px 3px 40px}.form-inline .multiselect-container li a label.checkbox input[type=checkbox],.form-inline .multiselect-container li a label.radio input[type=radio]{margin-left:-20px;margin-right:0}



================================================
FILE: src/Jackett.Common/Content/css/tagify.css
================================================
:root{--tagify-dd-color-primary:rgb(53,149,246);--tagify-dd-bg-color:white}.tagify{--tags-border-color:#DDD;--tags-hover-border-color:#CCC;--tags-focus-border-color:#3595f6;--tag-bg:#E5E5E5;--tag-hover:#D3E2E2;--tag-text-color:black;--tag-text-color--edit:black;--tag-pad:0.3em 0.5em;--tag-inset-shadow-size:1.1em;--tag-invalid-color:#D39494;--tag-invalid-bg:rgba(211, 148, 148, 0.5);--tag-remove-bg:rgba(211, 148, 148, 0.3);--tag-remove-btn-color:black;--tag-remove-btn-bg:none;--tag-remove-btn-bg--hover:#c77777;--input-color:inherit;--tag--min-width:1ch;--tag--max-width:auto;--tag-hide-transition:0.3s;--placeholder-color:rgba(0, 0, 0, 0.4);--placeholder-color-focus:rgba(0, 0, 0, 0.25);--loader-size:.8em;display:flex;align-items:flex-start;flex-wrap:wrap;border:1px solid #ddd;border:1px solid var(--tags-border-color);padding:0;line-height:normal;cursor:text;outline:0;position:relative;box-sizing:border-box;transition:.1s}@keyframes tags--bump{30%{transform:scale(1.2)}}@keyframes rotateLoader{to{transform:rotate(1turn)}}.tagify:hover{border-color:#ccc;border-color:var(--tags-hover-border-color)}.tagify.tagify--focus{transition:0s;border-color:#3595f6;border-color:var(--tags-focus-border-color)}.tagify[readonly]:not(.tagify--mix){cursor:default}.tagify[readonly]:not(.tagify--mix)>.tagify__input{visibility:hidden;width:0;margin:5px 0}.tagify[readonly]:not(.tagify--mix) .tagify__tag>div{padding:.3em .5em;padding:var(--tag-pad)}.tagify[readonly]:not(.tagify--mix) .tagify__tag>div::before{background:linear-gradient(45deg,var(--tag-bg) 25%,transparent 25%,transparent 50%,var(--tag-bg) 50%,var(--tag-bg) 75%,transparent 75%,transparent) 0/5px 5px;box-shadow:none;filter:brightness(.95)}.tagify[readonly] .tagify__tag__removeBtn{display:none}.tagify--loading .tagify__input>br:last-child{display:none}.tagify--loading .tagify__input::before{content:none}.tagify--loading .tagify__input::after{content:'';vertical-align:middle;opacity:1;width:.7em;height:.7em;width:var(--loader-size);height:var(--loader-size);border:3px solid;border-color:#eee #bbb #888 transparent;border-radius:50%;animation:rotateLoader .4s infinite linear;content:''!important;margin:-2px 0 -2px .5em}.tagify--loading .tagify__input:empty::after{margin-left:0}.tagify+input,.tagify+textarea{position:absolute!important;left:-9999em!important;transform:scale(0)!important}.tagify__tag{display:inline-flex;align-items:center;margin:5px 0 5px 5px;position:relative;z-index:1;outline:0;cursor:default;transition:.13s ease-out}.tagify__tag>div{vertical-align:top;box-sizing:border-box;max-width:100%;padding:.3em .5em;padding:var(--tag-pad,.3em .5em);color:#000;color:var(--tag-text-color,#000);line-height:inherit;border-radius:3px;white-space:nowrap;transition:.13s ease-out}.tagify__tag>div>*{white-space:pre-wrap;overflow:hidden;text-overflow:ellipsis;display:inline-block;vertical-align:top;min-width:1ch;max-width:auto;min-width:var(--tag--min-width,1ch);max-width:var(--tag--max-width,auto);transition:.8s ease,.1s color}.tagify__tag>div>[contenteditable]{outline:0;-webkit-user-select:text;user-select:text;cursor:text;margin:-2px;padding:2px;max-width:350px}.tagify__tag>div::before{content:'';position:absolute;border-radius:inherit;left:0;top:0;right:0;bottom:0;z-index:-1;pointer-events:none;transition:120ms ease;animation:tags--bump .3s ease-out 1;box-shadow:0 0 0 1.1em #e5e5e5 inset;box-shadow:0 0 0 var(--tag-inset-shadow-size,1.1em) var(--tag-bg,#e5e5e5) inset}.tagify__tag:focus div::before,.tagify__tag:hover:not([readonly]) div::before{top:-2px;right:-2px;bottom:-2px;left:-2px;box-shadow:0 0 0 1.1em #d3e2e2 inset;box-shadow:0 0 0 var(--tag-inset-shadow-size,1.1em) var(--tag-hover,#d3e2e2) inset}.tagify__tag--loading{pointer-events:none}.tagify__tag--loading .tagify__tag__removeBtn{display:none}.tagify__tag--loading::after{--loader-size:.4em;content:'';vertical-align:middle;opacity:1;width:.7em;height:.7em;width:var(--loader-size);height:var(--loader-size);border:3px solid;border-color:#eee #bbb #888 transparent;border-radius:50%;animation:rotateLoader .4s infinite linear;margin:0 .5em 0 -.1em}.tagify__tag--flash div::before{animation:none}.tagify__tag--hide{width:0!important;padding-left:0;padding-right:0;margin-left:0;margin-right:0;opacity:0;transform:scale(0);transition:.3s;transition:var(--tag-hide-transition,.3s);pointer-events:none}.tagify__tag--hide>div>*{white-space:nowrap}.tagify__tag.tagify--noAnim>div::before{animation:none}.tagify__tag.tagify--notAllowed:not(.tagify__tag--editable) div>span{opacity:.5}.tagify__tag.tagify--notAllowed:not(.tagify__tag--editable) div::before{box-shadow:0 0 0 1.1em rgba(211,148,148,.5) inset!important;box-shadow:0 0 0 var(--tag-inset-shadow-size,1.1em) var(--tag-invalid-bg,rgba(211,148,148,.5)) inset!important;transition:.2s}.tagify__tag[readonly] .tagify__tag__removeBtn{display:none}.tagify__tag[readonly]>div::before{background:linear-gradient(45deg,var(--tag-bg) 25%,transparent 25%,transparent 50%,var(--tag-bg) 50%,var(--tag-bg) 75%,transparent 75%,transparent) 0/5px 5px;box-shadow:none;filter:brightness(.95)}.tagify__tag--editable>div{color:#000;color:var(--tag-text-color--edit,#000)}.tagify__tag--editable>div::before{box-shadow:0 0 0 2px #d3e2e2 inset!important;box-shadow:0 0 0 2px var(--tag-hover,#d3e2e2) inset!important}.tagify__tag--editable>.tagify__tag__removeBtn{pointer-events:none}.tagify__tag--editable>.tagify__tag__removeBtn::after{opacity:0;transform:translateX(100%) translateX(5px)}.tagify__tag--editable.tagify--invalid>div::before{box-shadow:0 0 0 2px #d39494 inset!important;box-shadow:0 0 0 2px var(--tag-invalid-color,#d39494) inset!important}.tagify__tag__removeBtn{order:5;display:inline-flex;align-items:center;justify-content:center;border-radius:50px;cursor:pointer;font:14px/1 Arial;background:0 0;background:var(--tag-remove-btn-bg,none);color:#000;color:var(--tag-remove-btn-color,#000);width:14px;height:14px;margin-right:4.66667px;margin-left:auto;overflow:hidden;transition:.2s ease-out}.tagify__tag__removeBtn::after{content:"\00D7";transition:.3s,color 0s}.tagify__tag__removeBtn:hover{color:#fff;background:#c77777;background:var(--tag-remove-btn-bg--hover,#c77777)}.tagify__tag__removeBtn:hover+div>span{opacity:.5}.tagify__tag__removeBtn:hover+div::before{box-shadow:0 0 0 1.1em rgba(211,148,148,.3) inset!important;box-shadow:0 0 0 var(--tag-inset-shadow-size,1.1em) var(--tag-remove-bg,rgba(211,148,148,.3)) inset!important;transition:box-shadow .2s}.tagify:not(.tagify--mix) .tagify__input br{display:none}.tagify:not(.tagify--mix) .tagify__input *{display:inline;white-space:nowrap}.tagify__input{flex-grow:1;display:inline-block;min-width:110px;margin:5px;padding:.3em .5em;padding:var(--tag-pad,.3em .5em);line-height:inherit;position:relative;white-space:pre-wrap;color:inherit;color:var(--input-color,inherit);box-sizing:inherit}.tagify__input:empty::before{transition:.2s ease-out;opacity:1;transform:none;display:inline-block;width:auto}.tagify--mix .tagify__input:empty::before{display:inline-block}.tagify__input:focus{outline:0}.tagify__input:focus::before{transition:.2s ease-out;opacity:0;transform:translatex(6px)}@media all and (-ms-high-contrast:none),(-ms-high-contrast:active){.tagify__input:focus::before{display:none}}@supports (-ms-ime-align:auto){.tagify__input:focus::before{display:none}}.tagify__input:focus:empty::before{transition:.2s ease-out;opacity:1;transform:none;color:rgba(0,0,0,.25);color:var(--placeholder-color-focus)}@-moz-document url-prefix(){.tagify__input:focus:empty::after{display:none}}.tagify__input::before{content:attr(data-placeholder);height:1em;line-height:1em;margin:auto 0;z-index:1;color:rgba(0,0,0,.4);color:var(--placeholder-color);white-space:nowrap;pointer-events:none;opacity:0;position:absolute}.tagify--mix .tagify__input::before{display:none;position:static;line-height:inherit}.tagify__input::after{content:attr(data-suggest);display:inline-block;white-space:pre;color:#000;opacity:.3;pointer-events:none;max-width:100px}.tagify__input .tagify__tag{margin:0 1px}.tagify__input .tagify__tag>div{padding-top:0;padding-bottom:0}.tagify--mix{display:block}.tagify--mix .tagify__input{padding:5px;margin:0;width:100%;height:100%;line-height:1.5;display:block}.tagify--mix .tagify__input::before{height:auto}.tagify--mix .tagify__input::after{content:none}.tagify--select::after{content:'>';opacity:.5;position:absolute;top:50%;right:0;bottom:0;font:16px monospace;line-height:8px;height:8px;pointer-events:none;transform:translate(-150%,-50%) scaleX(1.2) rotate(90deg);transition:.2s ease-in-out}.tagify--select[aria-expanded=true]::after{transform:translate(-150%,-50%) rotate(270deg) scaleY(1.2)}.tagify--select .tagify__tag{position:absolute;top:0;right:1.8em;bottom:0}.tagify--select .tagify__tag div{display:none}.tagify--select .tagify__input{width:100%}.tagify--invalid{--tags-border-color:#D39494}.tagify__dropdown{position:absolute;z-index:9999;transform:translateY(1px);overflow:hidden}.tagify__dropdown[placement=top]{margin-top:0;transform:translateY(-100%)}.tagify__dropdown[placement=top] .tagify__dropdown__wrapper{border-top-width:1px;border-bottom-width:0}.tagify__dropdown[position=text]{box-shadow:0 0 0 3px rgba(var(--tagify-dd-color-primary),.1);font-size:.9em}.tagify__dropdown[position=text] .tagify__dropdown__wrapper{border-width:1px}.tagify__dropdown__wrapper{max-height:300px;overflow:hidden;background:#fff;background:var(--tagify-dd-bg-color);border:1px solid #3595f6;border-color:var(--tagify-dd-color-primary);border-width:1.1px;border-top-width:0;box-shadow:0 2px 4px -2px rgba(0,0,0,.2);transition:.25s cubic-bezier(0,1,.5,1)}.tagify__dropdown__wrapper:hover{overflow:auto}.tagify__dropdown--initial .tagify__dropdown__wrapper{max-height:20px;transform:translateY(-1em)}.tagify__dropdown--initial[placement=top] .tagify__dropdown__wrapper{transform:translateY(2em)}.tagify__dropdown__item{box-sizing:inherit;padding:.3em .5em;margin:1px;cursor:pointer;border-radius:2px;position:relative;outline:0}.tagify__dropdown__item--active{background:#3595f6;background:var(--tagify-dd-color-primary);color:#fff}.tagify__dropdown__item:active{filter:brightness(105%)}


================================================
FILE: src/Jackett.Common/Content/fonts/glyphicons-halflings-regular.eot
================================================
[Binary file]


================================================
FILE: src/Jackett.Common/Content/fonts/glyphicons-halflings-regular.ttf
================================================
[Binary file]


================================================
FILE: src/Jackett.Common/Content/fonts/glyphicons-halflings-regular.woff
================================================
[Binary file]


================================================
FILE: src/Jackett.Common/Content/fonts/glyphicons-halflings-regular.woff2
================================================
[Binary file]


================================================
FILE: src/Jackett.Common/Content/libs/api.js
================================================
var api = {
	version: "2.0",
	root: "/api",
    key: "",

	getApiPath: function(category, action) {
	    var path = this.root + "/v" + this.version + "/" + category;
	    if (action !== undefined)
	        path = path + "/" + action
	    return path;
	},

	getAllIndexers: function(callback) {
	    return $.get(this.getApiPath("indexers"), callback);
	},

	getServerConfig: function(callback) {
	    return $.get(this.getApiPath("server", "config"), callback);
	},

	getIndexerConfig: function(indexerId, callback) {
	    return $.get(this.getApiPath("indexers", indexerId + "/config"), callback);
	},

	updateIndexerConfig: function(indexerId, config, callback) {
	    return $.ajax({
	        url: this.getApiPath("indexers", indexerId + "/config"),
	        type: 'POST',
	        data: JSON.stringify(config),
	        dataType: 'json',
	        contentType: 'application/json',
	        cache: false,
	        success: callback
	    });
	},

	deleteIndexer: function(indexerId, callback) {
	    return $.ajax({
	        url: this.getApiPath("indexers", indexerId),
	        type: 'DELETE',
	        cache: false,
	        success: callback
	    });
	},

	testIndexer: function(indexerId, callback) {
	    return $.post(this.getApiPath("indexers", indexerId + "/test"), callback);
	},

	resultsForIndexer: function(indexerId, query, callback) {
	    return $.get(this.getApiPath("indexers", indexerId + "/results?apikey=" + this.key), query, callback);
	},

	getServerCache: function(callback) {
	    return $.get(this.getApiPath("indexers", "cache"), callback);
	},

	getServerLogs: function(callback) {
	    return $.get(this.getApiPath("server", "logs"), callback);
	},

	updateServerConfig: function(serverConfig, callback) {
	    return $.ajax({
	        url: this.getApiPath("server", "config"),
	        type: 'POST',
	        data: JSON.stringify(serverConfig),
	        dataType: 'json',
	        contentType: 'application/json',
	        cache: false,
	        success: callback
	    });
	},

	updateServer: function(callback) {
	    return $.post(this.getApiPath("server", "update"), callback);
	},

	updateAdminPassword: function(password, callback) {
	    return $.ajax({
	        url: this.getApiPath("server", "adminpassword"),
	        type: 'POST',
	        data: JSON.stringify(password),
	        dataType: 'json',
	        contentType: 'application/json',
	        cache: false,
	        success: callback
	    });
	}
}



================================================
FILE: src/Jackett.Common/Content/libs/bootstrap-notify.js
================================================
/* 
* Project: Bootstrap Notify = v3.0.2
* Description: Turns standard Bootstrap alerts into "Growl-like" notifications.
* Author: Mouse0270 aka Robert McIntosh
* License: MIT License
* Website: https://github.com/mouse0270/bootstrap-growl
*/
(function (factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], factory);
	} else if (typeof exports === 'object') {
		// Node/CommonJS
		factory(require('jquery'));
	} else {
		// Browser globals
		factory(jQuery);
	}
}(function ($) {
	// Create the defaults once
	var defaults = {
			element: 'body',
			position: null,
			type: "info",
			allow_dismiss: true,
			newest_on_top: false,
			showProgressbar: false,
			placement: {
				from: "top",
				align: "right"
			},
			offset: 20,
			spacing: 10,
			z_index: 1031,
			delay: 5000,
			timer: 1000,
			url_target: '_blank',
			mouse_over: null,
			animate: {
				enter: 'animated fadeInDown',
				exit: 'animated fadeOutUp'
			},
			onShow: null,
			onShown: null,
			onClose: null,
			onClosed: null,
			icon_type: 'class',
			template: '<div data-notify="container" class="col-xs-11 col-sm-4 alert alert-{0}" role="alert"><button type="button" aria-hidden="true" class="close" data-notify="dismiss">&times;</button><span data-notify="icon"></span> <span data-notify="title">{1}</span> <span data-notify="message">{2}</span><div class="progress" data-notify="progressbar"><div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div></div><a href="{3}" target="{4}" data-notify="url"></a></div>'
		};

	String.format = function() {
		var str = arguments[0];
		for (var i = 1; i < arguments.length; i++) {
			str = str.replace(RegExp("\\{" + (i - 1) + "\\}", "gm"), arguments[i]);
		}
		return str;
	};

	function Notify ( element, content, options ) {
		// Setup Content of Notify
		var content = {
			content: {
				message: typeof content == 'object' ? content.message : content,
				title: content.title ? content.title : '',
				icon: content.icon ? content.icon : '',
				url: content.url ? content.url : '#',
				target: content.target ? content.target : '-'
			}
		};

		options = $.extend(true, {}, content, options);
		this.settings = $.extend(true, {}, defaults, options);
		this._defaults = defaults;
		if (this.settings.content.target == "-") {
			this.settings.content.target = this.settings.url_target;
		}
		this.animations = {
			start: 'webkitAnimationStart oanimationstart MSAnimationStart animationstart',
			end: 'webkitAnimationEnd oanimationend MSAnimationEnd animationend'
		}

		if (typeof this.settings.offset == 'number') {
		    this.settings.offset = {
		    	x: this.settings.offset,
		    	y: this.settings.offset
		    };
		}

		this.init();
	};

	$.extend(Notify.prototype, {
		init: function () {
			var self = this;

			this.buildNotify();
			if (this.settings.content.icon) {
				this.setIcon();
			}
			if (this.settings.content.url != "#") {
				this.styleURL();
			}
			this.placement();
			this.bind();

			this.notify = {
				$ele: this.$ele,
				update: function(command, update) {
					var commands = {};
					if (typeof command == "string") {					
						commands[command] = update;
					}else{
						commands = command;
					}
					for (var command in commands) {
						switch (command) {
							case "type":
								this.$ele.removeClass('alert-' + self.settings.type);
								this.$ele.find('[data-notify="progressbar"] > .progress-bar').removeClass('progress-bar-' + self.settings.type);
								self.settings.type = commands[command];
								this.$ele.addClass('alert-' + commands[command]).find('[data-notify="progressbar"] > .progress-bar').addClass('progress-bar-' + commands[command]);
								break;
							case "icon":
								var $icon = this.$ele.find('[data-notify="icon"]');
								if (self.settings.icon_type.toLowerCase() == 'class') {
									$icon.removeClass(self.settings.content.icon).addClass(commands[command]);
								}else{
									if (!$icon.is('img')) {
										$icon.find('img');
									}
									$icon.attr('src', commands[command]);
								}
								break;
							case "progress":
								var newDelay = self.settings.delay - (self.settings.delay * (commands[command] / 100));
								this.$ele.data('notify-delay', newDelay);
								this.$ele.find('[data-notify="progressbar"] > div').attr('aria-valuenow', commands[command]).css('width', commands[command] + '%');
								break;
							case "url":
								this.$ele.find('[data-notify="url"]').attr('href', commands[command]);
								break;
							case "target":
								this.$ele.find('[data-notify="url"]').attr('target', commands[command]);
								break;
							default:
								this.$ele.find('[data-notify="' + command +'"]').html(commands[command]);
						};
					}
					var posX = this.$ele.outerHeight() + parseInt(self.settings.spacing) + parseInt(self.settings.offset.y);
					self.reposition(posX);
				},
				close: function() {
					self.close();
				}
			};
		},
		buildNotify: function () {
			var content = this.settings.content;
			this.$ele = $(String.format(this.settings.template, this.settings.type, content.title, content.message, content.url, content.target));
			this.$ele.attr('data-notify-position', this.settings.placement.from + '-' + this.settings.placement.align);		
			if (!this.settings.allow_dismiss) {
				this.$ele.find('[data-notify="dismiss"]').css('display', 'none');
			}
			if ((this.settings.delay <= 0 && !this.settings.showProgressbar) || !this.settings.showProgressbar) {
				this.$ele.find('[data-notify="progressbar"]').remove();
			}
		},
		setIcon: function() {
			if (this.settings.icon_type.toLowerCase() == 'class') {
				this.$ele.find('[data-notify="icon"]').addClass(this.settings.content.icon);
			}else{
				if (this.$ele.find('[data-notify="icon"]').is('img')) {
					this.$ele.find('[data-notify="icon"]').attr('src', this.settings.content.icon);
				}else{
					this.$ele.find('[data-notify="icon"]').append('<img src="'+this.settings.content.icon+'" alt="Notify Icon" />');
				}	
			}
		},
		styleURL: function() {
			this.$ele.find('[data-notify="url"]').css({
				backgroundImage: 'url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)',
				height: '100%',
				left: '0px',
				position: 'absolute',
				top: '0px',
				width: '100%',
				zIndex: this.settings.z_index + 1
			});
			this.$ele.find('[data-notify="dismiss"]').css({
				position: 'absolute',
				right: '10px',
				top: '5px',
				zIndex: this.settings.z_index + 2
			});
		},
		placement: function() {
			var self = this,
				offsetAmt = this.settings.offset.y,
				css = {
					display: 'inline-block',
					margin: '0px auto',
					position: this.settings.position ?  this.settings.position : (this.settings.element === 'body' ? 'fixed' : 'absolute'),
					transition: 'all .5s ease-in-out',
					zIndex: this.settings.z_index
				},
				hasAnimation = false,
				settings = this.settings;

			$('[data-notify-position="' + this.settings.placement.from + '-' + this.settings.placement.align + '"]:not([data-closing="true"])').each(function() {
				return offsetAmt = Math.max(offsetAmt, parseInt($(this).css(settings.placement.from)) +  parseInt($(this).outerHeight()) +  parseInt(settings.spacing));
			});
			if (this.settings.newest_on_top == true) {
				offsetAmt = this.settings.offset.y;
			}
			css[this.settings.placement.from] = offsetAmt+'px';

			switch (this.settings.placement.align) {
				case "left":
				case "right":
					css[this.settings.placement.align] = this.settings.offset.x+'px';
					break;
				case "center":
					css.left = 0;
					css.right = 0;
					break;
			}
			this.$ele.css(css).addClass(this.settings.animate.enter);

			$(this.settings.element).append(this.$ele);

			if (this.settings.newest_on_top == true) {
				offsetAmt = (parseInt(offsetAmt)+parseInt(this.settings.spacing)) + this.$ele.outerHeight();
				this.reposition(offsetAmt);
			}
			
			if ($.isFunction(self.settings.onShow)) {
				self.settings.onShow.call(this.$ele);
			}

			this.$ele.one(this.animations.start, function(event) {
				hasAnimation = true;
			}).one(this.animations.end, function(event) {
				if ($.isFunction(self.settings.onShown)) {
					self.settings.onShown.call(this);
				}
			});

			setTimeout(function() {
				if (!hasAnimation) {
					if ($.isFunction(self.settings.onShown)) {
						self.settings.onShown.call(this);
					}
				}
			}, 600);
		},
		bind: function() {
			var self = this;

			this.$ele.find('[data-notify="dismiss"]').on('click', function() {		
				self.close();
			})

			this.$ele.mouseover(function(e) {
				$(this).data('data-hover', "true");
			}).mouseout(function(e) {
				$(this).data('data-hover', "false");
			});
			this.$ele.data('data-hover', "false");

			if (this.settings.delay > 0) {
				self.$ele.data('notify-delay', self.settings.delay);
				var timer = setInterval(function() {
					var delay = parseInt(self.$ele.data('notify-delay')) - self.settings.timer;
					if ((self.$ele.data('data-hover') === 'false' && self.settings.mouse_over == "pause") || self.settings.mouse_over != "pause") {
						var percent = ((self.settings.delay - delay) / self.settings.delay) * 100;
						self.$ele.data('notify-delay', delay);
						self.$ele.find('[data-notify="progressbar"] > div').attr('aria-valuenow', percent).css('width', percent + '%');
					}
					if (delay <= -(self.settings.timer)) {
						clearInterval(timer);
						self.close();
					}
				}, self.settings.timer);
			}
		},
		close: function() {
			var self = this,
				$successors = null,
				posX = parseInt(this.$ele.css(this.settings.placement.from)),
				hasAnimation = false;

			this.$ele.data('closing', 'true').addClass(this.settings.animate.exit);
			self.reposition(posX);			
			
			if ($.isFunction(self.settings.onClose)) {
				self.settings.onClose.call(this.$ele);
			}

			this.$ele.one(this.animations.start, function(event) {
				hasAnimation = true;
			}).one(this.animations.end, function(event) {
				$(this).remove();
				if ($.isFunction(self.settings.onClosed)) {
					self.settings.onClosed.call(this);
				}
			});

			setTimeout(function() {
				if (!hasAnimation) {
					self.$ele.remove();
					if (self.settings.onClosed) {
						self.settings.onClosed(self.$ele);
					}
				}
			}, 600);
		},
		reposition: function(posX) {
			var self = this,
				notifies = '[data-notify-position="' + this.settings.placement.from + '-' + this.settings.placement.align + '"]:not([data-closing="true"])',
				$elements = this.$ele.nextAll(notifies);
			if (this.settings.newest_on_top == true) {
				$elements = this.$ele.prevAll(notifies);
			}
			$elements.each(function() {
				$(this).css(self.settings.placement.from, posX);
				posX = (parseInt(posX)+parseInt(self.settings.spacing)) + $(this).outerHeight();
			});
		}
	});

	$.notify = function ( content, options ) {
		var plugin = new Notify( this, content, options );
		return plugin.notify;
	};
	$.notifyDefaults = function( options ) {
		defaults = $.extend(true, {}, defaults, options);
		return defaults;
	};
	$.notifyClose = function( command ) {
		if (typeof command === "undefined" || command == "all") {
			$('[data-notify]').find('[data-notify="dismiss"]').trigger('click');
		}else{
			$('[data-notify-position="'+command+'"]').find('[data-notify="dismiss"]').trigger('click');
		}
	};

}));


================================================
FILE: src/Jackett.Common/Content/libs/handlebarsextend.js
================================================
Handlebars.registerHelper('ifCond', function (v1, v2, options) {
    if(v1 === v2) {
        return options.fn(this);
    }
    return options.inverse(this);
});



================================================
FILE: src/Jackett.Common/Content/libs/handlebarsmoment.js
================================================

Handlebars.registerHelper('dateFormat', function (context, block) {
    if (window.moment) {
        var f = block.hash.format || "YYYY-MM-DD HH:mm:ss";
        return moment(context).format(f); //had to remove Date(context)
    } else {
        return context;   //  moment plugin not available. return data as is.
    }
});

Handlebars.registerHelper('jacketTimespan', function (context, block) {
    var now = moment();
    var from = moment(context);
    var timeSpan = moment.duration(now.diff(from));

    var minutes = timeSpan.asMinutes();
    if (minutes < 120) {
        return Math.round(minutes) + 'm ago';
    }

    var hours = timeSpan.asHours();
    if (hours < 48) {
        return parseFloat(hours).toFixed(1) + 'h ago';
    }

    var days = timeSpan.asDays();
    if (days < 365) {
        return Math.round(days) + 'd ago';
    }

    var years = timeSpan.asYears();
    return Math.round(years) + 'y ago';
});

Handlebars.registerHelper('jacketSize', function (context, block) {
    return filesize(context, { round: 2 });
});



================================================
FILE: src/Jackett.Common/Converters/StringToLongConverter.cs
================================================
using System;
using Newtonsoft.Json;

namespace Jackett.Common.Converters
{
    /// <summary>
    /// converts a string value to a long and vice-versa.
    /// </summary>
    public sealed class StringToLongConverter : JsonConverter
    {
        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
            => writer.WriteValue(value.ToString());

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
        {
            if (reader.Value == null)
            {
                return null;
            }

            if (reader.Value is long)
            {
                return reader.Value;
            }

            return long.TryParse((string)reader.Value, out var foo)
                ? foo
                : (long?)null;
        }

        public override bool CanConvert(Type objectType) => objectType == typeof(string);
    }
}



================================================
FILE: src/Jackett.Common/Definitions/0daykiev.yml
================================================
---
id: 0daykiev
name: 0day.kiev
description: "0day.kiev.ua is a UKRAINIAN Private Torrent Tracker for MOVIES / TV / GENERAL"
language: uk-UA
type: private
encoding: windows-1251
links:
  - https://tracker.0day.community/
legacylinks:
  - https://tracker.0day.kiev.ua/

caps:
  categorymappings:
    - {id: 10, cat: Movies, desc: "Фильмы (Movies)"}
    - {id: 16, cat: Movies/HD, desc: "HD / Фильмы (HD / Movies)"}
    - {id: 30, cat: TV/HD, desc: "HD / Сериалы (HD / TV Shows)"}
    - {id: 27, cat: Movies/HD, desc: "HD / Мультфильмы (HD / Cartoons)"}
    - {id: 17, cat: PC/Games, desc: "Игры / ПК (Games / PC)"}
    - {id: 14, cat: Audio, desc: "Музыка / Аудио (Music / Audio)"}
    - {id: 29, cat: TV, desc: "Мультсериалы (TV Series)"}
    - {id: 11, cat: Movies, desc: "Мультфильмы (Cartoons)"}
    - {id: 28, cat: TV/Documentary, desc: "HD / Документальное (HD / Documentary)"}
    - {id: 18, cat: PC/0day, desc: "Софт / Windows (Software / Windows)"}
    - {id: 19, cat: TV, desc: "TV / Сериалы (TV shows)"}
    - {id: 31, cat: Other, desc: "Прочее (Other)"}

  modes:
    search: [q]
    tv-search: [q, season, ep]
    movie-search: [q]
    music-search: [q]

settings:
  - name: username
    type: text
    label: Username
  - name: password
    type: password
    label: Password
  - name: stripcyrillic
    type: checkbox
    label: Strip Cyrillic Letters
    default: true
  - name: freeleech
    type: checkbox
    label: Search freeleech only
    default: false
  - name: sort
    type: select
    label: Sort requested from site
    default: 4
    options:
      4: created
      7: seeders
      5: size
      1: title
  - name: type
    type: select
    label: Order requested from site
    default: desc
    options:
      desc: desc
      asc: asc
  - name: info_activity
    type: info
    label: Account Inactivity
    default: "The tracker has a system for deleting inactive accounts after 6 months from your last visit to the tracker."

login:
  path: takelogin.php
  method: post
  inputs:
    username: "{{ .Config.username }}"
    password: "{{ .Config.password }}"
    returnto: "/browse.php"
  error:
    - selector: div.maintitle:contains("Ошибка")
      message:
        selector: div.borderwrap table.embedded
  test:
    path: browse.php
    selector: a[href="/logout.php"]

search:
  paths:
    # https://tracker.0day.kiev.ua/browse.php?c10=1&c27=1&search=endgame&incldead=1&where=0
    - path: browse.php
  inputs:
    $raw: "{{ range .Categories }}c{{.}}=1&{{end}}"
    search: "{{ .Keywords }}"
    # 0 active, 1 incldead, 2 onlydead, 3 gold, 4 noseed, 5 silver
    incldead: "{{ if .Config.freeleech }}3{{ else }}1{{ end }}"
    # 0 title, 1 title and descr
    where: 0
    sort: "{{ .Config.sort }}"
    type: "{{ .Config.type }}"

  keywordsfilters:
    - name: diacritics
      args: replace
    - name: re_replace # S01 to сезон 1
      args: ["(?i)\\bS0*(\\d+)\\b", "сезон $1"]
    - name: re_replace # E01 to сері 1
      args: ["(?i)\\bE0*(\\d+)\\b", "сері $1"]
    - name: re_replace # S01E01 to сезон 1 сері 1
      args: ["(?i)\\bS0*(\\d+)E0*(\\d+)\\b", "сезон $1 сері $2"]

  rows:
    selector: table > tbody > tr.rowtorrentinfo

  fields:
    category:
      selector: a[href^="browse.php?cat="]
      attribute: href
      filters:
        - name: querystring
          args: cat
    title:
      selector: a[href^="details.php?id="]
      filters:
        # normalize to SXXEYY format
        - name: re_replace
          args: ["(?i)[CС]езони?[\\s:]*(\\d+(?:-\\d+)?).+?(?:[CС]ері[їяй]|Епізоди?)[\\s:]*(\\d+(?:-\\d+)?)\\s*з\\s*(\\w?)", "S$1E$2 of $3"]
        - name: re_replace
          args: ["(?i)(\\d+(?:-\\d+)?)\\s*[CС]езони?.+?(\\d+(?:-\\d+)?)\\s*з\\s*(\\w?)(?:\\s*(?:[CС]ері[їяй]|Епізоди?))?", "S$1E$2 of $3"]
        - name: re_replace
          args: ["(?i)(\\d+(?:-\\d+)?)\\s*[CС]езони?.+?(\\d+(?:-\\d+)?)\\s*(?:[CС]ері[їяй]|Епізоди?)\\s+з\\s*(\\w?)", "S$1E$2 of $3"]
        - name: re_replace
          args: ["(?i)[CС]езони?[\\s:]*(\\d+(?:-\\d+)?).+?(\\d+(?:-\\d+)?)\\s*з\\s*(\\w?)(?:\\s*(?:[CС]ері[їяй]|Епізоди?))?", "S$1E$2 of $3"]
        - name: re_replace
          args: ["(?i)[CС]езони?[\\s:]*(\\d+(?:-\\d+)?).+?(\\d+(?:-\\d+)?)\\s*(?:[CС]ері[їяй]|Епізоди?)\\s+з\\s*(\\w?)", "S$1E$2 of $3"]
        - name: re_replace
          args: ["(?i)[CС]езони?[\\s:]*(\\d+(?:-\\d+)?).+?(?:[CС]ері[їяй]|Епізоди?)[\\s:]*(\\d+(?:-\\d+)?)", "S$1E$2"]
        - name: re_replace
          args: ["(?i)(\\d+(?:-\\d+)?)\\s*[CС]езони?.+?(\\d+(?:-\\d+)?)(?:\\s*(?:[CС]ері[їяй]|Епізоди?))", "S$1E$2"]
        - name: re_replace
          args: ["(?i)[CС]езони?[\\s:]*(\\d+(?:-\\d+)?).+?(\\d+(?:-\\d+)?)(?:\\s*(?:[CС]ері[їяй]|Епізоди?))", "S$1E$2"]
        - name: re_replace
          args: ["(?i)[CС]езони?[\\s:]*(\\d+(?:-\\d+)?)", "S$1"]
        - name: re_replace
          args: ["(?i)(\\d+(?:-\\d+)?)\\s+[CС]езони?", "S$1"]
        - name: re_replace
          args: ["(?i)(?:[CС]ері[їяй]|Епізоди?)[\\s:]*(\\d+(?:-\\d+)?)\\s*з\\s*(\\w?)", "E$1 of $2"]
        - name: re_replace
          args: ["(?i)(\\d+(?:-\\d+)?)\\s*з\\s*(\\w?)(?:\\s*(?:[CС]ері[їяй]|Епізоди?))", "E$1 of $2"]
        - name: re_replace
          args: ["(?i)(\\d+(?:-\\d+)?)\\s+(?:[CС]ері[їяй]|Епізоди?)\\s+з\\s*(\\w?)", "E$1 of $2"]
        - name: re_replace
          args: ["(?i)(?:[CС]ері[їяй]|Епізоди?)[\\s:]*(\\d+(?:-\\d+)?)", "E$1"]
        - name: re_replace
          args: ["(?i)(\\d+(?:-\\d+)?)\\s+(?:[CС]ері[їяй]|Епізоди?)", "E$1"]
        - name: re_replace
          args: ["(\\([\\p{IsCyrillic}\\W]+\\))|(^[\\p{IsCyrillic}\\W\\d]+\\/ )|([\\p{IsCyrillic} \\-]+,+)|([\\p{IsCyrillic}]+)", "{{ if .Config.stripcyrillic }}{{ else }}$1$2$3$4{{ end }}"]
        - name: re_replace
          args: ["(?i)\\bHDTV\\s?Rip\\b", "HDTV"]
        - name: re_replace
          args: ["(?i)\\bSAT\\s?Rip\\b", "HDTV"]
        - name: re_replace
          args: ["(?i)\\bWEB\\s?DL\\s?Rip\\b", "WEBDL"]
        - name: re_replace
          args: ["(?i)\\bWEB Rip\\b", "WEBRip"]
        - name: re_replace
          args: ["(?i)\\bWEB DL\\b", "WEBDL"]
        - name: re_replace
          args: ["[\\[\\(\\{<«][\\s\\W]*[\\]\\)\\}>»]", ""]
        - name: re_replace
          args: ["^[\\s&,\\.!\\?\\+\\-_\\|\\/':]+", ""]
        - name: re_replace
          args: ["(?i)^\\(\\s*([SE]\\d+.*?)\\s*\\)[\\s\\/\\|]*(.+)", "$2 $1"]
    details:
      selector: a[href^="details.php?id="]
      attribute: href
    download:
      selector: a[href^="download.php?id="]
      attribute: href
    date:
      selector: td:nth-child(2) i
      filters:
        - name: append
          args: " +02:00" # EET
        - name: dateparse
          args: "yyyy-MM-dd HH:mm:ss zzz"
    size:
      selector: td:nth-child(4)
      filters:
        - name: replace
          args: ["ТБ", "TB"]
        - name: replace
          args: ["ГБ", "GB"]
        - name: replace
          args: ["МБ", "MB"]
        - name: replace
          args: ["КБ", "KB"]
    grabs:
      selector: td:nth-child(5)
    seeders:
      selector: td:nth-child(6)
      filters:
        - name: split
          args: ["|", 0]
    leechers:
      selector: td:nth-child(6)
      filters:
        - name: split
          args: ["|", 1]
    downloadvolumefactor:
      case:
        img[src="pic/freedownload.gif"]: 0
        img[src="pic/silverdownload.gif"]: 0.5
        "*": 1
    uploadvolumefactor:
      text: 1
    minimumratio:
      text: 0.2
    description:
      selector: a[href^="details.php?id="]
# engine n/a



================================================
FILE: src/Jackett.Common/Definitions/0magnet.yml
================================================
---
id: 0magnet
name: 0Magnet
description: "ØMagnet is a CHINESE Public tracker for Asian 3X (JAV)"
language: en-US
type: public
encoding: UTF-8
links:
  - https://13mag.net/
  - https://16mag.net/
legacylinks:
  - https://0magnet.com/
  - https://9mag.net/
  - https://0magnet.co/

caps:
  categories:
    XXX: XXX

  modes:
    search: [q]

settings: []

download:
  infohash:
    hash:
      selector: a[href^="magnet:?xt"]
      attribute: href
      filters:
        - name: regexp
          args: ([A-F|a-f|0-9]{40})
    title:
      selector: a[href^="magnet:?xt"]
      attribute: href
      filters:
        - name: regexp
          args: "&dn=(.+?)&"
        - name: validfilename

search:
  paths:
    - path: search
  inputs:
    q: "{{ if .Keywords }}{{ .Keywords }}{{ else }}{{ .Today.Year }}.{{ end }}"

  rows:
    selector: table > tbody > tr:has(td)
    filters:
      - name: andmatch

  fields:
    category:
      text: XXX
    title:
      selector: a
      remove: p
    details:
      selector: a
      attribute: href
    download:
      selector: a
      attribute: href
    date:
      text: now
    size:
      selector: td.td-size
    seeders:
      text: 1
    leechers:
      text: 1
    downloadvolumefactor:
      text: 0
    uploadvolumefactor:
      text: 1
# engine n/a



================================================
FILE: src/Jackett.Common/Definitions/1337x.yml
================================================
---
id: 1337x
name: 1337x
description: "1337x is a Public torrent site that offers verified torrent downloads"
language: en-US
type: public
encoding: UTF-8
requestDelay: 2
# get status and news on domains at the official site https://1337x-status.org/
links:
  - https://1337x.to/
  - https://1337x.st/
  - https://x1337x.ws/
  - https://x1337x.eu/
  - https://x1337x.cc/
legacylinks:
  - https://1337x.is/
  - https://1337x.gd/
  - https://1337x.mrunblock.bond/
  - https://1337x.abcproxy.org/
  - https://1337x.so/
  - https://1337x.unblockit.download/
  - https://1337x.unblockninja.com/ # keyword search not working
  - https://1337x.ninjaproxy1.com/ # keyword search not working
  - https://1337x.proxyninja.org/ # keyword search not working
  - https://1337x.proxyninja.net/ # keyword search not working
  - https://1337x.torrentbay.st/ # keyword search not working
  - https://1337x.torrentsbay.org/ # keyword search not working
  - https://x1337x.se/

caps:
  categorymappings:
    # Anime
    - {id: 28, cat: TV/Anime, desc: "Anime/Anime"}
    - {id: 78, cat: TV/Anime, desc: "Anime/Dual Audio"}
    - {id: 79, cat: TV/Anime, desc: "Anime/Dubbed"}
    - {id: 80, cat: TV/Anime, desc: "Anime/Subbed"}
    - {id: 81, cat: TV/Anime, desc: "Anime/Raw"}
    # Audio
    - {id: 22, cat: Audio/MP3, desc: "Music/MP3"}
    - {id: 23, cat: Audio/Lossless, desc: "Music/Lossless"}
    - {id: 24, cat: Audio, desc: "Music/DVD"}
    - {id: 25, cat: Audio/Video, desc: "Music/Video"}
    - {id: 26, cat: Audio, desc: "Music/Radio"}
    - {id: 27, cat: Audio/Other, desc: "Music/Other"}
    - {id: 53, cat: Audio, desc: "Music/Album"}
    - {id: 58, cat: Audio, desc: "Music/Box set"}
    - {id: 59, cat: Audio, desc: "Music/Discography"}
    - {id: 60, cat: Audio, desc: "Music/Single"}
    - {id: 68, cat: Audio, desc: "Music/Concerts"}
    - {id: 69, cat: Audio, desc: "Music/AAC"}
    # Movies
    - {id: 1, cat: Movies/DVD, desc: "Movies/DVD"}
    - {id: 2, cat: Movies/SD, desc: "Movies/Divx/Xvid"}
    - {id: 3, cat: Movies, desc: "Movies/SVCD/VCD"}
    - {id: 4, cat: Movies/Foreign, desc: "Movies/Dubs/Dual Audio"}
    - {id: 42, cat: Movies/HD, desc: "Movies/HD"}
    - {id: 54, cat: Movies/HD, desc: "Movies/h.264/x264"}
    - {id: 55, cat: Movies, desc: "Movies/Mp4"}
    - {id: 66, cat: Movies/3D, desc: "Movies/3D"}
    - {id: 70, cat: Movies/HD, desc: "Movies/HEVC/x265"}
    - {id: 73, cat: Movies, desc: "Movies/Bollywood"}
    - {id: 76, cat: Movies/UHD, desc: "Movies/UHD"}
    # TV
    - {id: 5, cat: TV, desc: "TV/DVD"}
    - {id: 6, cat: TV, desc: "TV/Divx/Xvid"}
    - {id: 7, cat: TV, desc: "TV/SVCD/VCD"}
    - {id: 41, cat: TV/HD, desc: "TV/HD"}
    - {id: 71, cat: TV, desc: "TV/HEVC/x265"}
    - {id: 74, cat: TV, desc: "TV/Cartoons"}
    - {id: 75, cat: TV/SD, desc: "TV/SD"}
    - {id: 9, cat: TV/Documentary, desc: "TV/Documentary"}
    # Apps
    - {id: 18, cat: PC, desc: "Apps/PC Software"}
    - {id: 19, cat: PC/Mac, desc: "Apps/Mac"}
    - {id: 20, cat: PC, desc: "Apps/Linux"}
    - {id: 21, cat: PC, desc: "Apps/Other"}
    - {id: 56, cat: PC/Mobile-Android, desc: "Apps/Android"}
    - {id: 57, cat: PC/Mobile-iOS, desc: "Apps/iOS"}
    # Games
    - {id: 10, cat: PC/Games, desc: "Games/PC Game"}
    - {id: 11, cat: Console/PS3, desc: "Games/PS2"}
    - {id: 12, cat: Console/PSP, desc: "Games/PSP"}
    - {id: 13, cat: Console/XBox, desc: "Games/Xbox"}
    - {id: 14, cat: Console/XBox 360, desc: "Games/Xbox360"}
    - {id: 15, cat: Console/PS3, desc: "Games/PS1"}
    - {id: 16, cat: Console/Other, desc: "Games/Dreamcast"}
    - {id: 17, cat: PC/Mobile-Other, desc: "Games/Other"}
    - {id: 43, cat: Console/PS3, desc: "Games/PS3"}
    - {id: 44, cat: Console/Wii, desc: "Games/Wii"}
    - {id: 45, cat: Console/NDS, desc: "Games/DS"}
    - {id: 46, cat: Console/Other, desc: "Games/GameCube"}
    - {id: 72, cat: Console/3DS, desc: "Games/3DS"}
    - {id: 77, cat: Console/PS4, desc: "Games/PS4"}
    - {id: 82, cat: Console/Other, desc: "Games/Switch"}
    # XXX
    - {id: 48, cat: XXX/DVD, desc: "XXX/Video"}
    - {id: 49, cat: XXX/ImageSet, desc: "XXX/Picture"}
    - {id: 50, cat: XXX, desc: "XXX/Magazine"}
    - {id: 51, cat: XXX, desc: "XXX/Hentai"}
    - {id: 67, cat: XXX, desc: "XXX/Games"}
    # Other
    - {id: 33, cat: Other, desc: "Other/Emulation"}
    - {id: 34, cat: Books, desc: "Other/Tutorial"}
    - {id: 35, cat: Other, desc: "Other/Sounds"}
    - {id: 36, cat: Books/EBook, desc: "Other/E-books"}
    - {id: 37, cat: Other, desc: "Other/Images"}
    - {id: 38, cat: Other, desc: "Other/Mobile Phone"}
    - {id: 39, cat: Books/Comics, desc: "Other/Comics"}
    - {id: 40, cat: Other/Misc, desc: "Other/Other"}
    - {id: 47, cat: Other, desc: "Other/Nulled Script"}
    - {id: 52, cat: Audio/Audiobook, desc: "Other/Audiobook"}

  modes:
    search: [q]
    tv-search: [q, season, ep]
    movie-search: [q]
    music-search: [q]
    book-search: [q]
  allowrawsearch: true

settings:
  - name: uploader
    type: text
    label: Filter by Uploader
  - name: info_uploader
    type: info
    label: About filtering by Uploader
    default: "You can filter by Uploader by entering a Case Sensitive username, or leave empty to get all results.<br>Note: this is the username of the Uploader and not the Groupname that often show up at the end of 1337x titles, eg -GalaxyRG."
  - name: info_flaresolverr
    type: info_flaresolverr
  - name: downloadlink
    type: select
    label: Download link
    default: "http://itorrents.org/"
    options:
      "http://itorrents.org/": iTorrents.org
      "magnet:": magnet
  - name: downloadlink2
    type: select
    label: Download link (fallback)
    default: "magnet:"
    options:
      "http://itorrents.org/": iTorrents.org
      "magnet:": magnet
  - name: info_download
    type: info
    label: About the Download links
    default: As the iTorrents .torrent download link on this site is known to fail from time to time, we suggest using the magnet link as a fallback. The BTCache and Torrage services are not supported because they require additional user interaction (a captcha for BTCache and a download button on Torrage.)
  - name: disablesort
    type: checkbox
    label: Disable sorting - 1337x prevents sorting searches during high server load, which breaks the indexer when performing a keyword search - disable if you get zero results
    default: false
  - name: sort
    type: select
    label: Sort requested from site
    default: time
    options:
      time: created
      seeders: seeders
      size: size
  - name: type
    type: select
    label: Order requested from site
    default: desc
    options:
      desc: desc
      asc: asc

download:
  # the .torrent URL and magnet URI are on the details page
  selectors:
    - selector: ul li a[href^="{{ .Config.downloadlink }}"]
      attribute: href
    - selector: ul li a[href^="{{ .Config.downloadlink2 }}"]
      attribute: href

search:
  paths:
    # present first page of movies tv and music results if there are no search parms supplied (20 hits per page)
    - path: "{{ if and (.Keywords) (eq .Config.disablesort .False) }}sort-{{ else }}{{ end }}{{ if .Keywords }}search/{{ .Keywords }}{{ else }}cat/Movies{{ end }}{{ if and (.Keywords) (eq .Config.disablesort .False) }}/{{ .Config.sort }}/{{ .Config.type }}{{ else }}{{ end }}/1/"
    - path: "{{ if and (.Keywords) (eq .Config.disablesort .False) }}sort-{{ else }}{{ end }}{{ if .Keywords }}search/{{ .Keywords }}{{ else }}cat/TV{{ end }}{{ if and (.Keywords) (eq .Config.disablesort .False)) }}/{{ .Config.sort }}/{{ .Config.type }}{{ else }}{{ end }}/{{ if .Keywords }}2{{ else }}1{{ end }}/"
    - path: "{{ if and (.Keywords) (eq .Config.disablesort .False) }}sort-{{ else }}{{ end }}{{ if .Keywords }}search/{{ .Keywords }}{{ else }}cat/Music{{ end }}{{ if and (.Keywords) (eq .Config.disablesort .False) }}/{{ .Config.sort }}/{{ .Config.type }}{{ else }}{{ end }}/{{ if .Keywords }}3{{ else }}1{{ end }}/"
    - path: "{{ if and (.Keywords) (eq .Config.disablesort .False) }}sort-{{ else }}{{ end }}{{ if .Keywords }}search/{{ .Keywords }}{{ else }}cat/Other{{ end }}{{ if and (.Keywords) (eq .Config.disablesort .False) }}/{{ .Config.sort }}/{{ .Config.type }}{{ else }}{{ end }}/{{ if .Keywords }}4{{ else }}1{{ end }}/"

  keywordsfilters:
    - name: re_replace # daily standard S2023 > 2023
      args: ["\\bS(20\\d{2})\\b", "$1"]

  rows:
    selector: "tr:has(a[href^=\"/torrent/\"]){{ if .Config.uploader }}:has(td[class^=\"coll-5\"]:contains({{ .Config.uploader }})){{ else }}{{ end }}"

  fields:
    title_default:
      # the movies, tv and music pages abbreviate the title
      selector: td[class^="coll-1"] a[href^="/torrent/"]
    title_optional:
      # the movies, tv and music pages abbreviate the title so we process the href instead. #8137
      optional: true
      selector: td[class^="coll-1"] a[href^="/torrent/"]:contains("...")
      attribute: href
      filters:
        - name: urldecode
        - name: split
          args: ["/", 3]
    title:
      # title_optional can be empty so use the title_default instead #8586
      text: "{{ if .Result.title_optional }}{{ .Result.title_optional }}{{ else }}{{ .Result.title_default }}{{ end }}"
      filters:
        - name: re_replace
          args: ["-([\\w]+(?:[\\[\\]\\(\\)\\w]+)?)$", "~$1"]
        - name: replace
          args: ["-", " "]
        - name: re_replace
          args: ["~([\\w]+(?:[\\[\\]\\(\\)\\w]+)?)$", "-$1"]
        - name: replace
          args: ["\u000f", ""] # get rid of unwanted character #6582
        # cleanup for Sonarr
        - name: re_replace # EP 3 4 to E3-4
          args: ["(?i)\\sEP\\s(\\d{1,2})\\s(E?\\s?\\d{1,2})\\s", " E$1-$2 "]
        - name: re_replace # S02E04 05 to S02E04-05
          args: ["(?i)\\sS(\\d{1,2})\\s?E\\s?(\\d{1,2})\\s(E?\\s?\\d{1,2})\\s", " S$1E$2-$3 "]
        - name: re_replace
          args: ["(?i)AC3\\s?(\\d)\\s(\\d)", "AC3 $1.$2"]
        - name: re_replace
          args: ["(?i) DD\\s?(\\d)\\s(\\d)", " DD $1.$2"]
        - name: re_replace
          args: ["(?i) DDP\\s?(\\d)\\s(\\d)", " DDP $1.$2"]
        - name: re_replace
          args: ["(?i)\\sE\\s?AC3", " EAC3"]
        - name: re_replace
          args: ["(?i)WEB\\sDL", "WEB-DL"]
        - name: re_replace
          args: ["(?i)HDTVRIP", "HDTV"]
    category_optional:
      optional: true
      selector: td[class^="coll-1"] a[href^="/sub/"]
      attribute: href
      filters:
        # extract the third part
        - name: split
          args: ["/", 2]
    category:
      text: "{{ if .Result.category_optional }}{{ .Result.category_optional }}{{ else }}40{{ end }}"
    details:
      selector: td[class^="coll-1"] a[href^="/torrent/"]
      attribute: href
    download:
      # .torrent link is on the details page
      selector: td[class^="coll-1"] a[href^="/torrent/"]
      attribute: href
    # dates come in three flavours:
    date_year:
      # (within this year) 7am Sep. 14th
      optional: true
      selector: td[class^="coll-date"]:not(:contains(":")):not(:contains("'"))
      filters:
        - name: re_replace
          args: ["st|nd|rd|th", ""]
        - name: dateparse
          args: "htt MMM. d"
    date_years:
      # (more than a year ago) Apr. 18th '11
      optional: true
      selector: td[class^="coll-date"]:contains("'")
      filters:
        - name: replace
          args: ["'", ""]
        - name: re_replace
          args: ["st|nd|rd|th", ""]
        - name: dateparse
          args: "MMM. d yy"
    date_today:
      # (today) 12:25am
      optional: true
      selector: td[class^="coll-date"]:contains(":")
      filters:
        - name: fuzzytime
    date:
      text: "{{ if or .Result.date_year .Result.date_years .Result.date_today }}{{ or .Result.date_year .Result.date_years .Result.date_today }}{{ else }}now{{ end }}"
    size:
      selector: td[class^="coll-4"]
    seeders:
      selector: td[class^="coll-2"]
    leechers:
      selector: td[class^="coll-3"]
    _username:
      selector: td[class^="coll-5"]
    description:
      text: "Uploader: {{ .Result._username }}"
    downloadvolumefactor:
      text: 0
    uploadvolumefactor:
      text: 1
# engine n/a



================================================
FILE: src/Jackett.Common/Definitions/13city.yml
================================================
---
id: 13city
name: 13City
description: "13City is a CHINESE Private Torrent Tracker for MOVIES / TV / GENERAL"
language: zh-CN
type: private
encoding: UTF-8
links:
  - https://13city.org/

caps:
  categorymappings:
    - {id: 401, cat: Movies, desc: "电影/Movies"}
    - {id: 402, cat: TV, desc: "电视剧/TVSeries"}
    - {id: 403, cat: TV, desc: "综艺/TV Shows"}
    - {id: 405, cat: TV/Anime, desc: "动漫/Animations"}
    - {id: 406, cat: Audio/Video, desc: "演唱会、MV/Music Videos"}
    - {id: 408, cat: Audio, desc: "音乐/Music"}
    - {id: 409, cat: Books/EBook, desc: "电子书/E-book"}
    - {id: 409, cat: Audio/Audiobook, desc: "有声读物/A-book"}
    - {id: 413, cat: TV/Documentary, desc: "纪录片/Documentary"}

  modes:
    search: [q]
    tv-search: [q, season, ep, imdbid, doubanid]
    movie-search: [q, imdbid, doubanid]
    music-search: [q]
    book-search: [q]

settings:
  - name: cookie
    type: text
    label: Cookie
  - name: info_cookie
    type: info_cookie
  - name: freeleech
    type: checkbox
    label: Search freeleech only
    default: false
  - name: sort
    type: select
    label: Sort requested from site
    default: 4
    options:
      4: created
      7: seeders
      5: size
      1: title
  - name: type
    type: select
    label: Order requested from site
    default: desc
    options:
      desc: desc
      asc: asc
  - name: info_tpp
    type: info
    label: Results Per Page
    default: For best results, change the <b>Torrents per page:</b> setting to <b>100</b> on your account profile.
  - name: info_activity
    type: info
    label: Account Inactivity
    default: "Account retention rules:<ol><li>If there is no valid traffic within 7 days of registration (participation in the calculation of sharing rate), the account will be blocked</li><li>After the level is reduced to \"Peasant\", if the sharing rate is not improved within 7 days, the account will be blocked</li><li>Long-term non-login:<ul>- UnParked account: 60 consecutive days of non-login → banned</ul><ul>- Parked account: 180 consecutive days of non-login → banned</ul><ul>- Nexus Master and above levels are not subject to long-term non-login ban restrictions</ul></li></ol>"

login:
  # using cookie method because site does a JS call to API/Challenge via JQuery to load response parm required for takelogin.php
  method: cookie
  inputs:
    cookie: "{{ .Config.cookie }}"
  test:
    path: index.php
    selector: a[href="logout.php"]

search:
  paths:
    - path: torrents.php
  inputs:
    $raw: "{{ range .Categories }}cat{{.}}=1&{{end}}"
    search: "{{ if .Query.IMDBID }}{{ .Query.IMDBID }}{{ else }}{{ end }}{{ if or .Query.IMDBID .Query.DoubanID }} {{ else }}{{ .Keywords }}{{ end }}{{ if .Query.DoubanID }}{{ .Query.DoubanID }}{{ else }}{{ end }}"
    # 0 incldead, 1 active, 2 dead
    incldead: 0
    # 0 all, 1 normal, 2 free, 3 2x, 4 2xfree, 5 50%, 6 2x50%, 7 30%
    spstate: "{{ if .Config.freeleech }}2{{ else }}0{{ end }}"
    # 0 title, 1 descr, 3 uploader, 4 imdburl
    search_area: "{{ if .Query.IMDBID }}4{{ else }}{{ end }}{{ if .Query.DoubanID }}1{{ else }}{{ end }}{{ if or .Query.IMDBID .Query.DoubanID }}{{ else }}0{{ end }}"
    # 0 AND, 2 exact
    search_mode: 0
    sort: "{{ .Config.sort }}"
    type: "{{ .Config.type }}"
    notnewword: 1

  rows:
    selector: table.torrents > tbody > tr:has(a[href^="download.php?id="])

  fields:
    category:
      selector: a[href^="?cat="]
      attribute: href
      filters:
        - name: querystring
          args: cat
    title_default:
      selector: a[href^="details.php?id="]
    title:
      selector: a[title][href^="details.php?id="]
      attribute: title
      optional: true
      default: "{{ .Result.title_default }}"
    details:
      selector: a[href^="details.php?id="]
      attribute: href
    download:
      selector: a[href^="download.php?id="]
      attribute: href
    poster:
      selector: img[data-src]
      attribute: data-src
    imdbid:
      # site currently only has a badge and rating, the id is not present. just in case a future update.
      selector: a[href*="imdb.com/title/tt"]
      attribute: href
    doubanid:
      # site currently only has a badge and rating, the id is not present. just in case a future update.
      selector: a[href*="movie.douban.com/subject/"]
      attribute: href
    date_elapsed:
      # time type: time elapsed (default)
      selector: td.rowfollow:nth-child(4) > span[title]
      attribute: title
      optional: true
      filters:
        - name: append
          args: " +08:00" # CST
        - name: dateparse
          args: "yyyy-MM-dd HH:mm:ss zzz"
    date_added:
      # time added
      selector: td.rowfollow:nth-child(4):not(:has(span))
      optional: true
      filters:
        - name: append
          args: " +08:00" # CST
        - name: dateparse
          args: "yyyy-MM-ddHH:mm:ss zzz"
    date:
      text: "{{ if or .Result.date_elapsed .Result.date_added }}{{ or .Result.date_elapsed .Result.date_added }}{{ else }}now{{ end }}"
    size:
      selector: td.rowfollow:nth-child(5)
      optional: true
      default: 512MB
    seeders:
      selector: td.rowfollow:nth-child(6)
      optional: true
      default: 0
    leechers:
      selector: td.rowfollow:nth-child(7)
      optional: true
      default: 0
    grabs:
      selector: td.rowfollow:nth-child(8)
      optional: true
      default: 0
    downloadvolumefactor:
      case:
        img.pro_free: 0
        img.pro_free2up: 0
        img.pro_50pctdown: 0.5
        img.pro_50pctdown2up: 0.5
        img.pro_30pctdown: 0.3
        "*": 1
    uploadvolumefactor:
      case:
        img.pro_50pctdown2up: 2
        img.pro_free2up: 2
        img.pro_2up: 2
        "*": 1
    minimumratio:
      text: 2.0
    minimumseedtime:
      # 1 day (as seconds = 24 x 60 x 60)
      text: 86400
    description:
      selector: td.rowfollow:nth-child(2)
      remove: a, b, font, img, span
# NexusPHP v1.9.11 2025-11-02



================================================
FILE: src/Jackett.Common/Definitions/1ptbar.yml
================================================
---
id: 1ptbar
name: 1ptbar
description: "1ptbar is a CHINESE Private Torrent Tracker for MOVIES / TV / E-LEARNING"
language: zh-CN
type: private
encoding: UTF-8
requestDelay: 2
links:
  - https://1ptba.com/

caps:
  # dont forget to update the path categories in the search block
  categorymappings:
    - {id: 401, cat: Movies, desc: "Movie(電影)", default: true}
    - {id: 402, cat: TV, desc: "TV Series(電視影劇)", default: true}
    - {id: 403, cat: TV, desc: "TV Shows(電視綜藝)", default: true}
    - {id: 404, cat: TV/Documentary, desc: "Documentaries(紀錄教育)", default: true}
    - {id: 405, cat: TV/Anime, desc: "Animations(卡通動漫)", default: true}
    - {id: 406, cat: Audio/Video, desc: "Music Videos(音樂短片/演唱會)", default: true}
    - {id: 407, cat: TV/Sport, desc: "Sports(體育賽事)", default: true}
    - {id: 408, cat: Audio, desc: "HQ Audio(高品质音频)", default: true}
    - {id: 410, cat: PC/0day, desc: "Software(軟體)", default: true}
    - {id: 411, cat: PC/Games, desc: "Games(電子遊戲)", default: true}
    - {id: 412, cat: Books/EBook, desc: "eBook(電子書)", default: true}
    - {id: 409, cat: Other, desc: "Misc(其他)", default: true}
    - {id: 610, cat: XXX/x264, desc: "AV(有碼)/HD Censored", default: false}
    - {id: 611, cat: XXX/x264, desc: "AV(無碼)/HD Uncensored", default: false}
    - {id: 612, cat: XXX/SD, desc: "AV(有碼)/SD Censored", default: false}
    - {id: 613, cat: XXX/SD, desc: "AV(無碼)/SD Uncensored", default: false}
    - {id: 614, cat: XXX/DVD, desc: "AV(無碼)/DVDiSo Uncensored", default: false}
    - {id: 615, cat: XXX/DVD, desc: "AV(有碼)/DVDiSo Censored", default: false}
    - {id: 616, cat: XXX/UHD, desc: "AV(有碼)/Blu-Ray Censored", default: false}
    - {id: 617, cat: XXX/UHD, desc: "AV(無碼)/Blu-Ray Uncensored", default: false}
    - {id: 618, cat: XXX/Pack, desc: "AV(網站)/0Day", default: false}
    - {id: 619, cat: XXX/Pack, desc: "IV(寫真影集)/Video Collection", default: false}
    - {id: 620, cat: XXX/ImageSet, desc: "IV(寫真圖集)/Picture Collection", default: false}
    - {id: 621, cat: XXX/Other, desc: "H-Game(遊戲)", default: false}
    - {id: 622, cat: XXX/Other, desc: "H-Anime(動畫)", default: fal
    