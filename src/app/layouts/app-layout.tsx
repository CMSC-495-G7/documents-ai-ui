import {
  AccountMenu,
  ChatIcon,
  IconButton,
  IngestionIcon,
  matchDestination,
  NavigateProvider,
  PencilIcon,
  SideMenu,
  SideMenuIcon,
  SideMenuSlotProvider,
  useMediaQuery,
  type MenuDestination,
  type MenuSection,
  type NavigateHandler,
  type SideMenuPanel,
} from '@radixp0int/ai-chat-kit';
import { useMemo, useState } from 'react';
import { Outlet, useLocation, useMatches, useNavigate } from 'react-router-dom';
import { paths } from '../../common/config/paths.ts';
import { TopBar, type Crumb } from '../../common/top-bar/top-bar.tsx';
import { TopBarProvider } from '../../common/top-bar/top-bar-slot.tsx';
import './app-layout.css';
import { initials } from '../../common/utils/initials.ts';
import { useAuth } from '../../features/auth/context/use-auth.ts';
import type { Role } from '../../features/auth/types.ts';
import { SettingsDialog } from '../../features/settings/components/settings-dialog.tsx';

type Page = MenuDestination & { adminOnly?: boolean };

// Add new pages here. adminOnly hides them from employees.
const pages: Page[] = [
  { id: 'chat', label: 'Chat', href: paths.chat, icon: <ChatIcon /> },
  {
    id: 'ingestion',
    label: 'Upload',
    href: paths.ingestion,
    icon: <IngestionIcon />,
    adminOnly: true,
  },
];

// Pages with their own panel beside the rail. The page fills it with
// <InSideMenu> (chat puts its question history there).
const panels: Record<string, SideMenuPanel> = {
  chat: {
    title: 'Chat',
    // The chat page starts over on every visit to /chat
    action: { label: 'New chat', href: paths.chat, icon: <PencilIcon /> },
  },
};

function menuFor(role?: Role): MenuSection[] {
  const items = pages
    .filter((page) => !page.adminOnly || role === 'admin')
    .map(({ id, label, href, icon }) => ({ id, label, href, icon }));
  return [{ id: 'main', items }];
}

// A route can add a crumb after the menu one with `handle: { crumb: 'Step' }`.
function useRouteCrumbs(): Crumb[] {
  return useMatches().flatMap((match) => {
    const crumb = (match.handle as { crumb?: string } | undefined)?.crumb;
    return crumb ? [{ label: crumb }] : [];
  });
}

export function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const routeCrumbs = useRouteCrumbs();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isAdmin = user?.role === 'admin';
  // On a phone the panel starts closed so the page has room
  const wide = useMediaQuery('(min-width: 64rem)', true);
  // Ours, not the menu's, so the top bar button can open and close it
  const [panelOpen, setPanelOpen] = useState(wide);
  function togglePanel() {
    setPanelOpen((open) => !open);
  }

  const sections = useMemo(() => menuFor(user?.role), [user?.role]);
  const active = matchDestination(sections, pathname);
  const panel = active ? panels[active.id] : undefined;
  const crumbs: Crumb[] = [
    ...(active ? [{ label: active.label, href: active.href }] : []),
    ...routeCrumbs,
  ];

  // Kit links go through react-router instead of reloading the page.
  const goTo: NavigateHandler = (href, event) => {
    event.preventDefault();
    navigate(href);
  };

  function handleSignOut() {
    signOut();
    navigate(paths.login, { replace: true });
  }

  return (
    <NavigateProvider value={goTo}>
      <TopBarProvider>
        <SideMenuSlotProvider>
          {/* Exactly one screen tall and never scrolls, so the rail always reaches
            the bottom. Only main scrolls. */}
          <div
            data-testid="app-shell"
            className="flex h-dvh overflow-hidden bg-canvas text-ink"
          >
            <SideMenu
              sections={sections}
              rail={sections[0].items.map((item) => item.id)}
              activeId={active?.id}
              panels={panels}
              // The menu asks for a value (true when you arrive at Chat),
              // so set it, don't flip it
              panelOpen={panelOpen}
              onPanelOpenChange={setPanelOpen}
              appsHeading={user?.workspace.name}
              className="app-side-menu h-full"
            />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <TopBar
                crumbs={crumbs}
                start={
                  panel && (
                    <IconButton
                      onClick={togglePanel}
                      aria-expanded={panelOpen}
                      aria-label={`${panelOpen ? 'Hide' : 'Show'} the ${panel.title} panel`}
                      title={panelOpen ? 'Hide panel' : 'Show panel'}
                    >
                      <SideMenuIcon width={18} height={18} />
                    </IconButton>
                  )
                }
                end={
                  user && (
                    <AccountMenu
                      trigger="avatar"
                      user={{
                        name: user.email,
                        initials: initials(user.email),
                        detail: `${user.role === 'admin' ? 'Admin' : 'Employee'} · ${user.workspace.name}`,
                      }}
                      items={[
                        ...(isAdmin
                          ? [
                              {
                                id: 'settings',
                                label: 'Settings',
                                onSelect: () => setSettingsOpen(true),
                              },
                            ]
                          : []),
                        {
                          id: 'sign-out',
                          label: 'Sign out',
                          onSelect: handleSignOut,
                        },
                      ]}
                    />
                  )
                }
              />
              {/* relative keeps absolute page bits (hidden inputs, popovers)
                inside main's scroll instead of stretching the whole page. */}
              <main className="relative min-h-0 flex-1 overflow-y-auto p-7">
                <Outlet />
              </main>
            </div>
          </div>
          {isAdmin && (
            <SettingsDialog
              open={settingsOpen}
              onClose={() => setSettingsOpen(false)}
            />
          )}
        </SideMenuSlotProvider>
      </TopBarProvider>
    </NavigateProvider>
  );
}
