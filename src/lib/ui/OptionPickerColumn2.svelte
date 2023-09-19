<script>
  import { Button, Radios } from "@onsvisual/svelte-components";

  export let options = [];
  export let clickCallback = clicked;
  export let removeCatCallback = clicked;
  export let backButtonCallback = null;
  export let globalSelectedCategories = [];
  export let columnTitle = "column title";
  export let labeller = (option) => option.label;
  export let disabled = false;
  export let hiddenOnMobile = false;
  export let currentVar = null;

  let selectedRadio = null;
  let recentlyDeleted = false;

  export function updateRadiosOnDeletion(varCode) {
    if (varCode == options[0].var) {
      recentlyDeleted = true;
      selectedRadio = null;
    }
  }

  $: {
    if (recentlyDeleted) {
      recentlyDeleted = false;
    } else if (
      selectedRadio === null ||
      selectedRadio.split("-")[0] !== options[0].var
    ) {
      selectedRadio = null;
      for (let i = 0; i < options.length; i++) {
        if (checkIfOptionSelected(options[i], globalSelectedCategories)) {
          selectedRadio = options[i].var + "-" + i;
          break;
        }
      }
    } else if (
      !checkIfOptionSelected(
        options[+selectedRadio.split("-")[1]],
        globalSelectedCategories
      )
    ) {
      clickCallback(options[+selectedRadio.split("-")[1]]);
    }
  }

  $: console.log(selectedRadio);

  function clicked(option) {
    console.log("clicked", option);
  }

  function checkIfAnySelected(option, globalSelectedCategories) {
    for (let c of globalSelectedCategories) {
      if (c.topic === option.label) {
        return c.label;
      }
    }
    return false;
  }

  function checkIfOptionSelected(cat, globalSelectedCategories) {
    for (const s of globalSelectedCategories) {
      if (s.var === cat.var && s.code === cat.code) {
        return true;
      }
    }
    return false;
  }
</script>

<div class="column" class:hidden-first-column={hiddenOnMobile}>
  <div class:hidden-on-desktop={true}>
    {#if backButtonCallback != null}
      <Button variant={"secondary"} small={true} on:click={backButtonCallback}
        >Back</Button
      >
    {/if}
  </div>

  <div class="title-container">
    <h5 class="column-title">{columnTitle}</h5>
    {#if checkIfAnySelected(currentVar, globalSelectedCategories)}
      <Button
        variant={"secondary"}
        small={true}
        on:click={() => {
          removeCatCallback(currentVar);
          updateRadiosOnDeletion();
        }}
        {disabled}>Clear selection</Button
      >
    {/if}
  </div>

  {#if globalSelectedCategories.length === 3 && !checkIfAnySelected(currentVar, globalSelectedCategories)}
    At most three characteristics can be selected. To add another
    characteristic, please remove one of the three selected ones.
  {:else}
    <Radios
      items={options.map((d, i) => ({
        id: d.var + "-" + i,
        label: labeller(d),
      }))}
      bind:value={selectedRadio}
      {disabled}
      compact={true}
    />
    <slot />
  {/if}
</div>

<style>
  .hidden-first-column {
    display: none;
  }

  .title-container {
    display: flex;
    justify-content: space-between;
  }

  .column {
    width: 100%;
  }
  @media (min-width: 800px) {
    .column {
      width: 50%;
      padding-right: 9px;
    }
    .hidden-first-column {
      display: initial;
    }
    .hidden-on-desktop {
      display: none;
    }
  }
  .column-title {
    font-size: 20px;
  }
  p {
    padding: 0;
    margin: 0;
    margin-bottom: 3px;
  }
  input,
  label {
    cursor: pointer;
  }

  :global(.ons-radio) {
    font-size: 16px;
  }
</style>
