'use client';
import { SignOut } from '@phosphor-icons/react';
import { logout } from '@/app/login/actions';
import { clearAllDrafts } from '@/lib/draft';

// Drafts live in localStorage; wipe them on logout so the next person on this browser cannot see them.
export function LogoutButton({ label }: { label: string }) {
  return (
    <form
      action={logout}
      onSubmit={() => {
        try {
          clearAllDrafts(window.localStorage);
        } catch {}
      }}
    >
      <button type="submit" className="nav-link cursor-pointer">
        <SignOut size={16} weight="light" aria-hidden />
        <span className="hidden lg:inline">{label}</span>
        <span className="sr-only lg:hidden">{label}</span>
      </button>
    </form>
  );
}
