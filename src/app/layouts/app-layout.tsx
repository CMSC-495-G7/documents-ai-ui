import {
  AccountMenu,
  ChatIcon,
  IngestionIcon,
  matchDestination,
  NavigateProvider,
  SideMenu,
  type MenuDestination,
  type MenuSection,
  type NavigateHandler,
} from '@radixp0int/ai-chat-kit';
import { useMemo } from 'react';
import { Outlet, useLocation, useMatches, useNavigate } from 'react-router-dom';
import { paths } from '../../common/config/paths.ts';
import { TopBar, type Crumb } from '../../common/top-bar/top-bar.tsx';
import { TopBarProvider } from '../../common/top-bar/top-bar-slot.tsx';
import { initials } from '../../common/utils/initials.ts';
import { useAuth } from '../../features/auth/context/use-auth.ts';
import type { Role } from '../../features/auth/types.ts';

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

  const sections = useMemo(() => menuFor(user?.role), [user?.role]);
  const active = matchDestination(sections, pathname);
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
            appsHeading={user?.workspace.name}
            className="h-full"
          />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <TopBar
              crumbs={crumbs}
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
      </TopBarProvider>
    </NavigateProvider>
  );
}
