# MediaFlow Coolify Environment Variables

Use this file as a copy-paste reference when setting environment variables on your **separate MediaFlow Proxy server** in Coolify.

## Copy/Paste Block

```env
# Required: protects MediaFlow endpoints and tokenized URL generation.
# Must match backend MEDIAFLOW_API_PASSWORD.
API_PASSWORD=popotube123

# Runtime tuning
ENABLE_HLS_PREBUFFER=true
HLS_PREBUFFER_SEGMENTS=5
HLS_PREBUFFER_CACHE_SIZE=50
HLS_PREBUFFER_MAX_MEMORY_PERCENT=80
HLS_PREBUFFER_EMERGENCY_THRESHOLD=90
HLS_PREBUFFER_INACTIVITY_TIMEOUT=60

ENABLE_DASH_PREBUFFER=true
DASH_PREBUFFER_SEGMENTS=5
DASH_PREBUFFER_CACHE_SIZE=50
DASH_PREBUFFER_MAX_MEMORY_PERCENT=80
DASH_PREBUFFER_EMERGENCY_THRESHOLD=90
DASH_PREBUFFER_INACTIVITY_TIMEOUT=60
DASH_SEGMENT_CACHE_TTL=60

# Reverse proxy trust. Tighten this to your trusted proxy CIDR when known.
# Temporary permissive value:
FORWARDED_ALLOW_IPS=*

# Optional, but recommended for multi-worker/shared caching setups
# REDIS_URL=redis://default:9pr7V9GKr5GbwPB4miazQGh22yrXhLPk@redis-18815.c262.us-east-1-3.ec2.cloud.redislabs.com:18815
```

## Backend Alignment (Important)

In `backend/.env`, keep these values aligned with your MediaFlow server:

- `MEDIAFLOW_BASE_URL` = your MediaFlow public URL
- `MEDIAFLOW_API_PASSWORD` = same as `API_PASSWORD` above
- `MEDIAFLOW_ENABLED=true`

## Quick Verification

After saving variables in Coolify and redeploying MediaFlow:

1. `GET /health` should return `200`
2. `GET /proxy/ip?api_password=...` should return `200`
3. Test playback in PoPoTube watch page
