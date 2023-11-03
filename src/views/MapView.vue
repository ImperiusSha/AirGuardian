<template>
    <div class="swipe-area" @touchstart="handleTouchStart" @touchend="handleTouchEnd" @click="handleClick">
        <div class="line top-line"></div>
        <div class="line bottom-line"></div>
    </div>
    <div>
        <LeafletMap />
    </div>
</template>




<script lang="ts">
import LeafletMap from '@/components/LeafletMap.vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

export default {
    setup() {
        const router = useRouter();
        const touchStartX = ref(0);
        const touchEndX = ref(0);

        const handleTouchStart = (e: TouchEvent) => {
            touchStartX.value = e.touches[0].clientX;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            touchEndX.value = e.changedTouches[0].clientX;
            handleSwipeGesture();
        };

        const handleSwipeGesture = () => {
            const minSwipeDistance = 30;
            if (touchEndX.value - touchStartX.value > minSwipeDistance) {
                // Swipe nach rechts
                router.push({ name: 'Homepage' });
            }
        };

        const handleClick = () => {
            router.push({ name: 'Homepage'});

        }

        return {
            handleTouchStart,
            handleTouchEnd,
            handleClick
        }
    },
    components: {
        LeafletMap
    }
}
</script>

<style scoped>
.swipe-area {
    position: fixed;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 10%;
    background: rgba(0, 0, 0, 0.1);
    z-index: 1000;

}

.line {
    position: absolute;
    width: 20px; 
    height: 1px; 
    background-color: rgba(255, 255, 255, 0.7);
}

.top-line {
    top: 0;
    left: 0;
    transform: rotate(-65deg);
    transform-origin: top right;
    scale: 2.3;
}

.bottom-line {
    bottom: 0;
    left: 0;
    transform: rotate(65deg);
    transform-origin: bottom right;
    scale: 2.3;
}


</style>
