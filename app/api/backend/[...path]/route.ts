import { NextRequest, NextResponse } from 'next/server';

// This runs at REQUEST time, not build time.
// BACKEND_URL is read fresh from the environment on every call.
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:3001';

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  
  // Reconstruct query parameters from the incoming Next.js request boundary
  const searchParams = req.nextUrl.searchParams.toString();
  const queryString = searchParams ? `?${searchParams}` : '';
  const targetUrl = `${BACKEND_URL}/api/${path.join('/')}${queryString}`;

  const bodyText = req.method !== 'GET' && req.method !== 'HEAD'
    ? await req.text()
    : undefined;
    
  const body = bodyText && bodyText.length > 0 ? bodyText : undefined;

  const headers: Record<string, string> = {};
  const contentType = req.headers.get('content-type');
  if (contentType) {
    headers['Content-Type'] = contentType;
  } else {
    headers['Content-Type'] = 'application/json';
  }

  // Fastify crashes if it receives a json content-type but an explicitly empty body.
  if (!body && headers['Content-Type']?.includes('application/json')) {
    delete headers['Content-Type'];
  }

  const response = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
  });

  const data = await response.text();
  return new NextResponse(data, {
    status: response.status,
    headers: { 'Content-Type': response.headers.get('content-type') || 'application/json' },
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
