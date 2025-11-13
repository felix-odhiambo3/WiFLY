'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { analyzeMetricsAction } from '@/app/(admin)/monitoring/actions';
import { useToast } from '@/hooks/use-toast';
import { AnalyzeKeyMetricsOutput } from '@/ai/flows/analyze-key-metrics-for-monitoring';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Copy, Check, Lightbulb, Loader2, ListTree, Database, BarChart } from 'lucide-react';
import { Separator } from '../ui/separator';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Analyzing...
        </>
      ) : (
        <>
          <Lightbulb className="mr-2 h-5 w-5" />
          Analyze Metrics
        </>
      )}
    </Button>
  );
}

function CodeBlock({ title, content, icon }: { title: string; content: string; icon: React.ReactNode }) {
  const [hasCopied, setHasCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <h3 className="font-semibold flex items-center gap-2">{icon}{title}</h3>
      <div className="relative">
        <pre className="bg-muted text-sm rounded-md p-4 overflow-x-auto">
          <code>{content}</code>
        </pre>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7"
          onClick={copyToClipboard}
        >
          {hasCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

export default function MonitoringDashboard() {
  const [result, setResult] = useState<AnalyzeKeyMetricsOutput | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (formData: FormData) => {
    const applicationLogs = formData.get('applicationLogs') as string;
    const metricsData = formData.get('metricsData') as string;

    if (!applicationLogs || !metricsData) {
      toast({
        variant: 'destructive',
        title: 'Missing Data',
        description: 'Please provide both application logs and metrics data.',
      });
      return;
    }

    setResult(null);
    const { success, data, message } = await analyzeMetricsAction({ applicationLogs, metricsData });

    if (success && data) {
      setResult(data);
    } else {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: message,
      });
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="p-6">
          <form action={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="applicationLogs" className="font-medium">Application Logs</label>
                <Textarea
                  id="applicationLogs"
                  name="applicationLogs"
                  placeholder="Paste your application logs here..."
                  className="h-48 font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="metricsData" className="font-medium">Metrics Data</label>
                <Textarea
                  id="metricsData"
                  name="metricsData"
                  placeholder="Paste your metrics data here..."
                  className="h-48 font-mono text-xs"
                />
              </div>
            </div>
            <div className="text-center">
              <SubmitButton />
            </div>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart/> Analysis Results</CardTitle>
            </CardHeader>
          <CardContent className="p-6 space-y-6">
            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Analysis Complete!</AlertTitle>
              <AlertDescription>
                Here are the identified KPIs and suggested monitoring configurations.
              </AlertDescription>
            </Alert>
            
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2"><ListTree/> Key Performance Indicators (KPIs)</h3>
              <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                {result.keyPerformanceIndicators.map((kpi, index) => (
                  <li key={index}>{kpi}</li>
                ))}
              </ul>
            </div>

            <Separator />
            
            <CodeBlock 
                title="Prometheus Configuration"
                content={result.suggestedPrometheusConfig}
                icon={<Database />}
            />
            
            <Separator />

            <CodeBlock 
                title="Grafana Configuration"
                content={result.suggestedGrafanaConfig}
                icon={<BarChart/>}
            />

          </CardContent>
        </Card>
      )}
    </div>
  );
}
