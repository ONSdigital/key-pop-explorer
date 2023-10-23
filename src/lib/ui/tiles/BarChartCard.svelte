<script>
  import { texts, populationBases } from "$lib/config";
  import { makeDataNew } from "$lib/utils";
  import { Card } from "@onsvisual/svelte-components";

  export let title;
  export let table;
  export let data;
  export let chart_type;
</script>

{#if data.selected.residents?.[table.code]?.values}
  <Card {title}>
    {#if data.selected.residents[table.code].values === "blocked"}
      <span class="num-desc">{texts.blocked}</span>
    {:else if data.selected.residents[table.code].values.percent[0] == null}
      <span class="num-desc">{texts.nodata}</span>
    {:else}
      <svelte:component
        this={chart_type}
        data={data.selected && makeDataNew("residents", table.code, data)}
        showLegend={false}
      />
    {/if}
    <span class="num-desc">% of {populationBases[table.code]}</span>
  </Card>
{/if}

<style>
  .num-desc {
    display: block;
    margin-top: 10px;
    color: #707070;
    font-size: 14px;
    line-height: 1.3;
  }
</style>
