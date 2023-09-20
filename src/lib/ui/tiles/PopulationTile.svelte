<script>
  import Em from "$lib/ui/Em.svelte";
  import { Card } from "@onsvisual/svelte-components";

  import { texts } from "$lib/config";
  import { calcPopPercentString } from "$lib/utils";

  export let data;
</script>

<Card title="Population">
  {#if data.selected.total_pop.count == null}
    <div class="num-desc">{texts.nodata}</div>
  {:else}
    <div class="num-big">
      {data.selected.total_pop.count.toLocaleString()}
    </div>
    <div class="num-suffix">people</div>
    <div class="num-desc">
      <Em color="lightgrey">{calcPopPercentString(
        data.selected.total_pop.percent
      )}%</Em> of the total population of England and Wales
    </div>
  {/if}
</Card>

<style>
  .num-big {
    display: block;
    font-size: 2.8rem;
    font-weight: bold;
    line-height: 1.2;
    white-space: nowrap;
  }
  .num-suffix {
    display: block;
    max-width: 100%;
    margin-left: 2px;
  }
  .num-desc {
    /* TODO share code with .num-desc in index.svelte? */
    display: block;
    margin-top: 10px;
    color: #707070;
    font-size: 14px;
    line-height: 1.3;
  }
</style>
