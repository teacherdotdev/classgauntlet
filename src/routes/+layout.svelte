<script lang="ts">
  import '../app.css';
  let { children } = $props();

  // Cloudflare Web Analytics, only when the build has a token (production).
  // classgauntlet.com and the classgauntlet.teacher.dev mirror share one token,
  // so both hosts report into the same dashboard.
  const token = import.meta.env.VITE_CF_BEACON_TOKEN as string | undefined;
  if (token && !document.querySelector('script[data-cf-beacon]')) {
    const script = document.createElement('script');
    script.defer = true;
    script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    script.dataset.cfBeacon = JSON.stringify({ token });
    document.head.append(script);
  }
</script>

{@render children()}
