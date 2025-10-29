
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChartData } from '../../types';

interface ChartProps {
  data: ChartData[];
  type?: 'bar' | 'pie';
}

const COLORS = ['#1E40AF', '#1D4ED8', '#3B82F6', '#60A5FA', '#93C5FD'];

const Chart = ({ data, type = 'bar' }: ChartProps) => {
  // FIX: Tornou a função de label mais robusta para lidar com props inesperadas da biblioteca recharts,
  // adicionando verificações de tipo para evitar crashes.
  const customLabel = (props: any) => {
    if (!props || typeof props.name !== 'string' || typeof props.percent !== 'number') {
      return '';
    }
    const { name, percent } = props;
    return `${name} ${((percent ?? 0) * 100).toFixed(0)}%`;
  };

  if (type === 'pie') {
    return (
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={customLabel}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: unknown, name) => [typeof value === 'number' ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : String(value), name]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => `R$${typeof value === 'number' ? value : 0}`} />
          <Tooltip formatter={(value: unknown) => [typeof value === 'number' ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : String(value), 'Vendas']} />
          <Legend />
          <Bar dataKey="value" fill="#3B82F6" name="Vendas" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;