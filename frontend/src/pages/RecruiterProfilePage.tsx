import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { profileApi, type UpdateProfileData } from '@/api/profile.api';
import { assessmentApi } from '@/api/assessment.api';
import { AppLayout } from '@/components/layout/AppLayout';

function initials(name?: string | null) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

/** Resize an image file to a square avatar and return a JPEG data URL. */
function resizeImage(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('no canvas'));
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="surface-raised rounded-xl p-5">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none';

export function RecruiterProfilePage() {
  const queryClient = useQueryClient();

  const {
    data: profileData,
    isLoading: profileLoading,
    isError: profileError,
  } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => profileApi.getMine(),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['recruiter-stats', 'me'],
    queryFn: () => assessmentApi.getRecruiterStats(),
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UpdateProfileData>({});

  useEffect(() => {
    if (profileData?.profile) {
      setForm({
        designation: profileData.profile.designation ?? '',
        bio: profileData.profile.bio ?? '',
        location: profileData.profile.location ?? '',
        githubUrl: profileData.profile.githubUrl ?? '',
        linkedinUrl: profileData.profile.linkedinUrl ?? '',
        websiteUrl: profileData.profile.websiteUrl ?? '',
      });
    }
  }, [profileData?.profile]);

  const save = useMutation({
    mutationFn: () => {
      const payload: UpdateProfileData = { ...form };
      (['githubUrl', 'linkedinUrl', 'websiteUrl'] as const).forEach((k) => {
        if (!payload[k]) delete payload[k];
      });
      return profileApi.updateMine(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setEditing(false);
      toast.success('Profile saved');
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message?.[0] || 'Failed to save profile'),
  });

  const avatarInput = useRef<HTMLInputElement>(null);
  const onAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImage(file);
      await profileApi.setAvatar(dataUrl);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Photo updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not update photo');
    } finally {
      e.target.value = '';
    }
  };

  if (profileLoading) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center bg-background">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  if (profileError || !profileData) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 bg-background">
          <p className="text-lg font-semibold text-foreground">
            Could not load your profile
          </p>
          <Link to="/recruiter/dashboard" className="text-primary hover:underline">
            Back to dashboard
          </Link>
        </div>
      </AppLayout>
    );
  }

  const { profile, email } = profileData;
  const name = profile.displayName || email || 'Recruiter';

  const socials = [
    { key: 'githubUrl', label: 'GitHub', url: profile.githubUrl },
    { key: 'linkedinUrl', label: 'LinkedIn', url: profile.linkedinUrl },
    { key: 'websiteUrl', label: 'Website', url: profile.websiteUrl },
  ].filter(
    (s): s is { key: string; label: string; url: string } => Boolean(s.url),
  );

  const totals = stats?.totals;
  const hasActivity = (totals?.assessmentsCreated ?? 0) > 0;

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-6 py-10">
          {/* Header card */}
          <div className="surface-raised rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-5">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initials(name)
                    )}
                  </div>
                  <button
                    onClick={() => avatarInput.current?.click()}
                    className="absolute -bottom-1 -right-1 rounded-full border border-border bg-card p-1.5 text-muted-foreground shadow-sm hover:text-foreground"
                    title="Change photo"
                    aria-label="Change photo"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6h16M4 6a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2" />
                    </svg>
                  </button>
                  <input
                    ref={avatarInput}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onAvatarPick}
                  />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-foreground">{name}</h1>
                  {profile.designation && (
                    <p className="mt-0.5 text-muted-foreground">{profile.designation}</p>
                  )}
                  {profile.location && (
                    <p className="mt-1 text-sm text-muted-foreground">{profile.location}</p>
                  )}
                  {socials.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-3 text-sm">
                      {socials.map((s) => (
                        <a
                          key={s.key}
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          {s.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-2 self-start rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-card"
                >
                  Edit profile
                </button>
              )}
            </div>

            {!editing && profile.bio && (
              <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {profile.bio}
              </p>
            )}

            {/* Edit form */}
            {editing && (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Designation
                  </label>
                  <input
                    className={inputClass}
                    value={form.designation ?? ''}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    placeholder="e.g. Technical Recruiter at Acme"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">About</label>
                  <textarea
                    className={inputClass}
                    rows={4}
                    value={form.bio ?? ''}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder="A short introduction for your team and candidates."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Location
                  </label>
                  <input
                    className={inputClass}
                    value={form.location ?? ''}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="City, Country"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      GitHub URL
                    </label>
                    <input
                      className={inputClass}
                      value={form.githubUrl ?? ''}
                      onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                      placeholder="https://github.com/…"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      LinkedIn URL
                    </label>
                    <input
                      className={inputClass}
                      value={form.linkedinUrl ?? ''}
                      onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                      placeholder="https://linkedin.com/in/…"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      Website URL
                    </label>
                    <input
                      className={inputClass}
                      value={form.websiteUrl ?? ''}
                      onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                      placeholder="https://…"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => save.mutate()}
                    disabled={save.isPending}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  >
                    {save.isPending ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-card"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Hiring stats */}
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Hiring activity</h2>
              <Link
                to="/recruiter/dashboard"
                className="text-sm text-primary hover:underline"
              >
                Manage assessments →
              </Link>
            </div>

            {statsLoading ? (
              <div className="surface-raised flex h-32 items-center justify-center rounded-xl">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : !hasActivity ? (
              <div className="surface-raised rounded-xl p-8 text-center">
                <p className="text-foreground">No assessments yet.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create your first assessment to start tracking candidate activity here.
                </p>
                <Link
                  to="/recruiter/assessments/new"
                  className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Create assessment
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <StatCard
                    label="Assessments"
                    value={totals!.assessmentsCreated}
                    hint={`${totals!.byStatus.published} published · ${totals!.byStatus.draft} draft · ${totals!.byStatus.archived} archived`}
                  />
                  <StatCard label="Candidates invited" value={totals!.candidatesInvited} />
                  <StatCard
                    label="Completed"
                    value={totals!.candidatesCompleted}
                    hint={`${totals!.completionRate}% completion`}
                  />
                  <StatCard
                    label="Average score"
                    value={
                      totals!.averageScorePercent != null
                        ? `${totals!.averageScorePercent}%`
                        : '—'
                    }
                    hint="across completed assessments"
                  />
                </div>

                {/* Per-quarter breakdown */}
                {stats!.byQuarter.length > 0 && (
                  <div className="surface-raised mt-6 overflow-x-auto rounded-xl">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-muted-foreground">
                          <th className="px-5 py-3 font-medium">Quarter</th>
                          <th className="px-5 py-3 text-right font-medium">Created</th>
                          <th className="px-5 py-3 text-right font-medium">Invited</th>
                          <th className="px-5 py-3 text-right font-medium">Completed</th>
                          <th className="px-5 py-3 text-right font-medium">Avg score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats!.byQuarter.map((q) => (
                          <tr
                            key={q.quarter}
                            className="border-b border-border last:border-0"
                          >
                            <td className="px-5 py-3 font-medium text-foreground">
                              {q.quarter}
                            </td>
                            <td className="px-5 py-3 text-right tabular-nums text-foreground">
                              {q.assessmentsCreated}
                            </td>
                            <td className="px-5 py-3 text-right tabular-nums text-foreground">
                              {q.invited}
                            </td>
                            <td className="px-5 py-3 text-right tabular-nums text-foreground">
                              {q.completed}
                            </td>
                            <td className="px-5 py-3 text-right tabular-nums text-foreground">
                              {q.averageScorePercent != null
                                ? `${q.averageScorePercent}%`
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <p className="mt-3 text-xs text-muted-foreground">
                  Grouped by quarter. Grouping by job role will be available once
                  assessments carry a role field.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
