import { beforeEach, describe, expect, it, vi } from 'vitest';

const maybeSingleMock = vi.fn();
const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
const selectMock = vi.fn(() => ({ eq: eqMock }));
const singleMock = vi.fn();
const updateEqMock = vi.fn(() => ({ select: vi.fn(() => ({ single: singleMock })) }));
const updateMock = vi.fn(() => ({ eq: updateEqMock }));
const insertSelectMock = vi.fn(() => ({ single: singleMock }));
const insertMock = vi.fn(() => ({ select: insertSelectMock }));
const fromMock = vi.fn((table: string) => {
  if (table !== 'app_users') {
    throw new Error(`Unexpected table ${table}`);
  }

  return {
    select: selectMock,
    update: updateMock,
    insert: insertMock,
  };
});
const setCurrentUserMock = vi.fn();

vi.mock('../../lib/supabase/appClient', () => ({
  getDefaultAdminEmail: vi.fn(() => 'lacometta33@gmail.com'),
  mapSupabaseUserToProviderData: vi.fn(() => []),
  setCurrentUser: setCurrentUserMock,
  supabase: {
    from: fromMock,
  },
}));

describe('ensureUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a profile with uid mapped from app_users.id on update', async () => {
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        id: 'user-123',
        auth_user_id: 'user-123',
        email: 'hello@mymindventures.io',
        display_name: 'Kevin De Vlieger',
        role: 'Admin',
        onboarded: true,
        storytelling_completed: true,
        created_at: '2026-04-04T00:00:00.000Z',
        updated_at: '2026-04-04T00:00:00.000Z',
        last_login: '2026-04-04T00:00:00.000Z',
        settings: { theme: 'dark', notifications: true },
      },
      error: null,
    });

    singleMock.mockResolvedValueOnce({
      data: {
        id: 'user-123',
        auth_user_id: 'user-123',
        email: 'hello@mymindventures.io',
        display_name: 'Kevin De Vlieger',
        role: 'Admin',
        onboarded: true,
        storytelling_completed: true,
        created_at: '2026-04-04T00:00:00.000Z',
        updated_at: '2026-04-04T00:01:00.000Z',
        last_login: '2026-04-04T00:01:00.000Z',
        settings: { theme: 'dark', notifications: true },
      },
      error: null,
    });

    const { ensureUserProfile } = await import('./profile');

    const result = await ensureUserProfile({
      id: 'user-123',
      email: 'hello@mymindventures.io',
      email_confirmed_at: '2026-04-04T00:00:00.000Z',
      user_metadata: {},
      identities: [],
    } as any);

    expect(result.profile.uid).toBe('user-123');
    expect(result.authUser.uid).toBe('user-123');
    expect(updateEqMock).toHaveBeenCalledWith('id', 'user-123');
    expect(setCurrentUserMock).toHaveBeenCalledWith(expect.objectContaining({ uid: 'user-123' }));
  });
});
