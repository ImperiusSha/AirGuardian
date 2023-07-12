import { ref } from "vue";

export default function useStatusIndicator() {
    const isConnectedIndicator = ref(false);

    setInterval(() => {
        isConnectedIndicator.value = Math.random() < 0.5; 
    }, 1000);

    return {
        isConnectedIndicator,
    };
}
