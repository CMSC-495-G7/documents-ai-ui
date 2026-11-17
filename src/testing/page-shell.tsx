import {
  NavigateProvider,
  SideMenu,
  SideMenuSlotProvider,
  type NavigateHandler,
} from '@radixp0int/ai-chat-kit';
import { Outlet, useNavigate } from 'react-router-dom';
import { TopBar } from '../common/top-bar/top-bar.tsx';
import { TopBarProvider } from '../common/top-bar/top-bar-slot.tsx';

// A small stand-in for app-layout.tsx, for page tests: a side menu with an
// open panel (for <InSideMenu>) and a top bar (for <TopBarActions>).
// Use it as the parent route's element.
export function PageShell() {
  const navigate = useNavigate();
  const goTo: NavigateHandler = (href, event) => {
    event.preventDefault();
    navigate(href);
  };

  return (
    <NavigateProvider value={goTo}>
      <TopBarProvider>
        <SideMenuSlotProvider>
          <SideMenu
            sections={[
              { id: 'main', items: [{ id: 'page', label: 'Page', href: '/' }] },
            ]}
            rail={[]}
            activeId="page"
            panels={{ page: { title: 'Page panel' } }}
          />
          <TopBar crumbs={[]} />
          <Outlet />
        </SideMenuSlotProvider>
      </TopBarProvider>
    </NavigateProvider>
  );
}
