<script>
  import OptionPickerColumn1 from "./OptionPickerColumn1.svelte";
  import OptionPickerColumn2 from "./OptionPickerColumn2.svelte";
  import Icon from "./Icon.svelte";
  import { religionComparatorByName } from "$lib/utils";
  // import { Button } from "@onsvisual/svelte-components";

  export let options = [];
  export let clickCallback = selectCat;
  export let removeCatCallback = removeCat;
  export let globalSelectedCategories = [];
  export let disabled = false;

  export let activeColumn = null;

  function selectCat(variable, cat) {
    console.log(variable, cat);
  }

  function removeCat(variable, cat) {
    console.log(variable, cat);
  }

  $: varToSelectedClassification = (function () {
    let result = {};
    options.forEach((opt) => (result[opt.label] = 0));
    return result;
  })();

  function moreCategories() {
    ++varToSelectedClassification[activeColumn.label];
  }
  function fewerCategories() {
    --varToSelectedClassification[activeColumn.label];
  }

  function getCategoryList(classification) {
    if (classification.key !== "religion_tb") {
      return classification.cats;
    }

    // Sort alphabetically, with Other and Not Answered at the end
    return classification.cats.sort(religionComparatorByName);
  }
</script>

<div class="container">
  <OptionPickerColumn1
    columnTitle="Select a variable"
    bind:selected={activeColumn}
    clickCallback={() => {
      //activeClassification = null;
    }}
    {options}
    {globalSelectedCategories}
    hiddenOnMobile={activeColumn != null}
  />
  {#key activeColumn}
    {#if activeColumn != null}
      {#each [activeColumn.vars[varToSelectedClassification[activeColumn.label]]] as activeClassification}
        <OptionPickerColumn2
          columnTitle={activeColumn.label}
          options={getCategoryList(activeClassification)}
          clickCallback={(category) =>
            clickCallback(activeClassification, category)}
          removeCatCallback={(category) =>
            removeCatCallback(activeClassification, category)}
          backButtonCallback={() => (activeColumn = null)}
          {globalSelectedCategories}
          currentVar={activeColumn}
          {disabled}
        >
          {#if varToSelectedClassification[activeColumn.label] > 0}
            <button class="btn-link" on:click={fewerCategories}
              ><Icon type="chevron" rotation={90} /> Show fewer</button
            >
          {/if}
          {#if varToSelectedClassification[activeColumn.label] < activeColumn.vars.length - 1}
            <button class="btn-link" on:click={moreCategories}
              ><Icon type="chevron" rotation={-90} /> Show more</button
            >
          {/if}
        </OptionPickerColumn2>
      {/each}
    {/if}
  {/key}
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    margin-bottom: 12px;
  }
  @media (min-width: 800px) {
    .container {
      flex-direction: row;
    }
  }
</style>
