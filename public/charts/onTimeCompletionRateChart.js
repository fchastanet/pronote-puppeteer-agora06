const initOnTimeCompletionRateChart = (data) => {
  const onTimeCompletionRateChart = echarts.init(document.getElementById('onTimeCompletionRateChart'))
  const onTimeCompletionRateOption = {
    title: {
      text: 'On Time Homework Completion Rate',
    },
    tooltip: {},
    toolbox: defaultToolbox,
    series: [
      {
        type: 'pie',
        data: [
          { value: data.onTimeCompletionRate, name: 'On Time' },
          { value: 100 - data.onTimeCompletionRate, name: 'Late' },
        ],
      },
    ],
  }
  onTimeCompletionRateChart.setOption(onTimeCompletionRateOption)
}
