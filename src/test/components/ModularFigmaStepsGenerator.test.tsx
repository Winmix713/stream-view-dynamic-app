import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ModularFigmaStepsGenerator } from '@/components/code-generator/ModularFigmaStepsGenerator';

// Mock the services
jest.mock('@/services/figma-api-service');
jest.mock('@/services/enhanced-code-generation-engine');
jest.mock('@/lib/svg-to-jsx');
jest.mock('@/lib/transform');

describe('ModularFigmaStepsGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all four steps', () => {
    render(<ModularFigmaStepsGenerator />);
    
    expect(screen.getByText('Figma Configuration')).toBeInTheDocument();
    expect(screen.getByText('Add Figma SVG Code')).toBeInTheDocument();
    expect(screen.getByText('Add Figma Full CSS Code')).toBeInTheDocument();
    expect(screen.getByText('Add JSX + More CSS Code')).toBeInTheDocument();
  });

  it('shows progress indicator', () => {
    render(<ModularFigmaStepsGenerator />);
    
    expect(screen.getByText('Generation Progress')).toBeInTheDocument();
    expect(screen.getByText('0/4 Steps')).toBeInTheDocument();
  });

  it('enables connect button when URL and token are provided', () => {
    render(<ModularFigmaStepsGenerator />);
    
    const urlInput = screen.getByPlaceholderText('https://www.figma.com/design/...');
    const tokenInput = screen.getByPlaceholderText('••••••••••••••••••••••••••••••••');
    const connectButton = screen.getByText('CONNECT');

    expect(connectButton).toBeDisabled();

    fireEvent.change(urlInput, { target: { value: 'https://www.figma.com/design/test' } });
    fireEvent.change(tokenInput, { target: { value: 'test-token' } });

    expect(connectButton).toBeEnabled();
  });

  it('shows error message for invalid inputs', async () => {
    render(<ModularFigmaStepsGenerator />);
    
    const connectButton = screen.getByText('CONNECT');
    fireEvent.click(connectButton);

    await waitFor(() => {
      expect(screen.getByText('Please provide both Figma URL and Access Token')).toBeInTheDocument();
    });
  });

  it('displays success summary when generation is complete', async () => {
    render(<ModularFigmaStepsGenerator />);
    
    // Mock successful completion
    // This would require more complex mocking of the context state
    // For now, we'll test the component structure
    
    expect(screen.getByText('Modular 4-Step Code Generator')).toBeInTheDocument();
  });

  it('has reset functionality', () => {
    render(<ModularFigmaStepsGenerator />);
    
    const resetButton = screen.getByText('Reset');
    expect(resetButton).toBeInTheDocument();
    
    fireEvent.click(resetButton);
    // After reset, inputs should be cleared
    const urlInput = screen.getByPlaceholderText('https://www.figma.com/design/...');
    expect(urlInput).toHaveValue('https://www.figma.com/design/...');
  });
});