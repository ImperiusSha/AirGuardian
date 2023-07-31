// store/index.ts

import { createStore } from 'vuex'

export default createStore({
    state: {
        co2Values: [] as { timestamp: string, value: number }[],
        pm10Values: [] as { timestamp: string, value: number }[],
        pm25Values: [] as { timestamp: string, value: number }[],
        tempValues: [] as number[]
    },
    mutations: {
        addCo2Value(state, value: number) {
            // Prüfen, ob bereits ein Element mit dem gleichen Zeitstempel vorhanden ist
            // Prüfen, ob vorheriges Element den gleichen Wert hat
            if (state.co2Values.length === 0 || state.co2Values[state.co2Values.length - 1].value !== value) {
                state.co2Values.push({
                    timestamp: new Date().toISOString(),
                    value: value,
                });
                // Begrenzung auf maximal 15 Werte im Diagramm
                if (state.co2Values.length > 15) {
                    state.co2Values.shift();
                }
            }
        },
        addPM10Value(state, value: number) {
            // Prüfen, ob bereits ein Element mit dem gleichen Zeitstempel vorhanden ist
            // Prüfen, ob vorheriges Element den gleichen Wert hat
            if (state.pm10Values.length === 0 || state.pm10Values[state.pm10Values.length - 1].value !== value) {
                state.pm10Values.push({
                    timestamp: new Date().toISOString(),
                    value: value,
                });
                // Begrenzung auf maximal 15 Werte im Diagramm
                if (state.pm10Values.length > 15) {
                    state.pm10Values.shift();
                }
            }
        },
        addPM25Value(state, value: number) {
            // Prüfen, ob bereits ein Element mit dem gleichen Zeitstempel vorhanden ist
            // Prüfen, ob vorheriges Element den gleichen Wert hat
            if (state.pm25Values.length === 0 || state.pm25Values[state.pm25Values.length - 1].value !== value) {
                state.pm25Values.push({
                    timestamp: new Date().toISOString(),
                    value: value,
                });
                // Begrenzung auf maximal 15 Werte im Diagramm
                if (state.pm25Values.length > 15) {
                    state.pm25Values.shift();
                }
            }
        },
        // Entfernt doppelt Einträge durch die Verwendung von newSet()
        // Filtert leere Werte durch die Verwendung von filter()
        removeEmptyAndDuplicate(state) {
            state.co2Values = [...new Set(state.co2Values)].filter(value => value !== null && value !== undefined && value.toString() !== '');
            state.pm10Values = [...new Set(state.pm10Values)].filter(value => value !== null && value !== undefined && value.toString() !== '');
            state.pm25Values = [...new Set(state.pm25Values)].filter(value => value !== null && value !== undefined && value.toString() !== '');
        },
        addTempValue(state, value: number) {
            state.tempValues.push(value);
        },
    },
    actions: {

    },
    getters: {

    },
    modules: {

    }
})
