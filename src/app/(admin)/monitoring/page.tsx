import MonitoringDashboard from '@/components/monitoring/MonitoringDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, FileText, Gauge } from 'lucide-react';

export const metadata = {
  title: 'Monitoring Analysis - WiFly',
  description: 'Analyze logs and metrics to get monitoring insights.',
};

export default function MonitoringPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
            <BarChart className="w-8 h-8"/>
            Monitoring Analysis
        </h1>
        <p className="text-muted-foreground max-w-2xl">
            Paste your application logs and metrics data below. Our AI assistant will analyze them to identify Key Performance Indicators (KPIs) and suggest configurations for Prometheus and Grafana.
        </p>
      </div>
      
      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText/> Application Logs</CardTitle>
                <CardDescription>Paste raw text logs from your application (e.g., Node.js backend).</CardDescription>
            </CardHeader>
            <CardContent>
                <pre className="text-xs bg-muted p-3 rounded-md text-muted-foreground overflow-x-auto">
                    <code>
{`[INFO] Voucher WIFLY-FREE-2024 redeemed by aa:bb:cc:dd:ee:ff
[INFO] Stripe payment completed. Session ID: cs_test_...
[WARN] Login failed for user gg:hh:ii:jj:kk:ll: invalid voucher
[ERROR] Database connection failed: timeout
[INFO] Session for aa:bb:cc:dd:ee:ff expired.`}
                    </code>
                </pre>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Gauge/> Metrics Data</CardTitle>
                <CardDescription>Paste metrics data, for example, in Prometheus format.</CardDescription>
            </CardHeader>
            <CardContent>
                <pre className="text-xs bg-muted p-3 rounded-md text-muted-foreground overflow-x-auto">
                    <code>
{`voucher_issuance_total{type="paid"} 50
voucher_issuance_total{type="free"} 100
login_attempts_total{status="success"} 150
login_attempts_total{status="failure"} 20
session_expirations_total 145`}
                    </code>
                </pre>
            </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <MonitoringDashboard />
      </div>

    </div>
  );
}
