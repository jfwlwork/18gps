<script setup lang="ts">
import {defineProps} from "vue"
 const props = defineProps({
   item:{
     type:Array,
     default:() => []
   },
   selectedKeys:{
     type:String,
     default:''
   }
 })
const emit = defineEmits(['select'])
</script>

<template>
  <div class="content-box">
    <div class="item-box" v-for="item in item">123</div>
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
      padding-left: 24px;
      cursor: pointer;
      border-radius: 8px;

      &:hover {
        background: #c5ced1;
        color: #346d91;
      }
    }
  }
</style>