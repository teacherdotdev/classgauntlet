<script lang="ts">
  import logo from '#lib/assets/edtechathon-logo.svg';
  import ProsePage from '#lib/components/ProsePage.svelte';
  import { supportEmail, supportMailto } from '#lib/support.ts';
</script>

<svelte:head><title>About · Class Gauntlet</title></svelte:head>

<ProsePage
  eyebrow="About"
  title="About Class Gauntlet"
  lede="A free review game for the whole class. One student takes on everyone else, and a miss never sends anyone to the sidelines."
>
  <section class="card">
    <div class="heading">
      <img src={logo} alt="" width="40" height="40" />
      <h2>From the EdTech-a-thon</h2>
    </div>
    <p>
      Class Gauntlet is a project from the
      <a href="https://edtechathon.com" target="_blank" rel="noopener noreferrer">EdTech-a-thon</a>, a community of builders
      making free tools for classrooms. It began with a 7th-grade math teacher who wanted a review game where one student faces
      the rest of the class, and where nobody gets knocked out. Learn more about who we are and what else we’re building at
      <a href="https://edtechathon.com" target="_blank" rel="noopener noreferrer">edtechathon.com</a>.
    </p>
    <figure>
      <img src="/edtechathon-2026.jpg" alt="Participants of the 2026 EdTech-a-thon" />
      <figcaption>EdTech-a-thon 2026</figcaption>
    </figure>
    <p>
      It is adapted from an
      <a href="https://github.com/deadbeef101010/1v100-edtechathon" target="_blank" rel="noopener noreferrer">open-source EdTech-a-thon project</a>
      (Apache 2.0), and its own code is open too, on
      <a href="https://github.com/teacherdotdev/classgauntlet" target="_blank" rel="noopener noreferrer">GitHub</a>.
    </p>
  </section>

  <section class="card">
    <h2>Our promise</h2>
    <ul>
      <li><strong>Zero paywalls.</strong></li>
      <li><strong>Zero ads.</strong></li>
      <li><strong>Zero tracking of personal data.</strong></li>
    </ul>
  </section>

  <section class="card">
    <h2>Feedback &amp; ideas</h2>
    <p>
      We’d love to hear from you. Tell us what’s working, what’s not, or pitch us an idea for a tool you wish existed. We’re
      here to help.
    </p>
    <div><a class="btn-primary" href={supportMailto('feedback')}>Email {supportEmail}</a></div>
  </section>
</ProsePage>

<style>
  .heading {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  figure {
    margin: 0;
  }
  figure img {
    display: block;
    width: 100%;
    border-radius: var(--radius);
  }
  figcaption {
    margin-top: 0.4rem;
    color: var(--muted);
    font-size: 0.82rem;
    text-align: center;
  }
</style>
