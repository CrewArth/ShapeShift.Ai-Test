'use client';

import { useState } from 'react';

interface FormData {
  text: string;
  negative_text: string;
  style_preset: 'realistic' | 'anime' | 'clay' | 'origami';
  format: 'glb' | 'obj' | 'fbx';
  turbo_mode: boolean;
  seed: number;
  guidance_scale: number;
  num_inference_steps: number;
  scheduler: 'euler_a' | 'euler' | 'ddpm' | 'ddim' | 'dpm++' | 'pndm';
}

export default function TestMeshy() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    text: '',
    negative_text: 'low quality, bad geometry',
    style_preset: 'realistic',
    format: 'glb',
    turbo_mode: false,
    seed: -1,
    guidance_scale: 7.5,
    num_inference_steps: 50,
    scheduler: 'euler_a'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : 
              type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              value
    }));
  };

  const createPreview = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/test-meshy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }
      
      setResult(data);
      if (data.response?.task_id) {
        setTaskId(data.response.task_id);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!taskId) {
      setError('No task ID available');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/test-meshy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ task_id: taskId })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }
      
      setResult(data);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">
          Test Meshy API (Text to 3D)
        </h1>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Text Prompt
            </label>
            <textarea
              name="text"
              value={formData.text}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg bg-[var(--input-background)] text-[var(--text-primary)]"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Negative Prompt
            </label>
            <textarea
              name="negative_text"
              value={formData.negative_text}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg bg-[var(--input-background)] text-[var(--text-primary)]"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Style Preset
              </label>
              <select
                name="style_preset"
                value={formData.style_preset}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg bg-[var(--input-background)] text-[var(--text-primary)]"
              >
                <option value="realistic">Realistic</option>
                <option value="anime">Anime</option>
                <option value="clay">Clay</option>
                <option value="origami">Origami</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Format
              </label>
              <select
                name="format"
                value={formData.format}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg bg-[var(--input-background)] text-[var(--text-primary)]"
              >
                <option value="glb">GLB</option>
                <option value="obj">OBJ</option>
                <option value="fbx">FBX</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Scheduler
              </label>
              <select
                name="scheduler"
                value={formData.scheduler}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg bg-[var(--input-background)] text-[var(--text-primary)]"
              >
                <option value="euler_a">Euler A</option>
                <option value="euler">Euler</option>
                <option value="ddpm">DDPM</option>
                <option value="ddim">DDIM</option>
                <option value="dpm++">DPM++</option>
                <option value="pndm">PNDM</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Seed
              </label>
              <input
                type="number"
                name="seed"
                value={formData.seed}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg bg-[var(--input-background)] text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Guidance Scale
              </label>
              <input
                type="number"
                name="guidance_scale"
                value={formData.guidance_scale}
                onChange={handleInputChange}
                step="0.1"
                className="w-full p-2 border rounded-lg bg-[var(--input-background)] text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Inference Steps
              </label>
              <input
                type="number"
                name="num_inference_steps"
                value={formData.num_inference_steps}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg bg-[var(--input-background)] text-[var(--text-primary)]"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="turbo_mode"
                checked={formData.turbo_mode}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Turbo Mode
              </label>
            </div>
          </div>
        </div>

        <div className="space-x-4">
          <button
            onClick={createPreview}
            disabled={loading || !formData.text}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Create Preview'}
          </button>

          <button
            onClick={checkStatus}
            disabled={loading || !taskId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Check Status
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
            <h2 className="font-bold mb-2">Error</h2>
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4 space-y-4">
            <div className="p-4 bg-[var(--card-background)] rounded-lg border border-[var(--card-border)]">
              <h2 className="font-bold mb-2">API Key (truncated)</h2>
              <code className="text-sm">{result.apiKey}</code>
            </div>
            
            {result.response && (
              <div className="p-4 bg-[var(--card-background)] rounded-lg border border-[var(--card-border)]">
                <h2 className="font-bold mb-2">API Response</h2>
                <pre className="whitespace-pre-wrap text-sm text-[var(--text-primary)]">
                  {JSON.stringify(result.response, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 