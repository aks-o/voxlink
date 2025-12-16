import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WorkflowDesigner } from '../WorkflowDesigner';
import { VoiceWorkflow, WorkflowStep } from '@voxlink/shared/types/ai-agent';

// Mock drag and drop library
jest.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children }: any) => children,
  Droppable: ({ children }: any) => children({ draggableProps: {}, dragHandleProps: {}, innerRef: jest.fn() }),
  Draggable: ({ children }: any) => children({ draggableProps: {}, dragHandleProps: {}, innerRef: jest.fn() }),
}));

// Mock the API service
jest.mock('../../services/api', () => ({
  api: {
    post: jest.fn(),
    put: jest.fn(),
    get: jest.fn(),
  },
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('WorkflowDesigner', () => {
  const mockWorkflow: VoiceWorkflow = {
    id: '1',
    name: 'Test Workflow',
    description: 'Test workflow description',
    steps: [
      {
        id: 'step1',
        type: 'greeting',
        name: 'Welcome Message',
        config: {
          message: 'Welcome to VoxLink',
          voice: 'en-US-Standard-A',
        },
        position: { x: 100, y: 100 },
        connections: ['step2'],
      },
      {
        id: 'step2',
        type: 'menu',
        name: 'Main Menu',
        config: {
          message: 'Press 1 for sales, 2 for support',
          options: [
            { key: '1', label: 'Sales', action: 'transfer', target: 'sales-queue' },
            { key: '2', label: 'Support', action: 'transfer', target: 'support-queue' },
          ],
        },
        position: { x: 300, y: 100 },
        connections: [],
      },
    ],
    conditions: [],
    escalationRules: [],
    analytics: {
      totalExecutions: 0,
      averageCompletionTime: 0,
      successRate: 0,
      dropOffPoints: [],
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders workflow designer interface', () => {
    render(
      <TestWrapper>
        <WorkflowDesigner />
      </TestWrapper>
    );

    expect(screen.getByText('Workflow Designer')).toBeInTheDocument();
    expect(screen.getByText('Step Library')).toBeInTheDocument();
    expect(screen.getByText('Workflow Canvas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save workflow/i })).toBeInTheDocument();
  });

  it('displays step library with available step types', () => {
    render(
      <TestWrapper>
        <WorkflowDesigner />
      </TestWrapper>
    );

    expect(screen.getByText('Greeting')).toBeInTheDocument();
    expect(screen.getByText('Menu')).toBeInTheDocument();
    expect(screen.getByText('Collect Input')).toBeInTheDocument();
    expect(screen.getByText('Transfer')).toBeInTheDocument();
    expect(screen.getByText('Condition')).toBeInTheDocument();
    expect(screen.getByText('End Call')).toBeInTheDocument();
  });

  it('adds new step to workflow', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <WorkflowDesigner />
      </TestWrapper>
    );

    // Click on greeting step in library
    const greetingStep = screen.getByText('Greeting');
    await user.click(greetingStep);

    // Should add step to canvas
    await waitFor(() => {
      expect(screen.getByText('New Greeting Step')).toBeInTheDocument();
    });
  });

  it('configures step properties', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <WorkflowDesigner workflow={mockWorkflow} />
      </TestWrapper>
    );

    // Click on existing step
    const step = screen.getByText('Welcome Message');
    await user.click(step);

    // Should show step configuration panel
    await waitFor(() => {
      expect(screen.getByText('Step Configuration')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Welcome to VoxLink')).toBeInTheDocument();
    });

    // Update step message
    const messageInput = screen.getByDisplayValue('Welcome to VoxLink');
    await user.clear(messageInput);
    await user.type(messageInput, 'Updated welcome message');

    expect(messageInput).toHaveValue('Updated welcome message');
  });

  it('connects workflow steps', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <WorkflowDesigner workflow={mockWorkflow} />
      </TestWrapper>
    );

    // Click on first step
    const step1 = screen.getByText('Welcome Message');
    await user.click(step1);

    // Should show connection handles
    expect(screen.getByTestId('connection-handle-step1')).toBeInTheDocument();

    // Click on connection handle and drag to second step
    const connectionHandle = screen.getByTestId('connection-handle-step1');
    const step2 = screen.getByText('Main Menu');

    fireEvent.mouseDown(connectionHandle);
    fireEvent.mouseMove(step2);
    fireEvent.mouseUp(step2);

    // Should create connection
    await waitFor(() => {
      expect(screen.getByTestId('connection-step1-step2')).toBeInTheDocument();
    });
  });

  it('deletes workflow steps', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <WorkflowDesigner workflow={mockWorkflow} />
      </TestWrapper>
    );

    // Right-click on step to show context menu
    const step = screen.getByText('Welcome Message');
    fireEvent.contextMenu(step);

    // Click delete option
    const deleteOption = screen.getByText('Delete Step');
    await user.click(deleteOption);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.queryByText('Welcome Message')).not.toBeInTheDocument();
    });
  });

  it('validates workflow before saving', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <WorkflowDesigner />
      </TestWrapper>
    );

    // Try to save empty workflow
    const saveButton = screen.getByRole('button', { name: /save workflow/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/workflow must have at least one step/i)).toBeInTheDocument();
    });
  });

  it('saves workflow with valid configuration', async () => {
    const user = userEvent.setup();
    const mockApi = require('../../services/api').api;
    mockApi.post.mockResolvedValue({ data: { ...mockWorkflow, id: '2' } });

    render(
      <TestWrapper>
        <WorkflowDesigner workflow={mockWorkflow} />
      </TestWrapper>
    );

    // Update workflow name
    const nameInput = screen.getByLabelText(/workflow name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Workflow');

    // Save workflow
    const saveButton = screen.getByRole('button', { name: /save workflow/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/voice-workflows', {
        name: 'Updated Workflow',
        description: expect.any(String),
        steps: expect.any(Array),
        conditions: expect.any(Array),
        escalationRules: expect.any(Array),
        isActive: true,
      });
    });
  });

  it('supports undo/redo functionality', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <WorkflowDesigner workflow={mockWorkflow} />
      </TestWrapper>
    );

    // Make a change (delete a step)
    const step = screen.getByText('Welcome Message');
    fireEvent.contextMenu(step);
    await user.click(screen.getByText('Delete Step'));
    await user.click(screen.getByRole('button', { name: /confirm/i }));

    // Step should be gone
    await waitFor(() => {
      expect(screen.queryByText('Welcome Message')).not.toBeInTheDocument();
    });

    // Undo the change
    const undoButton = screen.getByRole('button', { name: /undo/i });
    await user.click(undoButton);

    // Step should be back
    await waitFor(() => {
      expect(screen.getByText('Welcome Message')).toBeInTheDocument();
    });

    // Redo the change
    const redoButton = screen.getByRole('button', { name: /redo/i });
    await user.click(redoButton);

    // Step should be gone again
    await waitFor(() => {
      expect(screen.queryByText('Welcome Message')).not.toBeInTheDocument();
    });
  });

  it('validates step connections', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <WorkflowDesigner />
      </TestWrapper>
    );

    // Add two steps
    await user.click(screen.getByText('Greeting'));
    await user.click(screen.getByText('End Call'));

    // Try to connect End Call to Greeting (invalid)
    const endCallStep = screen.getByText('New End Call Step');
    const greetingStep = screen.getByText('New Greeting Step');

    fireEvent.mouseDown(endCallStep);
    fireEvent.mouseMove(greetingStep);
    fireEvent.mouseUp(greetingStep);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/invalid connection/i)).toBeInTheDocument();
    });
  });

  it('supports workflow testing', async () => {
    const user = userEvent.setup();
    const mockApi = require('../../services/api').api;
    mockApi.post.mockResolvedValue({ 
      data: { 
        success: true, 
        trace: [
          { stepId: 'step1', result: 'success', duration: 100 },
          { stepId: 'step2', result: 'success', duration: 150 },
        ]
      } 
    });

    render(
      <TestWrapper>
        <WorkflowDesigner workflow={mockWorkflow} />
      </TestWrapper>
    );

    // Click test workflow button
    const testButton = screen.getByRole('button', { name: /test workflow/i });
    await user.click(testButton);

    // Should show test dialog
    expect(screen.getByText('Test Workflow')).toBeInTheDocument();

    // Enter test input
    const testInput = screen.getByLabelText(/test input/i);
    await user.type(testInput, 'Hello, I need help');

    // Run test
    const runTestButton = screen.getByRole('button', { name: /run test/i });
    await user.click(runTestButton);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/voice-workflows/test', {
        workflow: expect.any(Object),
        input: 'Hello, I need help',
      });
    });

    // Should show test results
    await waitFor(() => {
      expect(screen.getByText('Test Results')).toBeInTheDocument();
      expect(screen.getByText(/total duration: 250ms/i)).toBeInTheDocument();
    });
  });
});