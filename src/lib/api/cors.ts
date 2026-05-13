import { NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  'https://giljabi.com',
  'https://www.giljabi.com',
  'https://ibigmission.org',
  'https://www.ibigmission.org',
  'https://ibigband.com',
  'https://www.ibigband.com',
];

export function corsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '3600',
  };
}

export function handlePreflight(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}
