<script>
  import { base } from "$app/paths";
  import { setContext } from "svelte";
  import "@onsvisual/svelte-components/css/main.css";
  import "../app.css";
  import { themes, analyticsProps } from "$lib/config";
  import {
    AnalyticsBanner,
    PhaseBanner,
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

<AnalyticsBanner {analyticsProps}/>
<PhaseBanner phase="prototype"/>
<Header />
<Main>
  <slot />
</Main>
<Footer />
