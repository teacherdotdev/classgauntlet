<script lang="ts">
  import logo from '#lib/assets/edtechathon-logo.svg';
</script>

<footer>
  <span class="note">
    Adapted from an <a href="https://github.com/deadbeef101010/1v100-edtechathon" target="_blank" rel="noopener noreferrer">open-source EdTech-a-thon project</a> (Apache 2.0).
  </span>
  <a class="built" href="https://teacher.dev" target="_blank" rel="noopener noreferrer">
    <img src={logo} alt="" width="18" height="18" />
    Built by teacher.dev
  </a>
</footer>

<style>
  footer {
    max-width: 68rem;
    margin: 0 auto;
    padding: 1.5rem 1.25rem 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .note {
    color: var(--muted);
    font-size: 0.78rem;
    max-width: 40rem;
  }
  .note a {
    color: inherit;
  }
  .built {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--muted);
    font-size: 0.82rem;
    text-decoration: none;
  }
  .built:hover {
    color: var(--accent);
  }
</style>
