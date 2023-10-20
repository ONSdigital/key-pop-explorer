<script>
  import Icon from "$lib/ui/Icon.svelte";
</script>

<div class="notice-container">
  <div class="notice-icon">
    <Icon type="error" />
  </div>
  <slot />
</div>

<style>
  .notice-container {
    position: relative;
    display: block;
    padding: 9px 12px 9px 44px;
    background-color: rgb(245, 245, 246);
    border-left: 4px solid rgb(112, 112, 113);
    margin: -3px 0 9px;
    font-size: 16px;
  }
  .notice-icon {
    position: absolute;
    font-size: 1.2em;
    transform: translate(-30px, 0);
    vertical-align: middle;
  }
</style>
