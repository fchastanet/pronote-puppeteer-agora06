const initDatesSelector = async () => {
  const startDateSelector = document.getElementById('startDateSelector')
  const endDateSelector = document.getElementById('endDateSelector')
  window.addEventListener('filtersLoaded', async (event) => {
    startDateSelector.value = event.detail.startDate
    endDateSelector.value = event.detail.endDate
  })
}

export default initDatesSelector
