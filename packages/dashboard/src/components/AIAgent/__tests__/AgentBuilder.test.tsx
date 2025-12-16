import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AgentBuilder } from '../AgentBuilder';
import { AIAgent } from '@voxlink/shared/types/ai-agent';

// Mock the API service
jest.mock('../../services/api', () => ({
  api: {
    post: jest.fn(),
    put: jest.fn(),
    get: jest.fn(),
  },
}));

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: undefined }),
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('AgentBuilder', () => {
  const mockAgent: AIAgent = {
    id: '1',
    name: 'Test Agent',
    description: 'Test Description',
    voiceSettings: {
      voice: 'en-US-Standard-A',
      speed: 1.0,
      pitch: 0.0,
      language: 'en-US',
    },
    workflows: [],
    integrations: [],
    performance: {
      totalCalls: 0,
      successfulCalls: 0,
      averageCallDuration: 0,
      customerSatisfaction: 0,
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders agent builder form', () => {
    render(
      <TestWrapper>
        <AgentBuilder />
      </TestWrapper>
    );

    expect(screen.getByText('Create AI Agent')).toBeInTheDocument();
    expect(screen.getByLabelText(/agent name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByText('Voice Settings')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <AgentBuilder />
      </TestWrapper>
    );

    const saveButton = screen.getByRole('button', { name: /save agent/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/agent name is required/i)).toBeInTheDocument();
    });
  });

  it('creates new agent with valid data', async () => {
    const user = userEvent.setup();
    const mockApi = require('../../services/api').api;
    mockApi.post.mockResolvedValue({ data: { ...mockAgent, id: '2' } });

    render(
      <TestWrapper>
        <AgentBuilder />
      </TestWrapper>
    );

    // Fill in form fields
    await user.type(screen.getByLabelText(/agent name/i), 'New Test Agent');
    await user.type(screen.getByLabelText(/description/i), 'New agent description');
    
    // Select voice settings
    const voiceSelect = screen.getByLabelText(/voice/i);
    await user.selectOptions(voiceSelect, 'en-US-Standard-B');

    // Submit form
    const saveButton = screen.getByRole('button', { name: /save agent/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/ai-agents', {
        name: 'New Test Agent',
        description: 'New agent description',
        voiceSettings: expect.objectContaining({
          voice: 'en-US-Standard-B',
        }),
        workflows: [],
        integrations: [],
        isActive: true,
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/ai-agents');
  });

  it('loads existing agent for editing', async () => {
    const mockApi = require('../../services/api').api;
    mockApi.get.mockResolvedValue({ data: mockAgent });

    // Mock useParams to return an ID
    jest.mocked(require('react-router-dom').useParams).mockReturnValue({ id: '1' });

    render(
      <TestWrapper>
        <AgentBuilder />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith('/ai-agents/1');
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Agent')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    });
  });

  it('updates existing agent', async () => {
    const user = userEvent.setup();
    const mockApi = require('../../services/api').api;
    mockApi.get.mockResolvedValue({ data: mockAgent });
    mockApi.put.mockResolvedValue({ data: { ...mockAgent, name: 'Updated Agent' } });

    jest.mocked(require('react-router-dom').useParams).mockReturnValue({ id: '1' });

    render(
      <TestWrapper>
        <AgentBuilder />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Agent')).toBeInTheDocument();
    });

    // Update agent name
    const nameInput = screen.getByLabelText(/agent name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Agent');

    // Submit form
    const saveButton = screen.getByRole('button', { name: /save agent/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalledWith('/ai-agents/1', {
        ...mockAgent,
        name: 'Updated Agent',
      });
    });
  });

  it('handles voice settings changes', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <AgentBuilder />
      </TestWrapper>
    );

    // Change voice settings
    const speedSlider = screen.getByLabelText(/speed/i);
    fireEvent.change(speedSlider, { target: { value: '1.5' } });

    const pitchSlider = screen.getByLabelText(/pitch/i);
    fireEvent.change(pitchSlider, { target: { value: '0.5' } });

    expect(speedSlider).toHaveValue('1.5');
    expect(pitchSlider).toHaveValue('0.5');
  });

  it('shows loading state during save', async () => {
    const user = userEvent.setup();
    const mockApi = require('../../services/api').api;
    
    // Mock a delayed response
    mockApi.post.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: mockAgent }), 1000))
    );

    render(
      <TestWrapper>
        <AgentBuilder />
      </TestWrapper>
    );

    await user.type(screen.getByLabelText(/agent name/i), 'Test Agent');
    
    const saveButton = screen.getByRole('button', { name: /save agent/i });
    await user.click(saveButton);

    expect(screen.getByText(/saving/i)).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
  });

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup();
    const mockApi = require('../../services/api').api;
    mockApi.post.mockRejectedValue(new Error('API Error'));

    render(
      <TestWrapper>
        <AgentBuilder />
      </TestWrapper>
    );

    await user.type(screen.getByLabelText(/agent name/i), 'Test Agent');
    
    const saveButton = screen.getByRole('button', { name: /save agent/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to save agent/i)).toBeInTheDocument();
    });
  });

  it('allows canceling and navigating back', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <AgentBuilder />
      </TestWrapper>
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith('/ai-agents');
  });

  it('shows unsaved changes warning', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <AgentBuilder />
      </TestWrapper>
    );

    // Make changes to form
    await user.type(screen.getByLabelText(/agent name/i), 'Modified Agent');

    // Try to navigate away
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <AgentBuilder />
      </TestWrapper>
    );

    const nameInput = screen.getByLabelText(/agent name/i);
    nameInput.focus();

    // Tab through form fields
    await user.tab();
    expect(screen.getByLabelText(/description/i)).toHaveFocus();

    await user.tab();
    expect(screen.getByLabelText(/voice/i)).toHaveFocus();
  });

  it('validates voice settings ranges', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <AgentBuilder />
      </TestWrapper>
    );

    // Try to set invalid speed value
    const speedSlider = screen.getByLabelText(/speed/i);
    fireEvent.change(speedSlider, { target: { value: '3.0' } }); // Above max

    await user.click(screen.getByRole('button', { name: /save agent/i }));

    await waitFor(() => {
      expect(screen.getByText(/speed must be between/i)).toBeInTheDocument();
    });
  });
});