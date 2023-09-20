<script>
  import { Button } from "@onsvisual/svelte-components";
  import Icon from "./Icon.svelte";

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
    <ol class="ons-breadcrumb__items ons-u-fs-s">
      <li class="ons-breadcrumb__item" id="breadcrumb-1">
        <button class="btn-link ons-breadcrumb__link" on:click={backButtonCallback}
        >Back</button>
        <svg class="ons-svg-icon svelte-w4p0hu" viewBox="0 0 8 13" xmlns="http://www.w3.org/2000/svg" focusable="false" fill="currentColor">
          <path d="M5.74,14.28l-.57-.56a.5.5,0,0,1,0-.71h0l5-5-5-5a.5.5,0,0,1,0-.71h0l.57-.56a.5.5,0,0,1,.71,0h0l5.93,5.93a.5.5,0,0,1,0,.7L6.45,14.28a.5.5,0,0,1-.71,0Z" transform="translate(-5.02 -1.59)"></path>
        </svg>
      </li>
    </ol>
    {/if}
  </div>

  <div class="title-container">
    <h5 class="column-title">{columnTitle}</h5>
    {#if checkIfAnySelected(currentVar, globalSelectedCategories)}
      <Button
        variant={"secondary"}
        small={true}
        on:click={() => removeCatCallback(currentVar)}
        {disabled}>Clear selection</Button
      >
    {/if}
  </div>

  <div class="ons-radios__items">
    {#if globalSelectedCategories.length === 3 && !checkIfAnySelected(currentVar, globalSelectedCategories)}
      At most three characteristics can be selected. To add another
      characteristic, please remove one of the three selected ones.
    {:else}
      {#each options as option, i}
        <span class="ons-radios__item ons-radios__item--no-border">
          <span class="ons-radio ons-radio--no-border">
            <input
              type="radio"
              id={"category-option-" + i}
              name="selected-category"
              class="ons-radio__input ons-js-radio"
              checked={checkIfOptionSelected(option, globalSelectedCategories)}
              {disabled}
              on:click={() => clickCallback(option)}
            />
            <label for={"category-option-" + i} class="ons-radio__label">
              {labeller(option)}
            </label>
          </span>
        </span>
      {/each}
      <slot />
    {/if}
  </div>
</div>

<style>
  .hidden-first-column {
    display: none;
  }

  .title-container {
    display: flex;
    justify-content: space-between;
  }

  .title-container :global(button) {
    transform: translateY(-10px);
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
  .ons-radios__item {
    border-top: 1px solid #ccc;
    padding: 4px 4px;
    min-height: 36px;
    margin: 0;
  }
  .ons-radios__item:last-of-type {
    border-bottom: 1px solid #ccc;
    margin-bottom: 6px;
  }
</style>
