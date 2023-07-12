<template>
    <div>
        <line-chart :chart-data="datacollection" :options="options"></line-chart>
    </div>
</template>

<script lang="ts">
import { defineComponent, nextTick, ref, watch } from 'vue';
import { LineChart } from 'vue-chart-3';
import { useBluetooth } from '../composables/useBluetooth';

// Benötigtes Interface, um Struktur von chartData zu repräsentieren
// Wenn nicht vorhanden, interpretiert TS Werte als "never", da es
// aus ChartData nicht die genauen Typen auslesen kann
interface LocalChartData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        borderColor: string;
        fill: boolean;
    }[];
}

export default defineComponent({
    name: 'Pm10Chart',
    components: {
        LineChart
    },
    // Verwendung des "reactive"-Werkzeug von Vue 3, um reaktive Dateneigenschaft herzustellen
    // Ermöglicht die automatische Aktualisierung des Diagrammes bei Änderungen der Werte
    // eines Objektes, da dieses reaktiv gemacht wurde
    setup() {
        console.log("Im Setup von defineComponent_PM10Chart angekommen.");
        const { pm10Value } = useBluetooth();  // PM10-Wert aus useBluetooth importieren  
        console.log("pm10Value von useBluetooth() erhalten." + pm10Value);
        const chartData = ref<LocalChartData>({
            labels: [],
            datasets: [
                {
                    label: 'PM10',
                    data: [],
                    borderColor: 'rgba(75,192,192,1)',
                    fill: false,
                },
            ],
        });

        // Watch-Funktion zur Überwachung von Änderungen an pm10Value
        watch(pm10Value, async (newVal) => {
            console.log("TestTest123");
            nextTick().then(() => {
                if (newVal !== null) { 
                    let currentTime = new Date();
                    chartData.value.labels.push(currentTime.toISOString());
                    chartData.value.datasets[0].data.push(newVal);
                    console.log("Neuer PM10-Wert erhalten um " + currentTime);

                    // Überprüfen, ob die Länge des Arrays 30 überschreitet und ggf. das erste Element entfernen
                    if (chartData.value.labels.length > 30) {
                        chartData.value.labels.shift();
                        chartData.value.datasets[0].data.shift();
                    }
                }
            })
        });

        const options = {
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'second',
                    },
                },
                y: {
                    beginAtZero: true,
                },
            },
        };

        return {
            pm10Value,
            datacollection: chartData,
            options,
        };
    }
})
</script>
