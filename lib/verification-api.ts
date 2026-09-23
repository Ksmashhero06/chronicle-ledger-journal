import type { Project, TelemetrySummary } from './verification-types';

const API_BASE = process.env.NEXT_PUBLIC_VERIFICATION_API_URL || 'http://localhost:8000/api';

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function fetchProject(projectId: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${projectId}`);
  if (!res.ok) throw new Error('Failed to fetch project details');
  return res.json();
}

export async function extractRequirements(projectId: string, rawText: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/extract-requirements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_text: rawText }),
  });
  if (!res.ok) throw new Error('Failed to extract requirements');
  return res.json();
}

export async function uploadEvidence(
  projectId: string,
  filename: string,
  fileType: string,
  contentText: string
): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/upload-evidence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename,
      file_type: fileType,
      content_text: contentText,
    }),
  });
  if (!res.ok) throw new Error('Failed to upload evidence');
  return res.json();
}

export async function runVerification(projectId: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/verify`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Verification run failed');
  }
  return res.json();
}

export async function fetchDossier(projectId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/dossier`);
  if (!res.ok) throw new Error('Failed to generate official dossier');
  return res.json();
}

export async function fetchTelemetry(): Promise<TelemetrySummary> {
  const res = await fetch(`${API_BASE}/telemetry`);
  if (!res.ok) throw new Error('Failed to fetch telemetry data');
  return res.json();
}

export async function replayVerification(projectId: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/replay`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Verification replay failed');
  }
  return res.json();
}

export async function fetchReadiness(projectId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/readiness`);
  if (!res.ok) throw new Error('Failed to fetch explainable readiness breakdown');
  return res.json();
}

