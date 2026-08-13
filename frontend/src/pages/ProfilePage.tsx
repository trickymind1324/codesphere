import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { profileApi, type UpdateProfileData, type ExperienceItem } from '@/api/profile.api';
import { suggestTechnologies } from '@/lib/technologies';

function initials(name?: string | null) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

/** Resize an image file to a square avatar and return a JPEG data URL. */
function resizeImage(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => { img.src = reader.result as string; };
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

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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

  const avatarInput = useRef<HTMLInputElement>(null);
  const resumeInput = useRef<HTMLInputElement>(null);

  const onAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImage(file);
      await profileApi.setAvatar(dataUrl);
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      toast.success('Photo updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not update photo');
    } finally {
      e.target.value = '';
    }
  };

  const onResumePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('Résumé must be a PDF'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Résumé must be under 5MB'); return; }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      await profileApi.setResume(dataUrl, file.name);
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      toast.success('Résumé uploaded');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not upload résumé');
    } finally {
      e.target.value = '';
    }
  };

  const viewResume = async () => {
    try {
      const { dataUrl } = await profileApi.getResume(data!.profile.userId);
      const win = window.open();
      if (win) win.document.write(`<iframe src="${dataUrl}" style="border:0;width:100%;height:100%" title="resume"></iframe>`);
    } catch {
      toast.error('Could not open résumé');
    }
  };

  const removeResume = async () => {
    await profileApi.deleteResume();
    queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    toast.success('Résumé removed');
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
          <div className="relative shrink-0">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.displayName ?? 'avatar'} className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                {initials(profile.displayName)}
              </div>
            )}
            {canEdit && (
              <>
                <button
                  onClick={() => avatarInput.current?.click()}
                  title="Change photo"
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-foreground hover:bg-muted"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={onAvatarPick} />
              </>
            )}
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

        {/* Skills */}
        <section className="surface-raised rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground">Skills</h2>
          {editing ? (
            <SkillsEditor
              value={form.skills ?? []}
              onChange={(skills) => setForm({ ...form, skills })}
            />
          ) : (profile.skills?.length ?? 0) > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <span key={s} className="rounded-full border border-border bg-muted px-3 py-1 text-sm font-medium text-foreground">
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-muted-foreground">No skills added yet.</p>
          )}
        </section>

        {/* Résumé */}
        {(canEdit || profile.hasResume) && (
          <section className="surface-raised rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Résumé</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {profile.hasResume ? 'A résumé is attached to this profile.' : 'No résumé uploaded yet.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {profile.hasResume && (
                  <button onClick={viewResume} className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted">
                    View résumé
                  </button>
                )}
                {canEdit && (
                  <>
                    <button onClick={() => resumeInput.current?.click()} className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                      {profile.hasResume ? 'Replace' : 'Upload PDF'}
                    </button>
                    {profile.hasResume && (
                      <button onClick={removeResume} className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-state-fail hover:bg-muted">
                        Remove
                      </button>
                    )}
                    <input ref={resumeInput} type="file" accept="application/pdf" className="hidden" onChange={onResumePick} />
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Badges */}
        <section className="surface-raised rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground">Badges</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Earn badges by hitting milestones — solve problems, keep streaks, and master languages.
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            {BADGE_PLACEHOLDERS.map((b) => (
              <Badge key={b.label} {...b} />
            ))}
          </div>
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

function SkillsEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [query, setQuery] = useState('');
  const suggestions = suggestTechnologies(query, value);

  const add = (skill: string) => {
    const s = skill.trim();
    if (s && !value.some((v) => v.toLowerCase() === s.toLowerCase())) {
      onChange([...value, s]);
    }
    setQuery('');
  };

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {value.map((s) => (
          <span key={s} className="flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-sm font-medium text-foreground">
            {s}
            <button onClick={() => onChange(value.filter((v) => v !== s))} className="text-muted-foreground hover:text-foreground" aria-label={`Remove ${s}`}>×</button>
          </span>
        ))}
      </div>
      <div className="relative mt-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); add(suggestions[0] ?? query); }
          }}
          placeholder="Add a skill — start typing (e.g. go, pyth, red)…"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
        {suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => add(s)}
                className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface BadgeDef {
  label: string;
  symbol: string;
  stars: number;
  tone: 'primary' | 'pass' | 'warning' | 'running';
}

const BADGE_PLACEHOLDERS: BadgeDef[] = [
  { label: 'Problem Solver', symbol: 'PS', stars: 1, tone: 'primary' },
  { label: 'Python', symbol: 'Py', stars: 1, tone: 'pass' },
  { label: '30 Days of Code', symbol: '30', stars: 5, tone: 'warning' },
  { label: 'SQL', symbol: 'SQL', stars: 1, tone: 'running' },
];

function Badge({ label, symbol, stars, tone }: BadgeDef) {
  const toneClass = {
    primary: 'text-primary',
    pass: 'text-state-pass',
    warning: 'text-state-warning',
    running: 'text-state-running',
  }[tone];
  return (
    <div className="flex w-[104px] flex-col items-center" title={`${label} — locked`}>
      <div
        className="relative flex h-[104px] w-[104px] flex-col items-center justify-center bg-muted opacity-60"
        style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
      >
        <span className={`text-xl font-bold ${toneClass}`}>{symbol}</span>
        <svg className="mt-1 h-4 w-4 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
      </div>
      <span className="mt-2 text-center text-sm font-medium text-foreground">{label}</span>
      <div className="mt-0.5 flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} className={`h-3 w-3 ${i < stars ? toneClass : 'text-border'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.449a1 1 0 00-.363 1.118l1.287 3.96c.3.922-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.196-1.539-1.118l1.287-3.96a1 1 0 00-.363-1.118L2.98 9.037c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.287-3.96z" />
          </svg>
        ))}
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
