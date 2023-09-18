<script>
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
      <span class="right-chevron">&rang;</span>
      {#if checkIfAnySelected(option, globalSelectedCategories)}
        <br />
        <div>
          Currently selected: {checkIfAnySelected(
            option,
            globalSelectedCategories
          )}
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
      padding-right: 9px;
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
  }
  button.plain-button {
    display: block;
    width: 100%;
    background-color: white;
    text-align: left;
    border: none;
    border-bottom: 1px solid #ccc;
    padding: 6px;
  }
  button.plain-button:last-child {
    border-bottom: none;
  }
  button.selected {
    background-color: steelblue;
    color: white;
  }
  button div {
    color: #555;
    margin: 0;
    padding: 0;
    margin-left: 9px;
    font-size: 12px;
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
