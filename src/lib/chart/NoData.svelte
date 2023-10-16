<script>
  export let height = 15;
  export let color = "lightgrey";
</script>

<div class="container" style="height: {height}px">
  <div class="block" style="width: 100%; background-color: {color};" />
  <div class="tick">No data</div>
</div>

<style>
  .container {
    margin: 30px 0 24px 0;
    box-sizing: border-box;
    position: relative;
    width: 100%;
    line-height: 1;
    font-size: 14px;
  }
  .block {
    position: absolute;
    top: 0;
    height: 100%;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .tick {
    line-height: normal;
  }
  .tick {
    position: absolute;
    z-index: 1;
    right: 0;
    top: calc(100% + 8px);
  }
</style>
