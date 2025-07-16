import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const baseDir = '/Users/ijisoo/Documents/model_evaluation/evaluation_results/deepeval/consolidated_results';
    const files = [
      'comprehensive_evaluation_results.json',
      'quality_metrics_evaluation_results.json',
      'conversational_metrics_evaluation_results.json'
    ];

    // 초기 병합 객체
    const merged: any = {
      metadata: {
        merged_date: new Date().toISOString(),
        total_files_merged: files.length,
        models: [],
        metrics: []
      },
      results: {}
    };

    for (const file of files) {
      const filePath = path.join(baseDir, file);
      try {
        const raw = await fs.readFile(filePath, 'utf-8');
        const json = JSON.parse(raw);

        // merge metadata
        if (Array.isArray(json.metadata?.models)) {
          merged.metadata.models = Array.from(new Set([...merged.metadata.models, ...json.metadata.models]));
        }
        if (Array.isArray(json.metadata?.metrics)) {
          merged.metadata.metrics = Array.from(new Set([...merged.metadata.metrics, ...json.metadata.metrics]));
        }

        // merge results per model/metric
        const results = json.results || {};
        for (const [model, metrics] of Object.entries(results)) {
          if (!merged.results[model as string]) {
            merged.results[model as string] = {};
          }
          for (const [metricName, examples] of Object.entries(metrics as any)) {
            merged.results[model as string][metricName] = examples;
          }
        }
      } catch (err) {
        // 파일 없으면 스킵
        console.warn(`evaluation-results: Failed to read ${file}:`, err);
      }
    }

    return NextResponse.json(merged);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to load evaluation results', details: err?.message }, { status: 500 });
  }
} 