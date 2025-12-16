import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  CreditCard,
  Receipt,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Download,
  Eye
} from 'lucide-react';
import { analyticsApi } from '@services/api';
import { format, parseISO } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CostTrackingProps {
  dateRange: string;
}

interface CostMetrics {
  totalCost: number;
  monthlyRecurring: number;
  usageCosts: number;
  projectedCost: number;
  costTrends: {
    date: string;
    recurring: number;
    usage: number;
    total: number;
  }[];
  numberCosts: {
    phoneNumber: string;
    monthlyCost: number;
    usageCost: number;
    totalCost: number;
  }[];
  costBreakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  invoices: {
    id: string;
    date: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue';
    dueDate: string;
  }[];
  recommendations: {
    type: 'warning' | 'info' | 'success';
    title: string;
    description: string;
    potentialSavings?: number;
  }[];
}

const CostTracking: React.FC<CostTrackingProps> = ({ dateRange }) => {
  const [selectedView, setSelectedView] = useState('overview');

  const { data: costData, isLoading } = useQuery({
    queryKey: ['cost-analytics', dateRange],
    queryFn: () => analyticsApi.getCostAnalytics(dateRange),
    refetchInterval: 60000, // Refresh every minute
  });

  const metrics: CostMetrics = costData?.data || {
    totalCost: 0,
    monthlyRecurring: 0,
    usageCosts: 0,
    projectedCost: 0,
    costTrends: [],
    numberCosts: [],
    costBreakdown: [],
    invoices: [],
    recommendations: []
  };

  const costTrendsData = {
    labels: metrics.costTrends.map(item => format(parseISO(item.date), 'MMM dd')),
    datasets: [
      {
        label: 'Recurring Costs',
        data: metrics.costTrends.map(item => item.recurring),
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Usage Costs',
        data: metrics.costTrends.map(item => item.usage),
        borderColor: '#0891B2',
        backgroundColor: 'rgba(8, 145, 178, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const costBreakdownData = {
    labels: metrics.costBreakdown.map(item => item.category),
    datasets: [
      {
        label: 'Cost Breakdown',
        data: metrics.costBreakdown.map(item => item.amount),
        backgroundColor: [
          '#2563EB',
          '#0891B2',
          '#059669',
          '#D97706',
          '#DC2626',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '$' + value.toFixed(2);
          }
        }
      },
    },
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
    }
  };

  const getChangeIndicator = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    const isPositive = change > 0;
    
    return (
      <div className={`flex items-center text-sm ${isPositive ? 'text-red-600' : 'text-green-600'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
        {Math.abs(change).toFixed(1)}%
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cost Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate">Total Cost</p>
              <p className="text-2xl font-bold text-charcoal">{formatCurrency(metrics.totalCost)}</p>
              {getChangeIndicator(metrics.totalCost, metrics.totalCost * 0.92)}
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate">Monthly Recurring</p>
              <p className="text-2xl font-bold text-charcoal">{formatCurrency(metrics.monthlyRecurring)}</p>
              {getChangeIndicator(metrics.monthlyRecurring, metrics.monthlyRecurring * 1.02)}
            </div>
            <div className="p-3 bg-teal-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-teal-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate">Usage Costs</p>
              <p className="text-2xl font-bold text-charcoal">{formatCurrency(metrics.usageCosts)}</p>
              {getChangeIndicator(metrics.usageCosts, metrics.usageCosts * 0.88)}
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Receipt className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate">Projected Cost</p>
              <p className="text-2xl font-bold text-charcoal">{formatCurrency(metrics.projectedCost)}</p>
              <p className="text-xs text-slate">Next 30 days</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Trends */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Cost Trends</h3>
            <p className="card-subtitle">Recurring vs Usage costs over time</p>
          </div>
          <div className="h-64">
            <Line data={costTrendsData} options={chartOptions} />
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Cost Breakdown</h3>
            <p className="card-subtitle">Costs by category</p>
          </div>
          <div className="h-64">
            <Bar data={costBreakdownData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Number Costs & Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Number Costs */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Cost by Number</h3>
            <p className="card-subtitle">Individual number cost breakdown</p>
          </div>
          <div className="space-y-3">
            {metrics.numberCosts.slice(0, 5).map((number) => (
              <div key={number.phoneNumber} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-charcoal">{number.phoneNumber}</p>
                  <p className="text-sm text-slate">
                    Monthly: {formatCurrency(number.monthlyCost)} | 
                    Usage: {formatCurrency(number.usageCost)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-charcoal">{formatCurrency(number.totalCost)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="card-title">Recent Invoices</h3>
                <p className="card-subtitle">Billing history</p>
              </div>
              <button className="btn-secondary text-sm">
                <Eye className="w-3 h-3 mr-1" />
                View All
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {metrics.invoices.slice(0, 5).map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-charcoal">Invoice #{invoice.id}</p>
                  <p className="text-sm text-slate">
                    {format(parseISO(invoice.date), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-charcoal">{formatCurrency(invoice.amount)}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cost Optimization Recommendations */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Cost Optimization Recommendations</h3>
          <p className="card-subtitle">Ways to reduce your communication costs</p>
        </div>
        <div className="space-y-4">
          {metrics.recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
              {getRecommendationIcon(recommendation.type)}
              <div className="flex-1">
                <h4 className="font-medium text-charcoal">{recommendation.title}</h4>
                <p className="text-sm text-slate mt-1">{recommendation.description}</p>
                {recommendation.potentialSavings && (
                  <p className="text-sm font-medium text-green-600 mt-2">
                    Potential savings: {formatCurrency(recommendation.potentialSavings)}/month
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
          <p className="card-subtitle">Manage your billing and costs</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn-secondary flex items-center justify-center">
            <Download className="w-4 h-4 mr-2" />
            Download Invoice
          </button>
          <button className="btn-secondary flex items-center justify-center">
            <CreditCard className="w-4 h-4 mr-2" />
            Update Payment Method
          </button>
          <button className="btn-secondary flex items-center justify-center">
            <Calendar className="w-4 h-4 mr-2" />
            View Billing History
          </button>
        </div>
      </div>
    </div>
  );
};

export default CostTracking;