<!-- LocationModal.vue -->
<template>
    <div v-if="show" class="modal" @click="closeModal">
        <div class="modal-content" @click.stop>
            <div class="header">
                <h2>Standortdaten</h2>
                <span @click="closeModal" class="close-btn">&times;</span>
            </div>
            <div class="data-entry">CO2: <span>{{ data?.co2 || 0 }}</span></div>
            <div class="data-entry">PM10: <span>{{ data?.pm10 || 0 }}</span></div>
            <div class="data-entry">PM25: <span>{{ data?.pm25 || 0 }}</span></div>
            <div class="data-entry">Temperatur: <span>{{ data?.temp || 0 }}</span></div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    props: {
        show: Boolean,
        data: Object
    },
    methods: {
        closeModal() {
            this.$emit('close');
        }
    }
});
</script>

<style>
.modal {
    position: fixed;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background-color: #f2faff;
    padding-left: 20px;
    padding-right: 20px;
    border-radius: 10px;
    width: 300px;
    max-height: 400px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    overflow-y: auto;
}

.data-entry {
    font-size: 16px;
    margin-bottom: 10px;
}

.data-entry span {
    font-weight: bold;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.close-btn {
    right: 20px;
    font-size: 24px;
    cursor: pointer;
    color: #888;
}
</style>
