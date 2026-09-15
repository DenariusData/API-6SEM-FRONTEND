<script setup>
import logoUrl from '@/assets/logo.png'
</script>

<template>
  <div class="aka-logo-container">
    <div class="logo-graphic-wrapper">
      <img
        :src="logoUrl"
        alt="AkaVision Logo"
        class="logo-image"
      />
    </div>

    <div class="brand-text-block">
      <h1 class="brand-title">AkaVision</h1>
      <p class="brand-subtitle">AKAER ENGENHARIA S.A.</p>
    </div>
  </div>
</template>

<style scoped>
.aka-logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  user-select: none;
}

.logo-graphic-wrapper {
  position: relative;
  margin-bottom: 0.75rem;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.aka-logo-container:hover .logo-graphic-wrapper {
  transform: translateY(-4px) scale(1.03);
}

.logo-image {
  width: 175px;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 12px 20px rgba(0, 0, 0, 0.35));
}

.brand-text-block {
  margin-top: 0.5rem;
}

.brand-title {
  font-size: 2.35rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.02em;
  line-height: 1.1;
  font-family: var(--font-sans);
}

.brand-subtitle {
  font-size: 0.75rem;
  font-weight: 700;
  color: #d8b4fe;
  letter-spacing: 0.18em;
  margin-top: 0.35rem;
  text-transform: uppercase;
  opacity: 0.9;
}
</style>
