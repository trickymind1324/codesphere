import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assessmentApi, CreateInvitationDto } from '@/api/assessment.api';
import { useAuthStore } from '@/stores/auth.store';
import toast from 'react-hot-toast';

interface CandidateInput {
  name: string;
  email: string;
}

export function InvitationForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();

  const [candidates, setCandidates] = useState<CandidateInput[]>([{ name: '', email: '' }]);
  const [bulkInput, setBulkInput] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [inputMode, setInputMode] = useState<'individual' | 'bulk'>('individual');

  // Fetch assessment details
  const { data: assessment, isLoading: isLoadingAssessment } = useQuery({
    queryKey: ['assessment', id],
    queryFn: () => assessmentApi.getAssessment(id!),
    enabled: !!id,
  });

  const sendInvitationsMutation = useMutation({
    mutationFn: (data: CreateInvitationDto) => assessmentApi.sendInvitations(id!, data),
    onSuccess: (invitations) => {
      queryClient.invalidateQueries({ queryKey: ['invitations', id] });
      queryClient.invalidateQueries({ queryKey: ['assessment', id] });
      queryClient.invalidateQueries({ queryKey: ['statistics', id] });
      toast.success(`Successfully sent ${invitations.length} invitation(s)`);
      navigate(`/recruiter/assessments/${id}/results`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send invitations');
    },
  });

  const handleAddCandidate = () => {
    setCandidates([...candidates, { name: '', email: '' }]);
  };

  const handleRemoveCandidate = (index: number) => {
    if (candidates.length === 1) return;
    setCandidates(candidates.filter((_, i) => i !== index));
  };

  const handleCandidateChange = (index: number, field: 'name' | 'email', value: string) => {
    const updated = [...candidates];
    updated[index][field] = value;
    setCandidates(updated);
  };

  const parseBulkInput = () => {
    const lines = bulkInput.trim().split('\n').filter(line => line.trim());
    const parsed: CandidateInput[] = [];

    for (const line of lines) {
      // Support formats: "Name <email@domain.com>" or "email@domain.com, Name" or just "email@domain.com"
      const emailMatch = line.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (!emailMatch) continue;

      const email = emailMatch[0];
      let name = line.replace(email, '').replace(/[<>,]/g, '').trim();

      // If no name found, use email username as name
      if (!name) {
        name = email.split('@')[0];
      }

      parsed.push({ name, email });
    }

    setCandidates(parsed);
    toast.success(`Parsed ${parsed.length} candidate(s) from bulk input`);
  };

  const handleSubmit = () => {
    // Validation
    const validCandidates = candidates.filter(c => c.name.trim() && c.email.trim());

    if (validCandidates.length === 0) {
      toast.error('Please add at least one candidate');
      return;
    }

    // Validate emails
    const emailRegex = /^[\w.-]+@[\w.-]+\.\w+$/;
    const invalidEmails = validCandidates.filter(c => !emailRegex.test(c.email));
    if (invalidEmails.length > 0) {
      toast.error('Some email addresses are invalid. Please check and try again.');
      return;
    }

    // Check for duplicates
    const emails = validCandidates.map(c => c.email.toLowerCase());
    const duplicates = emails.filter((email, index) => emails.indexOf(email) !== index);
    if (duplicates.length > 0) {
      toast.error(`Duplicate email addresses found: ${duplicates.join(', ')}`);
      return;
    }

    sendInvitationsMutation.mutate({
      candidates: validCandidates,
      customMessage: customMessage.trim() || undefined,
      expiresInDays,
    });
  };

  if (isLoadingAssessment) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Assessment not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-bold">
              CodeSphere
            </Link>
            <div className="flex gap-4">
              <Link
                to="/recruiter/dashboard"
                className="text-sm font-medium text-primary"
              >
                Dashboard
              </Link>
              <Link
                to="/problems"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Problems
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.email} ({user?.role})
            </span>
            <button
              onClick={logout}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Send Invitations</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Invite candidates to take: <span className="font-medium text-foreground">{assessment.title}</span>
              </p>
              <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                <span>{assessment.assessmentProblems.length} problems</span>
                <span>•</span>
                <span>{assessment.durationMinutes} minutes</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/recruiter/dashboard')}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column - Candidate Input */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Candidate Information</h2>
                <div className="flex gap-2 rounded-lg bg-muted p-1">
                  <button
                    onClick={() => setInputMode('individual')}
                    className={`rounded px-3 py-1 text-sm font-medium ${
                      inputMode === 'individual'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Individual
                  </button>
                  <button
                    onClick={() => setInputMode('bulk')}
                    className={`rounded px-3 py-1 text-sm font-medium ${
                      inputMode === 'bulk'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Bulk
                  </button>
                </div>
              </div>

              {inputMode === 'individual' ? (
                <div className="mt-6 space-y-4">
                  {candidates.map((candidate, index) => (
                    <div key={index} className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Candidate Name"
                        value={candidate.name}
                        onChange={(e) => handleCandidateChange(index, 'name', e.target.value)}
                        className="flex-1 rounded-md border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <input
                        type="email"
                        placeholder="email@example.com"
                        value={candidate.email}
                        onChange={(e) => handleCandidateChange(index, 'email', e.target.value)}
                        className="flex-1 rounded-md border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        onClick={() => handleRemoveCandidate(index)}
                        disabled={candidates.length === 1}
                        className="rounded p-2 text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-red-900"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={handleAddCandidate}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add Another Candidate
                  </button>
                </div>
              ) : (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-foreground">
                    Bulk Input
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Enter one candidate per line. Supported formats:
                    <br />
                    • John Doe &lt;john@example.com&gt;
                    <br />
                    • john@example.com, John Doe
                    <br />• john@example.com
                  </p>
                  <textarea
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    placeholder={`John Doe <john@example.com>\njane@example.com, Jane Smith\nbob@example.com`}
                    rows={10}
                    className="mt-2 w-full rounded-md border border-border bg-background px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={parseBulkInput}
                    className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Parse Candidates
                  </button>
                </div>
              )}
            </div>

            {/* Custom Message */}
            <div className="mt-8 rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold">Custom Message (Optional)</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a personalized message that will be included in the invitation email
              </p>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="We're excited to have you complete this assessment as part of our hiring process. Please complete it at your earliest convenience. Good luck!"
                rows={4}
                className="mt-4 w-full rounded-md border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Expiry Settings */}
            <div className="mt-8 rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold">Expiry Settings</h2>
              <div className="mt-4">
                <label htmlFor="expiry" className="block text-sm font-medium text-foreground">
                  Invitation expires in (days)
                </label>
                <input
                  type="number"
                  id="expiry"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 7)}
                  min={1}
                  max={90}
                  className="mt-2 w-full rounded-md border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Candidates will have {expiresInDays} day{expiresInDays !== 1 ? 's' : ''} to start
                  the assessment. Once started, they have {assessment.durationMinutes} minutes to complete it.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Summary & Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              {/* Summary */}
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="text-lg font-semibold">Summary</h2>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Candidates:</span>
                    <span className="font-medium">
                      {candidates.filter(c => c.name.trim() && c.email.trim()).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Assessment:</span>
                    <span className="font-medium text-right">{assessment.title}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Problems:</span>
                    <span className="font-medium">{assessment.assessmentProblems.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">{assessment.durationMinutes} min</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Expires in:</span>
                    <span className="font-medium">
                      {expiresInDays} day{expiresInDays !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={sendInvitationsMutation.isPending}
                  className="mt-6 w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sendInvitationsMutation.isPending ? 'Sending...' : 'Send Invitations'}
                </button>

                <p className="mt-4 text-xs text-muted-foreground">
                  Each candidate will receive an email with a unique assessment link.
                </p>
              </div>

              {/* Email Preview */}
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="text-lg font-semibold">Email Preview</h2>
                <div className="mt-4 rounded-md border border-border bg-muted/30 p-4 text-xs">
                  <p className="font-semibold">Subject:</p>
                  <p className="mt-1">Invitation: {assessment.title}</p>

                  <p className="mt-4 font-semibold">Body:</p>
                  <div className="mt-2 space-y-2">
                    <p>Hi [Candidate Name],</p>

                    {customMessage && (
                      <p className="italic text-muted-foreground">{customMessage}</p>
                    )}

                    <p>You've been invited to complete the assessment: {assessment.title}</p>

                    <div className="my-3 rounded border border-border bg-background p-2">
                      <p><strong>Problems:</strong> {assessment.assessmentProblems.length}</p>
                      <p><strong>Duration:</strong> {assessment.durationMinutes} minutes</p>
                      <p><strong>Expires:</strong> {expiresInDays} day{expiresInDays !== 1 ? 's' : ''}</p>
                    </div>

                    <p>[Start Assessment Button]</p>

                    <p className="text-muted-foreground">This link is unique to you and will expire in {expiresInDays} day{expiresInDays !== 1 ? 's' : ''}.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
