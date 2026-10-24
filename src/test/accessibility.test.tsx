import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axe from 'axe-core';
import { TrustBadge } from '../components/TrustBadge';
import { PermissionGate } from '../components/PermissionGate';
import { HomeView } from '../features/home/HomeView';
import { SettingsView } from '../features/settings/SettingsView';
import { ConversationView } from '../features/conversation/ConversationView';
import { SpeechToSignView } from '../features/speechToSign/SpeechToSignView';
import { LearnView } from '../features/learn/LearnView';
import { MemoryView } from '../features/memory/MemoryView';

describe('WCAG 2.2 Accessibility Audits (axe-core)', () => {
  it('renders TrustBadge with proper role and accessible descriptions', async () => {
    const { container } = render(
      <TrustBadge
        level="VERIFIED"
        provenance={{
          source: 'ISL Corpus',
          licence: 'CC-BY-4.0',
          reviewer: 'Deaf ISL Reviewer',
          reviewedOn: '2026-04-10'
        }}
      />
    );

    const badge = container.querySelector('[role="status"]');
    expect(badge).not.toBeNull();
    expect(badge?.getAttribute('aria-label')).toContain('VERIFIED');

    const results = await axe.run(container);
    const seriousViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(seriousViolations).toHaveLength(0);
  });

  it('renders PermissionGate with accessible role and high-contrast labels', async () => {
    const { container } = render(
      <PermissionGate
        feature="camera"
        onConsentGranted={() => {}}
      />
    );

    const gate = container.querySelector('[role="region"]');
    expect(gate).not.toBeNull();
    expect(gate?.getAttribute('aria-label')).toContain('camera permission gate');

    const results = await axe.run(container);
    const seriousViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(seriousViolations).toHaveLength(0);
  });

  it('HomeView passes axe-core accessibility checks', async () => {
    const { container } = render(
      <BrowserRouter>
        <HomeView />
      </BrowserRouter>
    );

    const results = await axe.run(container);
    const seriousViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(seriousViolations).toHaveLength(0);
  });

  it('SettingsView passes axe-core accessibility checks', async () => {
    const { container } = render(
      <BrowserRouter>
        <SettingsView />
      </BrowserRouter>
    );

    const results = await axe.run(container);
    const seriousViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(seriousViolations).toHaveLength(0);
  });

  it('ConversationView passes axe-core accessibility checks', async () => {
    const { container } = render(
      <BrowserRouter>
        <ConversationView />
      </BrowserRouter>
    );

    const results = await axe.run(container);
    const seriousViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(seriousViolations).toHaveLength(0);
  });

  it('SpeechToSignView passes axe-core accessibility checks', async () => {
    const { container } = render(
      <BrowserRouter>
        <SpeechToSignView />
      </BrowserRouter>
    );

    const results = await axe.run(container);
    const seriousViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(seriousViolations).toHaveLength(0);
  });

  it('LearnView passes axe-core accessibility checks', async () => {
    const { container } = render(
      <BrowserRouter>
        <LearnView />
      </BrowserRouter>
    );

    const results = await axe.run(container);
    const seriousViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(seriousViolations).toHaveLength(0);
  });

  it('MemoryView passes axe-core accessibility checks', async () => {
    const { container } = render(
      <BrowserRouter>
        <MemoryView />
      </BrowserRouter>
    );

    const results = await axe.run(container);
    const seriousViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(seriousViolations).toHaveLength(0);
  });
});
