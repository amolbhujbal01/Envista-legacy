import Helmet from '@/components/Helmet';
import BaseLayout from '@/layouts/BaseLayout';
import { Users, Route, BringToFront, TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  Line,
  LineChart,
  Label,
  Pie,
  PieChart,
  Sector,
} from 'recharts';
import { PieSectorDataItem } from 'recharts/types/polar/Pie';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const chartData = [
  { month: 'January', full_arch: 15, mobile: 21 },
  { month: 'February', full_arch: 18, mobile: 16 },
  { month: 'March', full_arch: 24, mobile: 3 },
  { month: 'April', full_arch: 19, mobile: 16 },
  { month: 'May', full_arch: 29, mobile: 10 },
  { month: 'June', full_arch: 24, mobile: 18 },
  { month: 'July', full_arch: 34, mobile: 28 },
  { month: 'August', full_arch: 28, mobile: 31 },
];
const chartConfig = {
  full_arch: {
    label: 'Full Arch - Digital All-On-4® ',
    color: 'hsl(var(--chart-1))',
  },
  mobile: {
    label: 'NobelProcera Single Crowns ',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

const kpiData = [
  {
    id: 1,
    text: 'Total Patients',
    value: 120,
    icon: <Users />,
  },
  {
    id: 2,
    text: 'Total Journeys',
    value: 45,
    icon: <Route />,
  },
  {
    id: 3,
    text: 'Design Orders',
    value: 95,
    icon: <BringToFront />,
  },
];

const KPI = ({ text, value, icon }) => (
  <div className="bg-slate-100 p-3 pl-5 pr-5 rounded flex gap-4 items-start w-full">
    <div className="text-slate-500">{icon}</div>
    <div>
      <div className="font-semibold text-3xl text-slate-700">{value}</div>
      <div className="text-slate-400">{text}</div>
    </div>
  </div>
);

const pieChartData = [
  { browser: 'Pending', visitors: 35, fill: 'var(--color-chrome)' },
  { browser: 'Design Phase', visitors: 26, fill: 'var(--color-safari)' },
  { browser: 'Shipped', visitors: 17, fill: 'var(--color-firefox)' },
  { browser: 'On Hold', visitors: 8, fill: 'var(--color-edge)' },
];
const pieChartConfig = {
  visitors: {
    label: 'Visitors',
  },
  chrome: {
    label: 'Pending',
    color: 'hsl(var(--chart-1))',
  },
  safari: {
    label: 'Design Phase',
    color: 'hsl(var(--chart-2))',
  },
  firefox: {
    label: 'Shipped',
    color: 'hsl(var(--chart-3))',
  },
  edge: {
    label: 'On Hold',
    color: 'hsl(var(--chart-4))',
  },

} satisfies ChartConfig;

const barChartData = [
  { month: 'January', patients: 55 },
  { month: 'February', patients: 81 },
  { month: 'March', patients: 35 },
  { month: 'April', patients: 101 },
  { month: 'May', patients: 32 },
  { month: 'June', patients: 59 },
  { month: 'July', patients: 32 },
  { month: 'August', patients: 59 },
];
const barChartConfig = {
  patients: {
    label: 'Patients',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export default function Home() {
  return (
    <BaseLayout>
      <Helmet title="" />
      <h1 className="text-3xl font-bold md:text-5xl">Dashboard</h1>
      <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4 w-full mb-8">
        {kpiData.map((kpi) => (
          <KPI key={kpi.id} text={kpi.text} value={kpi.value} icon={kpi.icon} />
        ))}
      </div>
      <div className="grid  md:grid-cols-2 lg:grid-cols-3 gap-2 items-stretch justify-between w-full">
        <Card className='w-full'>
          <CardHeader>
            <CardTitle>Total Journeys</CardTitle>
            <CardDescription>January - August 2024</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <LineChart
                accessibilityLayer
                data={chartData}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Line
                  dataKey="full_arch"
                  type="monotone"
                  stroke="var(--color-full_arch)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  dataKey="mobile"
                  type="monotone"
                  stroke="var(--color-mobile)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
          <CardFooter>
            <div className="flex w-full items-start gap-2 text-sm">
              <div className="grid gap-2">
                <div className="flex items-center gap-2 font-medium leading-none">
                  Total Treatment Journeys <TrendingUp className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 leading-none text-muted-foreground">
                  Showing total treatment journeys for the last {chartData?.length} months
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
        <Card className="flex flex-col w-full">
          <CardHeader className="items-start pb-0">
            <CardTitle>Journey Statistics</CardTitle>
            <CardDescription>January - August 2024</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={pieChartConfig}
              className="mx-auto aspect-square max-h-[250px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={pieChartData}
                  dataKey="visitors"
                  nameKey="browser"
                  innerRadius={60}
                  strokeWidth={5}
                  activeIndex={0}
                  activeShape={({
                    outerRadius = 0,
                    ...props
                  }: PieSectorDataItem) => (
                    <Sector {...props} outerRadius={outerRadius + 10} />
                  )}
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col gap-2 text-sm text-left items-start">
            <div className="flex text-left gap-2 font-medium leading-none">
              Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
            </div>
            <div className="leading-none text-muted-foreground text-left">
              Showing total journey statistics for the last 8 months
            </div>
          </CardFooter>
        </Card>
        <Card className='w-full'>
          <CardHeader>
            <CardTitle>Patients Per Month</CardTitle>
            <CardDescription>January - August 2024</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={barChartConfig}>
              <BarChart accessibilityLayer data={barChartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="patients" fill="var(--color-patients)" radius={8} />
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex items-center gap-2 font-medium leading-none">
                  Total Patients Per Month <TrendingUp className="h-4 w-4" />
                </div>
            <div className="leading-none text-muted-foreground">
              Showing patients for the last {barChartData?.length} months
            </div>
          </CardFooter>
        </Card>
      </div>
    </BaseLayout>
  );
}
