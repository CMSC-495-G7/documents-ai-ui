import {
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  Breadcrumbs,
  BreadcrumbSeparator,
  Link,
} from '@radixp0int/ai-chat-kit';
import { Fragment, type ReactNode } from 'react';
import { useTopBarSlot } from './top-bar-context.ts';

export type Crumb = {
  label: string;
  href?: string;
};

type TopBarProps = {
  // The last one is the current page.
  crumbs: Crumb[];
  // Always on the far right, after any page actions.
  end?: ReactNode;
};

export function TopBar({ crumbs, end }: TopBarProps) {
  const slot = useTopBarSlot();

  return (
    <header className="flex min-h-13 shrink-0 flex-wrap items-center gap-2.5 border-b border-line bg-panel-solid px-7 py-2.5">
      <Breadcrumbs>
        <BreadcrumbList>
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1;
            return (
              <Fragment key={`${crumb.label}-${index}`}>
                {index > 0 && <BreadcrumbSeparator>/</BreadcrumbSeparator>}
                <BreadcrumbItem>
                  {last || !crumb.href ? (
                    // ! so these beat the kit's own font-medium and text-ink.
                    <BreadcrumbPage
                      aria-current={last ? 'page' : undefined}
                      className={
                        last ? 'font-bold! text-ink-strong!' : 'text-ink-soft!'
                      }
                    >
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <Link
                      variant="plain"
                      href={crumb.href}
                      className="text-ink-soft hover:text-brand-fg hover:underline"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </BreadcrumbItem>
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumbs>
      <div className="ml-auto flex items-center gap-2">
        <div
          ref={slot?.setActions}
          className="flex items-center gap-2 empty:hidden"
        />
        {end}
      </div>
    </header>
  );
}
