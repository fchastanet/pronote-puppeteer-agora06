import dayjs from 'dayjs'

const initDatesSelector = async () => {
  const startDateSelector = document.getElementById('startDateSelector')
  const endDateSelector = document.getElementById('endDateSelector')
  window.addEventListener('filtersLoaded', async (event) => {
    startDateSelector.value = event.detail.startDate
    startDateSelector.min = dayjs(event.detail.minDate).format('YYYY-MM-DD')
    endDateSelector.value = event.detail.endDate
    endDateSelector.max = dayjs(event.detail.maxDate).format('YYYY-MM-DD')
  })
}

export default initDatesSelector
