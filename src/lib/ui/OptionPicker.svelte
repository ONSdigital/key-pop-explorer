<script>
  import OptionPickerColumn1 from "./OptionPickerColumn1.svelte";
  import OptionPickerColumn2 from "./OptionPickerColumn2.svelte";
  import { Button } from "@onsvisual/svelte-components";

  export let options = [];
  export let clickCallback = selectCat;
  export let removeCatCallback = removeCat;
  export let globalSelectedCategories = [];
  export let disabled = false;
  export let updateRadiosOnDeletion;

  function selectCat(variable, cat) {
    console.log(variable, cat);
  }

  function removeCat(variable, cat) {
    console.log(variable, cat);
  }

  let selectedColumn = null;
  //let selectedClassification = null;
  let selectedCategory = null;

  $: varToSelectedClassification = (function () {
    let result = {};
    options.forEach((opt) => (result[opt.label] = 0));
    return result;
  })();

  function moreCategories() {
    ++varToSelectedClassification[selectedColumn.label];
  }
  function fewerCategories() {
    --varToSelectedClassification[selectedColumn.label];
  }
</script>

<div class="container">
  <OptionPickerColumn1
    columnTitle="Select a variable"
    bind:selected={selectedColumn}
    clickCallback={() => {
      //selectedClassification = null;
    }}
    {options}
    {globalSelectedCategories}
    hiddenOnMobile={selectedColumn != null}
  />
  {#if selectedColumn != null}
    {#each [selectedColumn.vars[varToSelectedClassification[selectedColumn.label]]] as selectedClassification}
      <OptionPickerColumn2
        columnTitle={selectedColumn.label}
        bind:selected={selectedCategory}
        options={selectedClassification.cats}
        clickCallback={(category) =>
          clickCallback(selectedClassification, category)}
        removeCatCallback={(category) =>
          removeCatCallback(selectedClassification, category)}
        backButtonCallback={() => (selectedColumn = null)}
        bind:updateRadiosOnDeletion
        {globalSelectedCategories}
        currentVar={selectedColumn}
        {disabled}
      >
        {#if varToSelectedClassification[selectedColumn.label] > 0}
          <!-- FIXME: use proper up and down chevrons -->
          <Button variant={"secondary"} small={true} on:click={fewerCategories}
            >Show fewer</Button
          >
        {/if}
        {#if varToSelectedClassification[selectedColumn.label] < selectedColumn.vars.length - 1}
          <Button variant={"secondary"} small={true} on:click={moreCategories}
            >Show more</Button
          >
        {/if}
      </OptionPickerColumn2>
    {/each}
  {/if}
</div>

{#if false}
  <div>
    {#each options as option}
      <details>
        <summary
          style="border: 1px solid lightsteelblue; padding: 3px; width: 300px"
          >{option.label}<span class="chevron-right">&gt;</span></summary
        >
        {#each option.vars as v}
          <details style="margin-left: 21px">
            <summary
              >{v.cats.length} categories<span class="chevron-right">&gt;</span
              ></summary
            >
            <div style="margin-left: 21px">
              {#each v.cats as c}
                <div>
                  <button on:click={() => clickCallback(v, c)}
                    >+ {c.label}</button
                  >
                </div>
              {/each}
            </div>
          </details>
        {/each}
      </details>
    {/each}
  </div>
{/if}

<style>
  li {
    margin: 0;
    padding: 0;
  }

  .container {
    display: flex;
    flex-direction: column;
  }
  @media (min-width: 800px) {
    .container {
      flex-direction: row;
    }
  }

  .chevron-right {
    float: right;
  }
</style>
