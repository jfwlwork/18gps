<script setup lang="ts">
interface SelectTabItem {
  key: string
  title: string
  label?: string
  count?: number
  desc?: string
  noticeType?: string
}

const props = defineProps<{
  items: SelectTabItem[]
  selectedKeys: string[]
}>()

const emit = defineEmits<{
  'update:selectedKeys': [string[]]
  'select': [SelectTabItem]
}>()

const selectHandle = (item: SelectTabItem) => {
  emit('update:selectedKeys', [item.key])
  emit('select', item)
}

console.log(props.selectedKeys)
console.log(props.items)
</script>

<template>
  <div class="content-box">
    <div class="item-box" v-for="item in items" :class="[item.key === selectedKeys[0] ? 'active' : '']" @click="selectHandle(item)">
      <div class="label">{{item.title}}</div>
      <div class="countBox" v-if="item.count">{{item.count}}</div>
    </div>
  </div>
</template>

<style scoped lang="less">
  .content-box{
    width: 100%;
    height: auto;

    .item-box{
      width: 100%;
      height: 40px;
      display: flex;
      align-items: center;
      padding: 0 24px;
      cursor: pointer;
      border-radius: 8px;
      justify-content: space-between;

      .label{
        display: flex;
        align-items: center;
      }

      .countBox{
        min-width: 25px;
        min-height: 17px;
        padding: 0 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(226,4,4,0.1);
        border-radius: 4px;

        font-weight: 400;
        font-size: 12px;
        color: #E20404;
        text-align: left;
        font-style: normal;
        text-transform: none;
      }

      &:hover {
        background: #f6f5f5;
      }

      &.active {
        background: #c5ced1;
        color: #346d91;
      }
    }
  }
</style>