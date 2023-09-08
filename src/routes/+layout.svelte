<script>
  import { base } from "$app/paths";
  import { setContext } from "svelte";
  import "@onsvisual/svelte-components/css/main.css";
  import { themes } from "$lib/config";
  import Warning from "$lib/ui/Warning.svelte";
  import {
    Header,
    Main,
    Footer,
  } from "@onsvisual/svelte-components";

  // STYLE CONFIG
  // Set theme globally (options are 'light' or 'dark')
  let theme = "light";
  setContext("theme", themes[theme]);
</script>

<svelte:head>
  <link rel="icon" href="{base}/favicon.png" />
</svelte:head>

<Warning>
  WARNING! This is a prototype. Data is synthetic. It is NOT actual 2021 Census
  data.
</Warning>
<Header />
<Main>
  <slot />
</Main>
<Footer />
