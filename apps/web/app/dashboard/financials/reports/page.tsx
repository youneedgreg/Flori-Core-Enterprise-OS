/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  Scale,
  Percent,
  Calendar,
  Filter,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function FinancialReportsPage() {
  const [activeTab, setActiveTab] = useState('pnl');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, [activeTab, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      if (activeTab === 'pnl') endpoint = `/api/financials/reports/pnl?from=${dateRange.from}&to=${dateRange.to}`;
      else if (activeTab === 'balance-sheet') endpoint = `/api/financials/reports/balance-sheet?date=${dateRange.to}`;
      else if (activeTab === 'taxes') endpoint = `/api/financials/reports/taxes?from=${dateRange.from}&to=${dateRange.to}`;

      // In a real app we'd fetch from endpoint. For skeleton, we'll mock or handle gracefully.
      // const res = await fetch(endpoint);
      // const d = await res.json();
      
      // MOCK DATA for demonstration until API is fully wired in the build
      const mockData = activeTab === 'pnl' ? mockPnL : (activeTab === 'balance-sheet' ? mockBalanceSheet : mockTaxes);
      setData(mockData);
    } catch (error) {
      console.error('Failed to fetch report data', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Reporting</h1>
          <p className="text-muted-foreground">
            Live insights into the farm&apos;s financial performance and position.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted/50 rounded-lg p-1 border">
            <Calendar className="ml-2 h-4 w-4 text-muted-foreground" />
            <input 
              type="date" 
              value={dateRange.from}
              onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
              className="bg-transparent border-none text-xs focus:ring-0 px-2 py-1"
            />
            <span className="text-muted-foreground">-</span>
            <input 
              type="date" 
              value={dateRange.to}
              onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
              className="bg-transparent border-none text-xs focus:ring-0 px-2 py-1"
            />
          </div>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIItem 
          title="Total Revenue" 
          value={formatCurrency(data?.revenue?.total || 125400)} 
          description="+12% from last period" 
          icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
        />
        <KPIItem 
          title="Total Expenses" 
          value={formatCurrency(data?.expense?.total || 82300)} 
          description="-5% from budget" 
          icon={<TrendingDown className="h-4 w-4 text-rose-500" />}
        />
        <KPIItem 
          title="Net Income" 
          value={formatCurrency((data?.revenue?.total || 125400) - (data?.expense?.total || 82300))} 
          description="Margin: 34.4%" 
          icon={<FileText className="h-4 w-4 text-blue-500" />}
        />
        <KPIItem 
          title="Net Assets" 
          value={formatCurrency(1450000)} 
          description="A = L + E" 
          icon={<Scale className="h-4 w-4 text-amber-500" />}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1 border h-11">
          <TabsTrigger value="pnl" className="px-6">Profit & Loss</TabsTrigger>
          <TabsTrigger value="balance-sheet" className="px-6">Balance Sheet</TabsTrigger>
          <TabsTrigger value="taxes" className="px-6">Tax Report</TabsTrigger>
        </TabsList>

        <TabsContent value="pnl" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ReportSection 
              title="Revenue Accounts" 
              items={data?.revenue?.accounts || []} 
              formatCurrency={formatCurrency}
            />
            <ReportSection 
              title="Expense Accounts" 
              items={data?.expense?.accounts || []} 
              formatCurrency={formatCurrency}
              isNegative
            />
          </div>
          <Card className="border-t-4 border-t-primary">
            <CardContent className="flex justify-between items-center py-6">
              <span className="text-xl font-bold">Total Net Income</span>
              <span className={`text-2xl font-bold ${((data?.netIncome || 0) >= 0) ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(data?.netIncome || 43100)}
              </span>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance-sheet" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
             <ReportSection 
                title="Assets" 
                items={data?.assets?.accounts || []} 
                formatCurrency={formatCurrency}
              />
              <ReportSection 
                title="Liabilities" 
                items={data?.liabilities?.accounts || []} 
                formatCurrency={formatCurrency}
                isNegative
              />
              <ReportSection 
                title="Equity" 
                items={data?.equity?.accounts || []} 
                formatCurrency={formatCurrency}
              />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-muted/30">
              <CardContent className="p-4 flex justify-between items-center">
                <span className="font-semibold text-muted-foreground uppercase text-xs tracking-wider">Total Assets</span>
                <span className="text-xl font-bold">{formatCurrency(data?.assets?.total || 1450000)}</span>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardContent className="p-4 flex justify-between items-center">
                <span className="font-semibold text-muted-foreground uppercase text-xs tracking-wider">Total Liabilities & Equity</span>
                <span className="text-xl font-bold">{formatCurrency((data?.liabilities?.total || 0) + (data?.equity?.total || 0) || 1450000)}</span>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="taxes" className="space-y-4">
           <div className="grid gap-4 md:grid-cols-3">
              <KPIItem 
                title="VAT Output (Sales)" 
                value={formatCurrency(data?.summary?.outputVat || 20064)} 
                icon={<Percent className="h-4 w-4 text-blue-500" />}
              />
              <KPIItem 
                title="VAT Input (Purchases)" 
                value={formatCurrency(data?.summary?.inputVat || 13168)} 
                icon={<Percent className="h-4 w-4 text-amber-500" />}
              />
              <KPIItem 
                title="Net VAT Payable" 
                value={formatCurrency(data?.summary?.netTaxPayable || 6896)} 
                icon={<Scale className="h-4 w-4 text-emerald-500" />}
              />
           </div>
           <Card>
             <CardHeader>
               <CardTitle>VAT Transaction Breakdown</CardTitle>
               <CardDescription>Detailed audit trail for the current period.</CardDescription>
             </CardHeader>
             <CardContent>
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Type</TableHead>
                     <TableHead>Ref Number</TableHead>
                     <TableHead>Date</TableHead>
                     <TableHead className="text-right">Base Amount</TableHead>
                     <TableHead className="text-right">VAT Amount</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {(data?.salesDetails || []).map((row: any) => (
                     <TableRow key={row.id}>
                       <TableCell><Badge variant="outline">SALE</Badge></TableCell>
                       <TableCell>{row.number}</TableCell>
                       <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                       <TableCell className="text-right">{formatCurrency(row.base)}</TableCell>
                       <TableCell className="text-right text-emerald-600">+{formatCurrency(row.vat)}</TableCell>
                     </TableRow>
                   ))}
                   {(data?.purchaseDetails || []).map((row: any) => (
                     <TableRow key={row.id}>
                       <TableCell><Badge variant="secondary">PURCHASE</Badge></TableCell>
                       <TableCell>{row.number}</TableCell>
                       <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                       <TableCell className="text-right">{formatCurrency(row.base)}</TableCell>
                       <TableCell className="text-right text-amber-600">-{formatCurrency(row.vat)}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KPIItem({ title, value, description, icon }: any) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground uppercase">{title}</p>
          {icon}
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-bold tracking-tight">{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ReportSection({ title, items, formatCurrency, isNegative }: any) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            {items.map((acc: any) => (
              <div key={acc.code} className="flex items-center justify-between text-sm py-1 border-b border-dashed border-muted">
                <div className="flex flex-col">
                  <span>{acc.name}</span>
                  <span className="text-[10px] text-muted-foreground">{acc.code}</span>
                </div>
                <span className="font-mono">{isNegative && acc.total > 0 ? '-' : ''}{formatCurrency(acc.total)}</span>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-xs text-muted-foreground italic py-4 text-center">No transactions in this period</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- MOCK DATA FOR DEMO ---
const mockPnL = {
  revenue: {
    total: 125400,
    accounts: [
      { code: '4000', name: 'Sales Revenue', total: 118000 },
      { code: '4100', name: 'Shipping Revenue', total: 7400 },
    ],
  },
  expense: {
    total: 82300,
    accounts: [
      { code: '5000', name: 'Cost of Goods Sold', total: 45000 },
      { code: '5100', name: 'Payroll Expense', total: 28000 },
      { code: '5200', name: 'Utilities', total: 4500 },
      { code: '5300', name: 'Insurance', total: 4800 },
    ],
  },
  netIncome: 43100,
};

const mockBalanceSheet = {
  assets: {
    total: 1450000,
    accounts: [
      { code: '1000', name: 'Operating Cash', total: 120000 },
      { code: '1100', name: 'Inventory', total: 85000 },
      { code: '1200', name: 'Accounts Receivable', total: 45000 },
      { code: '1500', name: 'Farm Equipment', total: 450000 },
      { code: '1600', name: 'Land & Buildings', total: 750000 },
    ],
  },
  liabilities: {
    total: 215000,
    accounts: [
      { code: '2000', name: 'Accounts Payable', total: 35000 },
      { code: '2100', name: 'Sales Tax Payable', total: 12000 },
      { code: '2500', name: 'Bank Loan', total: 168000 },
    ],
  },
  equity: {
    total: 1235000,
    accounts: [
      { code: '3000', name: 'Owner Investment', total: 1000000 },
      { code: '3100', name: 'Retained Earnings', total: 235000 },
    ],
  },
};

const mockTaxes = {
  summary: {
    outputVat: 20064,
    inputVat: 13168,
    netTaxPayable: 6896,
  },
  salesDetails: [
    { id: '1', number: 'INV-1001', date: '2026-04-01', base: 5000, vat: 800 },
    { id: '2', number: 'INV-1002', date: '2026-04-03', base: 12000, vat: 1920 },
  ],
  purchaseDetails: [
    { id: 'p1', number: 'VEND-542', date: '2026-04-02', base: 3000, vat: 480 },
    { id: 'p2', number: 'VEND-998', date: '2026-04-05', base: 8500, vat: 1360 },
  ],
};
