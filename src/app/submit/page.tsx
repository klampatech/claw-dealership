'use client';

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Header from '@/components/Header';
import { ArrowLeft, Send, Github, Check } from 'lucide-react';
import Link from 'next/link';

export default function SubmitPage() {
  const { data: session, status } = useSession();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fullDescription: '',
    githubUrl: '',
    language: 'Python',
    category: 'popular',
    security: 'standard',
    deployment: [] as string[],
    hardware: [] as string[],
    useCases: [] as string[],
    features: '',
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-bg-primary">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent-primary" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <Header />
        <main className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-bg-surface border border-border">
              <Github size={32} className="text-text-muted" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary font-heading">Sign in to Submit</h1>
            <p className="mt-3 text-text-secondary max-w-sm mx-auto">
              You need to sign in with GitHub to submit an alternative. This helps prevent spam and ensures quality.
            </p>
            <button
              onClick={() => signIn('github')}
              className="btn-primary mt-8 inline-flex items-center gap-2"
            >
              <Github size={20} />
              Sign in with GitHub
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-8 text-center animate-scale-in">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <Check size={32} className="text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-green-400 font-heading">Submission Received!</h1>
            <p className="mt-3 text-text-secondary">
              Thank you for submitting <span className="text-text-primary font-medium">{formData.name}</span>.
              We&apos;ll review it and add it to the directory soon.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="/"
                className="btn-primary"
              >
                Back to Directory
              </Link>
              <button
                onClick={() => setSubmitted(false)}
                className="btn-secondary"
              >
                Submit Another
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      features: formData.features.split(',').map((f) => f.trim()).filter(Boolean),
      submittedBy: session.user?.name || 'anonymous',
    };

    try {
      const res = await fetch('/api/alternatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Submission failed:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCheckboxChange = (field: string, value: string) => {
    setFormData((prev) => {
      const current = prev[field as keyof typeof prev] as string[];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />

      <main className="mx-auto max-w-3xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center text-sm text-text-secondary hover:text-accent-primary transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to directory
        </Link>

        <div className="rounded-xl border border-border-subtle bg-bg-surface p-6 sm:p-8 animate-fade-in">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary font-heading">Submit an AI Agent</h1>
            <p className="mt-2 text-text-secondary">
              Add your AI agent to the directory. All submissions are reviewed before publishing.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-text-secondary">Name *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., MyAwesomeAgent"
                className="input w-full"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-text-secondary">Short Description *</label>
              <input
                type="text"
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                placeholder="One-line description"
                className="input w-full"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-text-secondary">Full Description</label>
              <textarea
                name="fullDescription"
                rows={3}
                value={formData.fullDescription}
                onChange={handleChange}
                placeholder="Detailed description..."
                className="input w-full resize-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-text-secondary">GitHub URL *</label>
              <input
                type="url"
                name="githubUrl"
                required
                value={formData.githubUrl}
                onChange={handleChange}
                placeholder="https://github.com/..."
                className="input w-full"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">Language *</label>
                <select
                  name="language"
                  required
                  value={formData.language}
                  onChange={handleChange}
                  className="input w-full"
                >
                  <option value="Python">Python</option>
                  <option value="Rust">Rust</option>
                  <option value="TypeScript">TypeScript</option>
                  <option value="Go">Go</option>
                  <option value="C">C</option>
                  <option value="Zig">Zig</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">Category *</label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="input w-full"
                >
                  <option value="popular">Popular</option>
                  <option value="security">Security</option>
                  <option value="lightweight">Lightweight</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="hardware">Hardware</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-text-secondary">Security Level *</label>
              <select
                name="security"
                required
                value={formData.security}
                onChange={handleChange}
                className="input w-full"
              >
                <option value="sandboxed">Sandboxed</option>
                <option value="workspace-isolation">Workspace Isolation</option>
                <option value="minimal-permissions">Minimal Permissions</option>
                <option value="standard">Standard</option>
              </select>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-text-secondary">Deployment Options</label>
              <div className="flex flex-wrap gap-3">
                {['local', 'cloud', 'docker', 'serverless', 'desktop', 'embedded'].map((dep) => (
                  <label key={dep} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.deployment.includes(dep)}
                      onChange={() => handleCheckboxChange('deployment', dep)}
                      className="h-4 w-4 rounded border-border bg-bg-elevated text-accent-primary focus:ring-accent-primary focus:ring-offset-0"
                    />
                    <span className="text-sm text-text-secondary capitalize">{dep}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-text-secondary">Supported Hardware</label>
              <div className="flex flex-wrap gap-3">
                {['x86_64', 'arm64', 'esp32', 'raspberry-pi', 'risc-v', 'cloud-only'].map((hw) => (
                  <label key={hw} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hardware.includes(hw)}
                      onChange={() => handleCheckboxChange('hardware', hw)}
                      className="h-4 w-4 rounded border-border bg-bg-elevated text-accent-primary focus:ring-accent-primary focus:ring-offset-0"
                    />
                    <span className="text-sm text-text-secondary">{hw}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-text-secondary">Use Cases</label>
              <div className="flex flex-wrap gap-3">
                {['personal', 'enterprise', 'development', 'automation', 'research'].map((uc) => (
                  <label key={uc} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.useCases.includes(uc)}
                      onChange={() => handleCheckboxChange('useCases', uc)}
                      className="h-4 w-4 rounded border-border bg-bg-elevated text-accent-primary focus:ring-accent-primary focus:ring-offset-0"
                    />
                    <span className="text-sm text-text-secondary capitalize">{uc}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-text-secondary">Features (comma-separated)</label>
              <input
                type="text"
                name="features"
                value={formData.features}
                onChange={handleChange}
                placeholder="Feature 1, Feature 2, Feature 3"
                className="input w-full"
              />
            </div>

            <div className="flex justify-end gap-4 border-t border-border-subtle pt-6">
              <Link
                href="/"
                className="btn-secondary"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="btn-primary inline-flex items-center gap-2"
              >
                <Send size={18} />
                Submit for Review
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="border-t border-border-subtle py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-text-muted sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} Claw Dealership. OpenClaw Alternatives Directory.</p>
        </div>
      </footer>
    </div>
  );
}
