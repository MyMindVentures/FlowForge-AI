import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { config as loadEnv } from 'dotenv';

const rootDir = process.cwd();
const envFiles = ['.env.local', '.env'];

for (const envFile of envFiles) {
  const envPath = path.join(rootDir, envFile);
  if (fs.existsSync(envPath)) {
    loadEnv({ path: envPath, override: false });
  }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY?.trim();
const supabasePublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
const supabasePublishableDefaultKey = process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim();

function hasValue(value) {
  return Boolean(value && value.length > 0);
}

function isValidUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const issues = [];

if (!hasValue(supabaseUrl)) {
  issues.push('Missing VITE_SUPABASE_URL.');
} else if (!isValidUrl(supabaseUrl)) {
  issues.push('VITE_SUPABASE_URL must be a valid http or https URL.');
}

if (!hasValue(supabaseAnonKey) && !hasValue(supabasePublishableKey) && !hasValue(supabasePublishableDefaultKey)) {
  issues.push('Missing Supabase publishable frontend key. Set VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_PUBLISHABLE_KEY, or VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY.');
}

if (issues.length > 0) {
  console.error('\nSupabase environment configuration is incomplete.\n');
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }

  console.error('\nExpected local setup:');
  console.error('- Copy .env.example to .env.local.');
  console.error('- Set VITE_SUPABASE_URL to your project URL.');
  console.error('- Prefer VITE_SUPABASE_ANON_KEY for your public anon key.');
  console.error('- The app also accepts VITE_SUPABASE_PUBLISHABLE_KEY and VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY as compatibility aliases.');
  console.error('- For deployment, configure the same VITE_ variables in your hosting provider.');

  process.exit(1);
}

if (!hasValue(supabaseAnonKey) && hasValue(supabasePublishableKey)) {
  console.warn('\nUsing VITE_SUPABASE_PUBLISHABLE_KEY. VITE_SUPABASE_ANON_KEY is the preferred name going forward.\n');
}

if (!hasValue(supabaseAnonKey) && !hasValue(supabasePublishableKey) && hasValue(supabasePublishableDefaultKey)) {
  console.warn('\nUsing VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY. VITE_SUPABASE_ANON_KEY is the preferred name going forward.\n');
}

console.log('Supabase environment variables look valid.');