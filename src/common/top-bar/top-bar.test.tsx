import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TopBar } from './top-bar.tsx';
import { TopBarActions, TopBarProvider } from './top-bar-slot.tsx';

describe('TopBar', () => {
  it('links earlier crumbs and marks the last one as the current page', () => {
    render(
      <TopBar
        crumbs={[
          { label: 'Upload', href: '/ingestion' },
          { label: 'Choose files' },
        ]}
      />,
    );

    expect(screen.getByRole('link', { name: 'Upload' })).toHaveAttribute(
      'href',
      '/ingestion',
    );
    expect(screen.getByText('Choose files')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('shows the end content on the right', () => {
    render(<TopBar crumbs={[{ label: 'Chat' }]} end={<span>avatar</span>} />);
    expect(screen.getByText('avatar')).toBeInTheDocument();
  });

  it('shows page actions added with TopBarActions', () => {
    render(
      <TopBarProvider>
        <TopBar crumbs={[{ label: 'Upload' }]} />
        <TopBarActions>
          <button type="button">Cancel</button>
        </TopBarActions>
      </TopBarProvider>,
    );

    expect(
      screen.getByRole('button', { name: 'Cancel' }).closest('header'),
    ).toBeInTheDocument();
  });

  it('renders page actions nowhere without a provider', () => {
    render(
      <TopBarActions>
        <button type="button">Cancel</button>
      </TopBarActions>,
    );
    expect(
      screen.queryByRole('button', { name: 'Cancel' }),
    ).not.toBeInTheDocument();
  });
});
