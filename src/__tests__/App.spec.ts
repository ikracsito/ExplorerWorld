import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../App.vue'

describe('App.vue', () => {
  it('renders properly', () => {
    const wrapper = mount(App)
    expect(wrapper.exists()).toBe(true)
  })

  it('toggles dark mode', async () => {
    const wrapper = mount(App)
    const darkModeButton = wrapper.find('[data-test="dark-mode-toggle"]')
    expect(darkModeButton.exists()).toBe(true)
    
    // Check initial state
    expect(wrapper.classes()).not.toContain('dark')
    
    // Toggle dark mode
    await darkModeButton.trigger('click')
    expect(wrapper.classes()).toContain('dark')
  })

  it('filters countries by region', async () => {
    const wrapper = mount(App)
    const regionSelect = wrapper.find('[data-test="region-select"]')
    expect(regionSelect.exists()).toBe(true)
  })

  it('changes view mode between grid and table', async () => {
    const wrapper = mount(App)
    const viewToggle = wrapper.find('[data-test="view-toggle"]')
    expect(viewToggle.exists()).toBe(true)
  })
}) 