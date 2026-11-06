import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import TermsView from '@/components/TermsView.vue';

describe('TermsView', () => {
  it('emite accept ao aceitar os termos', async () => {
    const wrapper = mount(TermsView);

    await wrapper.find('.btn-accept').trigger('click');

    expect(wrapper.emitted('accept')).toHaveLength(1);
    expect(wrapper.emitted('decline')).toBeUndefined();
  });

  it('emite decline ao recusar os termos', async () => {
    const wrapper = mount(TermsView);

    await wrapper.find('.btn-decline').trigger('click');

    expect(wrapper.emitted('decline')).toHaveLength(1);
    expect(wrapper.emitted('accept')).toBeUndefined();
  });
});
