'use client';

// block start: library imports
import { Bar } from 'react-chartjs-2';
import { LULC_CLASSES } from './constants';
import '../css/BarChart.css';
// block end: library imports

// block start: component to render the LULC statistics bar chart
export default function BarChart({ chartData, activeLayer }) {
  // block start: defines the data structure for Chart.js
  const data = {
    labels: chartData.map(d => d.name),
    datasets: [{
      label: '% of Land Cover',
      data: chartData.map(d => d.percentage),
      // block start: dynamically set colors to highlight the active layer
      backgroundColor: chartData.map(d => {
        // If the current layer is 'all' or matches this data point's name, use its real color.
        // Otherwise, use a semi-transparent gray.
        if (activeLayer === 'all' || d.name.toLowerCase().replace(' ', '-') === activeLayer) {
          return d.color;
        }
        return 'rgba(180, 180, 180, 0.5)'; // Greyed-out color
      }),
      borderColor: chartData.map(d => {
        if (activeLayer === 'all' || d.name.toLowerCase().replace(' ', '-') === activeLayer) {
          return '#333';
        }
        return 'rgba(180, 180, 180, 0.8)';
      }),
      // block end: dynamically set colors to highlight the active layer
      borderWidth: 0,
      borderRadius: 8,
      barPercentage: 0.8,
    }]
  };
  // block end: defines the data structure for Chart.js

  // block start: defines the options for chart appearance
  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y.toFixed(1)}%`
        }
      },
      // block start: configuration for the datalabels plugin
      datalabels: {
        // block start: positions the label above the bar
        anchor: 'end',
        align: 'end',
        offset: -2, // Fine-tune vertical position
        // block end: positions the label above the bar

        // block start: formats the label text to show percentage
        formatter: (value) => {
          return `${value.toFixed(0)}%`; // Format to whole number + %
        },
        // block end: formats the label text to show percentage

        // block start: sets the font style for the labels
        font: {
          size: 11,
          weight: '500',
        },
        // block end: sets the font style for the labels

        // block start: dynamically sets the color of each label
        color: (context) => {
          const clsName = context.chart.data.labels[context.dataIndex];
          const cls = LULC_CLASSES.find(c => c.name === clsName);
          if (activeLayer === 'all' || cls.name.toLowerCase().replace(' ', '-') === activeLayer) {
            return '#333'; // Dark color for active/all
          }
          return 'rgba(180, 180, 180, 0.9)'; // Greyed-out color
        }
        // block end: dynamically sets the color of each label
      }
      // block end: configuration for the datalabels plugin
    },
    scales: {
      y: { 
        display: false, 
        max: Math.max(...chartData.map(d => d.percentage)) + 14 // Give space for labels
      }, 
      x: { ticks: { font: { size: 11 } },
      grid: {display: false}
      }
    },
    animation: {
      duration: 500 // Fade-in animation
    }
  };
  // block end: defines the options for chart appearance

  // block start: custom plugin to add shadows to bars
  const barShadowPlugin = {
    id: 'barShadow',
    // block start: hook that runs before the bars are drawn
    beforeDatasetDraw: (chart) => {
      const { ctx } = chart;
      ctx.save(); // Save the current state of the canvas context
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'; // Shadow color
      ctx.shadowBlur = 8;     // How soft the shadow is
      ctx.shadowOffsetX = 3;  // Horizontal offset
      ctx.shadowOffsetY = 3;  // Vertical offset
    },
    // block end: hook that runs before the bars are drawn
    
    // block start: hook that runs after the bars are drawn to clean up
    afterDatasetDraw: (chart) => {
      chart.ctx.restore(); // Restore the context to its original state
    }
    // block end: hook that runs after the bars are drawn to clean up
  };
  // block end: custom plugin to add shadows to bars

  // block start: main render for the chart panel
  return (
    <div className="chart-panel">
      <h3>Land Cover Totals</h3>
      <Bar data={data} options={options} plugins={[barShadowPlugin]} />
    </div>
  );
  // block end: main render for the chart panel
};
// block end: component to render the LULC statistics bar chart