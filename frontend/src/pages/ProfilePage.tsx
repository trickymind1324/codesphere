import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { profileApi, type UpdateProfileData, type ExperienceItem } from '@/api/profile.api';

function initials(name?: string | null) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="surface-raised rounded-xl p-5">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

export function ProfilePage() {
  const { userId } = useParams();
  const isPublic = Boolean(userId);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['profile', userId ?? 'me'],
    queryFn: () => (isPublic ? profileApi.getPublic(userId!) : profileApi.getMine()),
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UpdateProfileData>({});

  useEffect(() => {
    if (data?.profile) {
      setForm({
        headline: data.profile.headline ?? '',
        bio: data.profile.bio ?? '',
        college: data.profile.college ?? '',
        location: data.profile.location ?? '',
        githubUrl: data.profile.githubUrl ?? '',
        linkedinUrl: data.profile.linkedinUrl ?? '',
        websiteUrl: data.profile.websiteUrl ?? '',
        experience: data.profile.experience ?? [],
      });
    }
  }, [data?.profile]);

  const save = useMutation({
    mutationFn: () => {
      // send only non-empty fields (empty URLs would fail @IsUrl)
      const payload: UpdateProfileData = { ...form };
      (['githubUrl', 'linkedinUrl', 'websiteUrl'] as const).forEach((k) => {
        if (!payload[k]) delete payload[k];
      });
      return profileApi.updateMine(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      setEditing(false);
      toast.success('Profile saved');
    },
    onError: (e: any) => toast.error(e.response?.data?.message?.[0] || 'Failed to save profile'),
  });

  const share = () => {
    const id = data?.profile.userId;
    const url = `${window.location.origin}/profile/${id}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success('Profile link copied'),
      () => toast.error('Could not copy link'),
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <p className="text-lg font-semibold text-foreground">Profile not found</p>
        <Link to="/" className="text-primary hover:underline">Go home</Link>
      </div>
    );
  }

  const { profile, stats, isOwner } = data;
  const canEdit = isOwner && !isPublic;
  const acceptance =
    stats?.totalSubmissions && stats?.acceptedSubmissions
      ? Math.round((stats.acceptedSubmissions / stats.totalSubmissions) * 100)
      : 0;

  const socials = [
    { key: 'githubUrl', label: 'GitHub', url: profile.githubUrl },
    { key: 'linkedinUrl', label: 'LinkedIn', url: profile.linkedinUrl },
    { key: 'websiteUrl', label: 'Website', url: profile.websiteUrl },
  ].filter((s) => s.url);

  return (
    <div className="min-h-screen bg-background">
      {/* Slim top bar so the shared page is self-contained */}
      <div className="border-b border-border bg-card/30">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
            CodeSphere
          </Link>
          {canEdit && (
            <div className="flex items-center gap-2">
              <button
                onClick={share}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                Share
              </button>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Edit profile
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setEditing(false)}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => save.mutate()}
                    disabled={save.isPending}
                    className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {save.isPending ? 'Saving…' : 'Save'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        {/* Header */}
        <div className="surface-raised flex flex-col gap-5 rounded-2xl p-6 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
            {initials(profile.displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {profile.displayName || 'CodeSphere Developer'}
            </h1>
            {editing ? (
              <input
                value={form.headline ?? ''}
                onChange={(e) => setForm({ ...form, headline: e.target.value })}
                placeholder="Headline (e.g. Full-stack developer)"
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              />
            ) : (
              profile.headline && <p className="mt-1 text-muted-foreground">{profile.headline}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {editing ? (
                <>
                  <input value={form.location ?? ''} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location" className="rounded-lg border border-border bg-background px-3 py-1.5 text-foreground" />
                  <input value={form.college ?? ''} onChange={(e) => setForm({ ...form, college: e.target.value })} placeholder="College / University" className="rounded-lg border border-border bg-background px-3 py-1.5 text-foreground" />
                </>
              ) : (
                <>
                  {profile.location && <span>{profile.location}</span>}
                  {profile.college && <span>{profile.college}</span>}
                </>
              )}
            </div>
            {editing ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <input value={form.githubUrl ?? ''} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} placeholder="https://github.com/…" className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground" />
                <input value={form.linkedinUrl ?? ''} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} placeholder="https://linkedin.com/in/…" className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground" />
                <input value={form.websiteUrl ?? ''} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} placeholder="https://your.site" className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground" />
              </div>
            ) : (
              socials.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {socials.map((s) => (
                    <a key={s.key} href={s.url!} target="_blank" rel="noopener noreferrer"
                      className="rounded-lg border border-border px-3 py-1 text-sm font-medium text-foreground hover:bg-muted">
                      {s.label}
                    </a>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        {/* Progress stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Problems Solved" value={stats?.problemsSolved ?? 0} />
          <StatCard label="Acceptance Rate" value={`${acceptance}%`} />
          <StatCard label="Submissions" value={stats?.totalSubmissions ?? 0} />
          <StatCard label="Languages" value={stats?.languagesUsed?.length ?? 0} />
        </div>

        {/* About */}
        <section className="surface-raised rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground">About</h2>
          {editing ? (
            <textarea
              value={form.bio ?? ''}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={4}
              placeholder="Tell others about yourself…"
              className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          ) : (
            <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">
              {profile.bio || 'No bio yet.'}
            </p>
          )}
        </section>

        {/* Experience */}
        <section className="surface-raised rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Experience</h2>
            {editing && (
              <button
                onClick={() => setForm({ ...form, experience: [...(form.experience ?? []), { company: '', role: '' }] })}
                className="rounded-lg border border-border px-3 py-1 text-sm font-medium text-foreground hover:bg-muted"
              >
                Add
              </button>
            )}
          </div>
          <div className="mt-4 space-y-4">
            {editing ? (
              (form.experience ?? []).map((exp, i) => (
                <ExperienceEditor
                  key={i}
                  value={exp}
                  onChange={(v) => {
                    const next = [...(form.experience ?? [])];
                    next[i] = v;
                    setForm({ ...form, experience: next });
                  }}
                  onRemove={() => setForm({ ...form, experience: (form.experience ?? []).filter((_, j) => j !== i) })}
                />
              ))
            ) : (profile.experience?.length ?? 0) > 0 ? (
              profile.experience.map((exp, i) => (
                <div key={i} className="border-l-2 border-border pl-4">
                  <p className="font-medium text-foreground">{exp.role}</p>
                  <p className="text-sm text-muted-foreground">
                    {exp.company}
                    {(exp.from || exp.to) && ` · ${exp.from ?? ''}${exp.to ? ` – ${exp.to}` : ''}`}
                  </p>
                  {exp.description && <p className="mt-1 text-sm text-muted-foreground">{exp.description}</p>}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No experience added yet.</p>
            )}
          </div>
        </section>

        {/* Languages */}
        {(stats?.languagesUsed?.length ?? 0) > 0 && (
          <section className="surface-raised rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground">Languages</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {stats.languagesUsed.map((lang: string) => (
                <span key={lang} className="rounded-full bg-muted px-3 py-1 text-sm font-medium capitalize text-foreground">
                  {lang}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function ExperienceEditor({
  value,
  onChange,
  onRemove,
}: {
  value: ExperienceItem;
  onChange: (v: ExperienceItem) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <input value={value.role} onChange={(e) => onChange({ ...value, role: e.target.value })} placeholder="Role" className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground" />
        <input value={value.company} onChange={(e) => onChange({ ...value, company: e.target.value })} placeholder="Company" className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground" />
        <input value={value.from ?? ''} onChange={(e) => onChange({ ...value, from: e.target.value })} placeholder="From (e.g. 2023)" className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground" />
        <input value={value.to ?? ''} onChange={(e) => onChange({ ...value, to: e.target.value })} placeholder="To (e.g. Present)" className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground" />
      </div>
      <textarea value={value.description ?? ''} onChange={(e) => onChange({ ...value, description: e.target.value })} rows={2} placeholder="What you did…" className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground" />
      <button onClick={onRemove} className="mt-2 text-sm font-medium text-state-fail hover:underline">Remove</button>
    </div>
  );
}
