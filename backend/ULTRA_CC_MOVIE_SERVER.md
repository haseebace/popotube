# Ultra.cc Media Server Setup Guide (2024-2025)

This guide assumes you are on an Ultra.cc plan that supports Plex (e.g., Scorpion-v2, priced around €13.95/month).

## 1. Comparing Your Sources

### Usenet
Usenet is an older internet protocol primarily used for high-speed, secure file sharing.
- **Provider:** You pay for a "pipe" (e.g., [Newshosting](https://www.newshosting.com/)).
- **Indexer:** You pay for a "search engine" (e.g., [NZBGeek](https://nzbgeek.info/)).
- **Pros:** Full speed, no seeding (no ratio), SSL encrypted.
- **Cons:** Monthly/yearly cost.

### Private Trackers
Invite-only torrent sites.
- **Pros:** High quality, files stay "alive" longer.
- **Cons:** You MUST seed (share) what you download to maintain a "Ratio." 
- **Beginner Entry:** Watch [r/OpenSignups](https://www.reddit.com/r/OpenSignups/) for **TorrentLeech**.

---

## 2. Core Installation (Ultra.cc CCC)
Log into your **Control Panel** and install these applications in order:

1. **Download Client:** Install **qBittorrent** (Torrents) and/or **SABnzbd** (Usenet).
2. **Indexer Manager:** Install **Prowlarr**.
3. **The Automation:** Install **Radarr** (Movies) and **Sonarr** (TV).
4. **Streaming:** Install **Plex Media Server**.

---

## 3. Configuration & Hardlinks

### **Step 1: Folder Structure**
To prevent using double disk space, you must use **Hardlinks**. Use the file manager in your CCC to create:
- `/home/user/data/downloads`
- `/home/user/data/media/movies`
- `/home/user/data/media/tv`

### **Step 2: Connecting Prowlarr**
1. Open **Prowlarr**.
2. Go to **Indexers** > Add your public trackers (1337x, etc.).
3. Go to **Settings** > **Apps** > Add Radarr and Sonarr using their **API Keys** (found in their `Settings > General` tabs).

### **Step 3: Radarr & Sonarr Hardlinks**
1. Open **Radarr** and **Sonarr**.
2. Go to **Settings** > **Media Management**.
3. Check **"Use Hardlinks instead of Copy"**.
4. Set your Root Folder to `/home/user/data/media/movies` (or `/tv`).

### **Step 4: Download Clients**
1. In Radarr/Sonarr, go to **Settings** > **Download Clients**.
2. Add **qBittorrent** (use the host/port/login from your Ultra.cc panel).

---

## 4. Final Step: Plex "Claiming"
To use Plex on Ultra.cc for the first time, you must "claim" the server.
1. Open the Plex link from your Control Panel.
2. If it asks you to sign in, use your Plex account.
3. If the server is not found, you may need to create an **SSH Tunnel** to your seedbox (Ultra.cc provides a specific command for this in their documentation).
4. Add Libraries by pointing to:
   - **Movies:** `/home/user/data/media/movies`
   - **TV Shows:** `/home/user/data/media/tv`
