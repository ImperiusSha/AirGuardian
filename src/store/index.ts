// store/index.ts

import { createStore } from 'vuex'

interface SensorDataPoint {
    timestamp: string;
    location: {
        lat: number;
        lng: number;
    };
    value?: number;
}

// Funktion, um Werte zu einem bestimmten Array hinzuzufügen und zu begrenzen
function addToValues(state: any, key: string, value: number) {
    const values = state[key];
    if (values.length === 0 || values[values.length - 1].value !== value) {
        values.push({
            timestamp: new Date().toISOString(),
            value: value,
        });
        if (values.length > 10) {
            values.shift();
        }
    }
}


export default createStore({
    state: {
        co2Values: [] as { timestamp: string, value: number }[],
        temp_co2Values: [] as { timestamp: string, value: number }[],
        pm10Values: [] as { timestamp: string, value: number }[],
        pm25Values: [] as { timestamp: string, value: number }[],
        tempValues: [] as { timestamp: string, value: number }[],
        pressValues: [] as { timestamp: string, value: number }[],
        humidValues: [] as { timestamp: string, value: number }[],
        sensorData: [] as SensorDataPoint[],
        isDataEverLoaded: false,
    },
    mutations: {
        addCo2Value(state, value: number) {
            addToValues(state, 'co2Values', value);
            state.isDataEverLoaded = true;
        },
        addtempCo2Value(state, value: number) {
            addToValues(state, 'temp_co2Values', value);
            state.isDataEverLoaded = true;
        },
        addPM10Value(state, value: number) {
            addToValues(state, 'pm10Values', value);
            state.isDataEverLoaded = true;
        },
        addPM25Value(state, value: number) {
            addToValues(state, 'pm25Values', value);
            state.isDataEverLoaded = true;
        },
        addTempValue(state, value: number) {
            addToValues(state, 'tempValues', value);
            state.isDataEverLoaded = true;
        },
        addPressValue(state, value: number) {
            addToValues(state, 'pressValues', value);
            state.isDataEverLoaded = true;
        },
        addHumidValue(state, value: number) {
            addToValues(state, 'humidValues', value);
            state.isDataEverLoaded = true;
        },
        // Entfernt doppelt Einträge durch die Verwendung von new Set()
        // Filtert leere Werte durch die Verwendung von filter()
        removeEmptyAndDuplicate(state) {
            const keys = [
                'co2Values',
                'temp_co2Values',
                'pm10Values',
                'pm25Values',
                'tempValues',
                'pressValues',
                'humidValues',
            ];
            keys.forEach((key) => {
                // @ts-ignore
                state[key] = [...new Set(state[key])].filter(
                    (value) => value !== null && value !== undefined && value.toString() !== ''
                );
            });
        },
        SET_SENSOR_DATA(state, data) {
            state.sensorData = data;
        },
        ADD_LOCATION_AND_DATA(state, payload) {
            state.sensorData.push(payload);
        },
    },
    actions: {
        addLocationAndData({ commit }, payload) {
            commit('ADD_LOCATION_AND_DATA', payload);
        },
    },
    getters: {
        sensorData: (state) => state.sensorData,
    },
    modules: {},
});