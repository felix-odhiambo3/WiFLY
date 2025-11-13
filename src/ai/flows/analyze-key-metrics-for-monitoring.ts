'use server';

/**
 * @fileOverview Analyzes application logs and metrics to identify key performance indicators (KPIs)
 *  and suggests appropriate monitoring configurations for Grafana and Prometheus.
 *
 * - analyzeKeyMetrics - A function that handles the analysis of key metrics.
 * - AnalyzeKeyMetricsInput - The input type for the analyzeKeyMetrics function.
 * - AnalyzeKeyMetricsOutput - The return type for the analyzeKeyMetrics function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeKeyMetricsInputSchema = z.object({
  applicationLogs: z.string().describe('Application logs in text format.'),
  metricsData: z.string().describe('Metrics data in text format, including voucher issuance, login success/failure, and session expiry.'),
});
export type AnalyzeKeyMetricsInput = z.infer<typeof AnalyzeKeyMetricsInputSchema>;

const AnalyzeKeyMetricsOutputSchema = z.object({
  keyPerformanceIndicators: z.array(z.string()).describe('List of key performance indicators (KPIs) identified from logs and metrics.'),
  suggestedGrafanaConfig: z.string().describe('Suggested Grafana configuration in YAML format.'),
  suggestedPrometheusConfig: z.string().describe('Suggested Prometheus configuration in YAML format.'),
});
export type AnalyzeKeyMetricsOutput = z.infer<typeof AnalyzeKeyMetricsOutputSchema>;

export async function analyzeKeyMetrics(input: AnalyzeKeyMetricsInput): Promise<AnalyzeKeyMetricsOutput> {
  return analyzeKeyMetricsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeKeyMetricsPrompt',
  input: {schema: AnalyzeKeyMetricsInputSchema},
  output: {schema: AnalyzeKeyMetricsOutputSchema},
  prompt: `You are an expert system administrator specializing in analyzing application logs and metrics to identify key performance indicators (KPIs) and suggesting monitoring configurations for Grafana and Prometheus.

Analyze the following application logs and metrics data to identify KPIs, suggest Grafana configurations, and suggest Prometheus configurations. The configs should be easily imported into Grafana and Prometheus.

Application Logs:
{{{applicationLogs}}}

Metrics Data:
{{{metricsData}}}

Based on this information, provide:

1.  A list of key performance indicators (KPIs) that should be monitored.
2.  A suggested Grafana configuration in YAML format, including relevant dashboards and visualizations.
3.  A suggested Prometheus configuration in YAML format, including relevant metrics and alerts.

Make sure to output parsable and valid YAML for the Grafana and Prometheus configurations.
Ensure all the necessary labels are included.
`,
});

const analyzeKeyMetricsFlow = ai.defineFlow(
  {
    name: 'analyzeKeyMetricsFlow',
    inputSchema: AnalyzeKeyMetricsInputSchema,
    outputSchema: AnalyzeKeyMetricsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
