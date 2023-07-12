<template>
    <div>
        <LineChart v-bind="lineChartProps" />
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { defineChartComponent, defineChartHook } from 'vue-chart-3';
import { ChartData, ChartOptions } from 'chart.js';

const LineChart = defineChartComponent('line-chart', 'line');
const useLineChart = defineChartHook('line');

export default defineComponent({
    name: 'LineChart',
    components: {
        LineChart
    },
    props: {
        chartData: {
            type: Object as () => ChartData<'line', any[], string>,
            required: true
        },
        options: {
            type: Object as () => ChartOptions,
            required: true
        }
    },
    setup(props) {
        const { lineChartProps } = useLineChart({
            chartData: props.chartData,
            options: props.options
        });

        return { lineChartProps };
    }
});
</script>  