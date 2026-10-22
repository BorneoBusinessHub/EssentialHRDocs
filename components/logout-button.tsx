'use client';
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
      className="ml-auto"
    >
      <button type="submit" className="underline">{label}</button>
    </form>
  );
}
