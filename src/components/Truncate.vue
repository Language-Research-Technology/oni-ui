<script setup lang="ts">
type Props = {
  text: string;
  lines?: number;
  className?: string;
};

const { className = '', lines = 7, text } = defineProps<Props>();

let clamp = 'line-clamp-7';
switch (lines) {
  case 1:
    clamp = 'line-clamp-1';
    break;
  case 2:
    clamp = 'line-clamp-2';
    break;
  case 3:
    clamp = 'line-clamp-3';
    break;
  case 4:
    clamp = 'line-clamp-4';
    break;
  case 5:
    clamp = 'line-clamp-5';
    break;
  case 6:
    clamp = 'line-clamp-6';
    break;
  default:
    clamp = 'line-clamp-7';
}

const tooltipClasses = [
  'invisible',
  'group-hover:visible',

  'opacity-0',
  'group-hover:opacity-100',
  'transition-opacity',
  'delay-100',
  'duration-400',

  'absolute',
  'z-50',
  'p-2',

  'text-sm',
  'text-white',
  'bg-gray-900',
  'rounded-lg',
  'shadow-lg',

  'left-0',
  'bottom-full',
  'mb-2',
].join(' ');

const arrowClasses = [
  'top-full',
  'border-t-[6px]',
  'border-t-gray-900',
  'left-4',
  'w-0',
  'h-0',
  'border-l-[6px]',
  'border-l-transparent',
  'border-r-[6px]',
  'border-r-transparent',
].join(' ');
</script>

<template>
  <div class="z-50 relative group">
    <p :class="`cursor-help ${clamp} ${className}`">
      {{ text }}
    </p>

    <div :class="tooltipClasses">
      {{ text }}

      <div :class="arrowClasses" />
    </div>
  </div>
</template>
