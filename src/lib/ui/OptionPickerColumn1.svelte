<script>
  import Icon from "./Icon.svelte";
  import { trimLabel } from "$lib/utils";

  export let options = [];
  export let clickCallback = clicked;
  export let backButtonCallback = null;
  export let globalSelectedCategories = [];
  export let columnTitle = "column title";
  export let labeller = (option) => option.label;
  export let selected = null;
  export let hiddenOnMobile = false;

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
</script>

<div class="column" class:hidden-first-column={hiddenOnMobile}>
  {#if backButtonCallback != null}
    <button class="hidden-on-desktop" on:click={backButtonCallback}>Back</button
    >
  {/if}

  <h5 class="column-title">{columnTitle}</h5>

  {#each options as option}
    <button
      class:plain-button={true}
      class:selected={option === selected}
      on:click={() => {
        selected = option;
        clickCallback(option);
      }}
    >
      {labeller(option)}
      <span class="right-chevron"><Icon type="chevron"/></span>
      {#if checkIfAnySelected(option, globalSelectedCategories)}
        <br />
        <div class="selected-item-label">
          Selected: {trimLabel(checkIfAnySelected(
            option,
            globalSelectedCategories
          ))}
        </div>
      {/if}
    </button>
  {/each}

  <slot />
</div>

<style>
  .hidden-first-column {
    display: none;
  }
  .column {
    width: 100%;
  }
  @media (min-width: 800px) {
    .column {
      width: 50%;
      padding-right: 20px;
    }
    .hidden-first-column {
      display: initial;
    }
    .hidden-on-desktop {
      display: none;
    }
  }
  button.plain-button {
    font-size: 16px;
    font-family:"OpenSans","Helvetica Neue",arial,sans-serif !important;
  }
  button.plain-button {
    display: block;
    width: 100%;
    background-color: white;
    text-align: left;
    border: none;
    border-top: 1px solid #ccc;
    padding: 6px 4px;
    min-height: 36px;
  }
  button.plain-button:last-child {
    border-bottom: 1px solid #ccc;
  }
  button.plain-button:focus {
    outline: 3px solid var(--ons-color-sun-yellow, #fbc900);
  }
  button.selected {
    background-color: var(--link, #206095);
    color: white;
  }
  button div.selected-item-label {
    color: #555;
    margin: 0;
    padding: 6px 0;
    margin-left: 9px;
    font-size: 14px;
  }
  button.selected div {
    color: white;
  }
  .column-title {
    font-size: 20px;
  }
  .right-chevron {
    float: right;
  }
</style>
