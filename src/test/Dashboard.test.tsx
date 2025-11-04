import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Dashboard from '../../components/Dashboard';
import { DataProvider } from '../../contexts/DataContext';

describe('Dashboard', () => {
  it('renders the dashboard title', async () => {
    render(
      <DataProvider>
        <Dashboard />
      </DataProvider>
    );
    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
  });
});
