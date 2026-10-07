<script lang="ts">
  // The foot of every teacher page: help on the left, the way TestParrot has
  // it, and who made the tool, About and Privacy on the right.
  import logo from '#lib/assets/edtechathon-logo.svg';
  import HelpButton from './HelpButton.svelte';
</script>

<footer>
  <HelpButton />
  <nav>
    <a class="credit" href="https://teacher.dev" target="_blank" rel="noopener noreferrer">
      <img src={logo} alt="" width="20" height="20" />
      Built by teacher.dev
    </a>
    <a href="/about">about</a>
    <a href="/privacy">privacy</a>
  </nav>
</footer>

<style>
  footer {
    max-width: 68rem;
    margin: 0 auto;
    padding: 1.25rem 1.25rem 1.75rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  nav {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 1.1rem;
  }
  a {
    color: var(--muted);
    font-size: 0.82rem;
    text-decoration: none;
  }
  a:hover {
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  .credit {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
</style>
