import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChartData } from '../../types';

interface ChartProps {
  data: ChartData[];
  type?: 'bar' | 'pie';
}

const COLORS = ['#1E40AF', '#1D4ED8', '#3B82F6', '#60A5FA', '#93C5FD'];

const Chart: React.FC<ChartProps> = ({ data, type = 'bar' }) => {
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
              // FIX: Handle cases where `percent` might be undefined to prevent arithmetic errors.
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number, name) => [value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), name]} />
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
          <YAxis tickFormatter={(value) => `R$${value}`} />
          <Tooltip formatter={(value: number) => [value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 'Vendas']} />
          <Legend />
          <Bar dataKey="value" fill="#3B82F6" name="Vendas" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;