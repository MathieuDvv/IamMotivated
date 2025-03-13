<script setup>
import { ref, onMounted, watch } from 'vue'
import { useCookies } from 'vue3-cookies'
import LetterGenerator from './components/LetterGenerator.vue'
import LetterPreview from './components/LetterPreview.vue'
import IdCard from './components/IdCard.vue'
import { InformationCircleIcon } from '@heroicons/vue/24/outline'

const { cookies } = useCookies()
const currentLanguage = ref('en')
const idCardRef = ref(null)
const showCredits = ref(false)

// Load user preferences from cookies on mount
onMounted(() => {
  // Load language preference
  const savedLanguage = cookies.get('userLanguage')
  if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'fr')) {
    currentLanguage.value = savedLanguage
  }
})

// Watch for language changes and save to cookies
const changeLanguage = (language) => {
  currentLanguage.value = language
  cookies.set('userLanguage', language, '1y')
}

// Toggle credits modal
const toggleCredits = () => {
  showCredits.value = !showCredits.value
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <nav class="bg-[#FFFFFC] h-16 flex items-center justify-between px-6 sticky top-0 z-10">
      <h1 class="text-xl font-bold text-[#090C9B]">I am Motivated</h1>
      <div class="flex space-x-3 items-center">
        <button 
          @click="changeLanguage('en')" 
          class="w-8 h-8 rounded-full overflow-hidden border-2 flex items-center justify-center"
          :class="currentLanguage === 'en' ? 'border-[#090C9B]' : 'border-transparent'"
        >
          <span class="text-xl">🇬🇧</span>
        </button>
        <button 
          @click="changeLanguage('fr')" 
          class="w-8 h-8 rounded-full overflow-hidden border-2 flex items-center justify-center"
          :class="currentLanguage === 'fr' ? 'border-[#090C9B]' : 'border-transparent'"
        >
          <span class="text-xl">🇫🇷</span>
        </button>
        <button
          @click="toggleCredits"
          class="w-8 h-8 rounded-full overflow-hidden border-2 flex items-center justify-center text-[#090C9B] hover:bg-[#B4C5E4]/20"
          :class="showCredits ? 'border-[#090C9B]' : 'border-transparent'"
          title="Credits"
        >
          <InformationCircleIcon class="h-5 w-5" />
        </button>
      </div>
    </nav>

    <div class="flex flex-1 overflow-hidden">
      <div class="w-1/4 bg-[#FFFFFC] overflow-hidden h-[calc(100vh-4rem)]">
        <LetterGenerator :language="currentLanguage" :id-card-ref="idCardRef" />
      </div>
      <div class="w-3/4 bg-[#736F72] overflow-hidden h-[calc(100vh-4rem)]">
        <LetterPreview :language="currentLanguage" :id-card-ref="idCardRef" />
      </div>
    </div>
    
    <!-- ID Card Sidebar -->
    <IdCard :language="currentLanguage" ref="idCardRef" />
    
    <!-- Credits Modal -->
    <div v-if="showCredits" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="toggleCredits">
      <div class="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-[#3C3744]">Credits</h3>
          <button @click="toggleCredits" class="text-gray-400 hover:text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="space-y-4">
          <div>
            <h4 class="font-medium text-[#090C9B]">AI Models</h4>
            <ul class="list-disc list-inside text-sm text-[#3C3744] ml-2">
              <li>Claude 3.5 Haiku by Anthropic</li>
              <li>Deepseek Coder by Deepseek AI</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-[#090C9B]">Technologies</h4>
            <ul class="list-disc list-inside text-sm text-[#3C3744] ml-2">
              <li>Vue.js - Frontend framework</li>
              <li>Tailwind CSS - Styling</li>
              <li>Heroicons - Icons</li>
              <li>Node.js - Backend</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-[#090C9B]">Created by</h4>
            <p class="text-sm text-[#3C3744] ml-2">Mathieu Da Vinha - <a href="https://x.com/dotSlimy" class="text-[#090C9B]">@dotSlimy</a></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
:root {
  --jet: #3c3744;
  --duke-blue: #090c9b;
  --byzantine-blue: #3d52d5;
  --powder-blue: #b4c5e4;
  --ivory: #fbfff1;
  --white: #FFFFFC;
  --grey: #736F72;
}

body {
  margin: 0;
  padding: 0;
  width: 100%;
  overflow-x: hidden;
}

/* Global focus styles */
input:focus, 
button:focus, 
select:focus, 
textarea:focus {
  outline: none !important;
}

/* Ensure focus rings are visible and not cut off */
.focus-visible:focus,
input:focus,
button:focus,
select:focus,
textarea:focus {
  box-shadow: 0 0 0 2px rgba(61, 82, 213, 0.5) !important;
}
</style>
