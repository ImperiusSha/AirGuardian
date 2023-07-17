
// store/index.ts

import { createStore } from 'vuex'

export default createStore({
    state: {
        co2Values: [] as { timestamp: string, value: number }[],
        pm10Values: [] as number[],
        tempValues: [] as number[]
    },
    mutations: {
        addCo2Value(state, value: number) {
            state.co2Values.push({
                timestamp: new Date().toISOString(),
                value: value,
            });
            if (state.co2Values.length > 15){
                state.co2Values.shift();
            }
        },
        // Entfernt doppelt Einträge durch die Verwendung von newSet()
        // Filtert leere Werte durch die Verwendung von filter()
        removeEmptyAndDuplicate(state) {
            state.co2Values = [...new Set(state.co2Values)].filter(value => value !== null && value !== undefined && value.toString() !== '');
        },
        addPm10Value(state, value: number) {
            state.pm10Values.push(value);
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
