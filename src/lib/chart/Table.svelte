<script>
  export let data;
  export let offset = 1;
</script>

<table class="table-rank text-small">
  <tbody>
    {#each data as d, i}
      <tr>
        <!-- <td class="w35">{i + offset}.</td> -->
        <td><strong>{d.name}</strong></td>
        <td class="text-right">{d.value.toFixed(1)}%</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .table-rank {
    width: 100%;
    line-height: 1.5;
    margin-top: 8px;
    font-size: 14px;
    border-collapse: collapse;
  }
  .table-rank td {
    padding: 0 0 10px;
  }
  .w35 {
    width: 35px;
  }
  .text-small {
    font-size: 14px;
  }
  .text-right {
    text-align: right;
  }
</style>
