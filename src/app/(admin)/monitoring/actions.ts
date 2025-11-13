'use server';

import { analyzeKeyMetrics, AnalyzeKeyMetricsInput, AnalyzeKeyMetricsOutput } from '@/ai/flows/analyze-key-metrics-for-monitoring';

export async function analyzeMetricsAction(
  data: AnalyzeKeyMetricsInput
): Promise<{ success: boolean; data: AnalyzeKeyMetricsOutput | null; message: string }> {
  try {
    const result = await analyzeKeyMetrics(data);
    return { success: true, data: result, message: 'Analysis successful.' };
  } catch (error) {
    console.error('AI analysis failed:', error);
    return { success: false, data: null, message: 'Failed to analyze metrics. Please try again.' };
  }
}
