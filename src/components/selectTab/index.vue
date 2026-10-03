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

function selectHandle(item: SelectTabItem) {
  emit('update:selectedKeys', [item.key])
  emit('select', item)
}

console.log(props.selectedKeys)
console.log(props.items)
</script>

<template>
  <div class="box-content">
    <div v-for="item in items" class="item-box" :class="[item.key === selectedKeys[0] ? 'active' : '']" @click="selectHandle(item)">
      <div class="label">
        {{ item.title }}
      </div>
      <div v-if="item.count" class="countBox">
        {{ item.count }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
  .box-content{
    width: 100%;
    height: auto;

    .item-box{
      width: 100%;
      min-height: 40px;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 24px;
      cursor: pointer;
      border-radius: 8px;
      justify-content: space-between;

      .label{
        display: flex;
        align-items: center;
        flex: 1;
        min-width: 0;
        line-height: 20px;
        word-break: break-word;
      }

      .countBox{
        min-width: 25px;
        min-height: 17px;
        padding: 0 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
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
