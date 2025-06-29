import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { FigmaStepsProvider, useFigmaSteps } from '@/contexts/FigmaStepsContext';

// Mock the services
jest.mock('@/services/figma-api-service');
jest.mock('@/services/enhanced-code-generation-engine');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <FigmaStepsProvider>{children}</FigmaStepsProvider>
);

describe('FigmaStepsContext', () => {
  it('provides initial state', () => {
    const { result } = renderHook(() => useFigmaSteps(), { wrapper });
    
    expect(result.current.state.stepData.figmaUrl).toBe('https://www.figma.com/design/...');
    expect(result.current.state.stepStatus.step1).toBe('idle');
    expect(result.current.state.uiState.previewMode).toBe(false);
  });

  it('updates step data', () => {
    const { result } = renderHook(() => useFigmaSteps(), { wrapper });
    
    act(() => {
      result.current.actions.setStepData({ figmaUrl: 'https://test.com' });
    });
    
    expect(result.current.state.stepData.figmaUrl).toBe('https://test.com');
  });

  it('updates step status', () => {
    const { result } = renderHook(() => useFigmaSteps(), { wrapper });
    
    act(() => {
      result.current.actions.setStepStatus({ step1: 'loading' });
    });
    
    expect(result.current.state.stepStatus.step1).toBe('loading');
  });

  it('handles errors', () => {
    const { result } = renderHook(() => useFigmaSteps(), { wrapper });
    
    act(() => {
      result.current.actions.setError('step1', 'Test error');
    });
    
    expect(result.current.state.uiState.errors.step1).toBe('Test error');
  });

  it('toggles blocks', () => {
    const { result } = renderHook(() => useFigmaSteps(), { wrapper });
    
    act(() => {
      result.current.actions.toggleBlock('block1');
    });
    
    expect(result.current.state.uiState.expandedBlocks.block1).toBe(true);
  });

  it('resets all state', () => {
    const { result } = renderHook(() => useFigmaSteps(), { wrapper });
    
    // First modify some state
    act(() => {
      result.current.actions.setStepData({ figmaUrl: 'https://test.com' });
      result.current.actions.setStepStatus({ step1: 'success' });
    });
    
    // Then reset
    act(() => {
      result.current.actions.resetAll();
    });
    
    expect(result.current.state.stepData.figmaUrl).toBe('https://www.figma.com/design/...');
    expect(result.current.state.stepStatus.step1).toBe('idle');
  });
});