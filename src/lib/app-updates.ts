import { APP_VERSION, GITHUB_REPO } from './config';

export interface UpdateCheck {
  status: 'latest' | 'update' | 'unconfigured' | 'error';
  latest?: string;
  url?: string;
}

function parseVer(v: string): number[] {
  return v.replace(/^v/i, '').split('.').map((x) => parseInt(x, 10) || 0);
}

function isNewer(latest: string, current: string): boolean {
  const a = parseVer(latest);
  const b = parseVer(current);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d !== 0) return d > 0;
  }
  return false;
}

/**
 * Check GitHub releases for a newer version. Tag releases as v1.2.3 and attach
 * the APK as a release asset — users download it straight from the release page.
 */
export async function checkForUpdate(): Promise<UpdateCheck> {
  if (!GITHUB_REPO) return { status: 'unconfigured' };
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return { status: 'error' };
    const data = await res.json();
    const latest: string | undefined = data?.tag_name;
    if (!latest) return { status: 'error' };
    return isNewer(latest, APP_VERSION)
      ? { status: 'update', latest, url: data.html_url }
      : { status: 'latest', latest };
  } catch {
    return { status: 'error' };
  }
}
