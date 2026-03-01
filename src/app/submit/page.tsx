'use client';

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { ArrowLeft, Send, Github, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function SubmitPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
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
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <Github className="mx-auto h-12 w-12 text-gray-400" />
            <h1 className="mt-6 text-2xl font-bold text-gray-900">Sign in to Submit</h1>
            <p className="mt-2 text-gray-600">
              You need to sign in with GitHub to submit an alternative.
              This helps prevent spam.
            </p>
            <button
              onClick={() => signIn('github')}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-3 font-medium text-white hover:bg-gray-800"
            >
              <Github className="h-5 w-5" />
              Sign in with GitHub
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h1 className="mt-4 text-2xl font-bold text-green-900">Submission Received!</h1>
            <p className="mt-2 text-green-700">
              Thank you for submitting {formData.name}. We&apos;ll review it and add it to the directory soon.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Link
                href="/"
                className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
              >
                Back to Directory
              </Link>
              <button
                onClick={() => setSubmitted(false)}
                className="rounded-lg border border-green-300 px-4 py-2 font-medium text-green-700 hover:bg-green-100"
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
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to directory
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Submit an AI Agent</h1>
            <p className="mt-2 text-gray-600">
              Add your AI agent to the directory. All submissions are reviewed before publishing.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Name *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., MyAwesomeAgent"
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Short Description *</label>
              <input
                type="text"
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                placeholder="One-line description"
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Full Description</label>
              <textarea
                name="fullDescription"
                rows={3}
                value={formData.fullDescription}
                onChange={handleChange}
                placeholder="Detailed description..."
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">GitHub URL *</label>
              <input
                type="url"
                name="githubUrl"
                required
                value={formData.githubUrl}
                onChange={handleChange}
                placeholder="https://github.com/..."
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Language *</label>
                <select
                  name="language"
                  required
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Category *</label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Security Level *</label>
              <select
                name="security"
                required
                value={formData.security}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="sandboxed">Sandboxed</option>
                <option value="workspace-isolation">Workspace Isolation</option>
                <option value="minimal-permissions">Minimal Permissions</option>
                <option value="standard">Standard</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Deployment Options</label>
              <div className="flex flex-wrap gap-3">
                {['local', 'cloud', 'docker', 'serverless', 'desktop', 'embedded'].map((dep) => (
                  <label key={dep} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.deployment.includes(dep)}
                      onChange={() => handleCheckboxChange('deployment', dep)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{dep}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Supported Hardware</label>
              <div className="flex flex-wrap gap-3">
                {['x86_64', 'arm64', 'esp32', 'raspberry-pi', 'risc-v', 'cloud-only'].map((hw) => (
                  <label key={hw} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.hardware.includes(hw)}
                      onChange={() => handleCheckboxChange('hardware', hw)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{hw}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Use Cases</label>
              <div className="flex flex-wrap gap-3">
                {['personal', 'enterprise', 'development', 'automation', 'research'].map((uc) => (
                  <label key={uc} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.useCases.includes(uc)}
                      onChange={() => handleCheckboxChange('useCases', uc)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{uc}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Features (comma-separated)</label>
              <input
                type="text"
                name="features"
                value={formData.features}
                onChange={handleChange}
                placeholder="Feature 1, Feature 2, Feature 3"
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-4 border-t border-gray-100 pt-6">
              <Link
                href="/"
                className="rounded-lg border border-gray-200 px-6 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700"
              >
                <Send className="h-4 w-4" /> Submit for Review
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="mt-16 border-t border-gray-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500 sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} Claw Dealership. OpenClaw Alternatives Directory.</p>
        </div>
      </footer>
    </div>
  );
}
