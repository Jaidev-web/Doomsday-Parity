'use client';
import { useState } from 'react';
import { Settings, Save, Check, RefreshCw, Key, Database, Cpu } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SettingsPage() {
  const [demoMode, setDemoMode] = useState(true);
  const [apiUrl, setApiUrl] = useState('http://localhost:8000');
  const [gemmaModel, setGemmaModel] = useState('gemma-4');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Platform Configuration</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage API endpoints, Gemma 4 model settings, and demo fallback modes.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Environment Mode */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              <CardTitle>Data Layer Mode</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-sm font-semibold text-slate-900">In-Memory Mock Database (Demo Mode)</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pre-seeds Sarah Chen, Marcus Rivera, and Priya Sharma for instant judge demos without requiring external Firebase credentials.
                </p>
              </div>
              <input
                type="checkbox"
                checked={demoMode}
                onChange={(e) => setDemoMode(e.target.checked)}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
              />
            </div>
          </CardContent>
        </Card>

        {/* Backend & AI Connection */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <CardTitle>AI & Backend Integration</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="FastAPI Backend Endpoint URL"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              helperText="Default: http://localhost:8000"
            />

            <Input
              label="Gemma Model Identifier"
              value={gemmaModel}
              onChange={(e) => setGemmaModel(e.target.value)}
              helperText="Model used for synthesis and recruiter reasoning"
            />

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <Key className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                When GEMMA_API_KEY is omitted from backend `.env`, the system runs in <strong>[Demo Mode]</strong> with
                realistic synthetic AI responses so all workflows remain demonstrable offline.
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button type="submit" icon={saved ? Check : Save}>
            {saved ? 'Saved Successfully!' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
