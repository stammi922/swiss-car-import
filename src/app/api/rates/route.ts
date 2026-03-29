import { NextResponse } from 'next/server';
import { fetchExchangeRates } from '@/lib/exchangeRates';

export async function GET() {
  const data = await fetchExchangeRates();
  return NextResponse.json(data);
}
