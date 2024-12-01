import {initDayjs} from '../utils/dayjs'
import initCompletionRateChart from '../charts/completionRateChart'
import initOnTimeCompletionRateChart from '../charts/onTimeCompletionRateChart'
import initHomeworkLoadChart from '../charts/homeworkLoadChart'
import initHomeworkLoadPerWeekDayChart from '../charts/homeworkLoadPerWeekDayChart'
import initSubjectMetricsChart from '../charts/subjectMetricsChart'
import initHomeworksDurationChart from '../charts/homeworksDurationChart'
import initStudentSelector from '../components/filters/studentSelector'
import initDatesSelector from '../components/filters/dates'
import dayjs from 'dayjs'

class Dashboard {
  constructor() {
  }

  #loadFiltersConfig() {
    fetch(`${window.webServiceUrl}/dashboardFiltersConfig`, {
      credentials: 'include', // important for sending cookies
      headers: {'Content-Type': 'application/json'}
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        const dashboard = document.getElementById('dashboard')
        dashboard.classList.toggle('hidden', false)
        const event = new CustomEvent('filtersLoaded', {detail: data})
        window.dispatchEvent(event)
        const dashboardFilters = document.getElementById('dashboardFilters')
        dashboardFilters.classList.toggle('hidden', false)
      }).catch((error) => {
        console.error('Error fetching dashboard filters config:', error)
      })
  }

  #convertFiltersToQueryParams(filters) {
    const params = new URLSearchParams(filters)
    return params.toString()
  }

  init() {
    initDayjs(dayjs)
    initStudentSelector()
    initDatesSelector()
    this.#loadFiltersConfig()

    const dashboard = document.getElementById('dashboard')
    const dashboardFilters = document.getElementById('dashboardFilters')
    const dashboardGrid = document.getElementById('dashboardGrid')
    window.addEventListener('userLoggedIn', () => {
      dashboard.classList.toggle('hidden', false)
    })
    window.addEventListener('userLoggedOut', () => {
      dashboard.classList.toggle('hidden', true)
      dashboardFilters.classList.toggle('hidden', true)
      dashboardGrid.classList.toggle('hidden', true)

    })
    window.addEventListener('filtersLoaded', async (event) => {
      const filters = this.#convertFiltersToQueryParams({
        startDate: event.detail.startDate,
        endDate: event.detail.endDate,
        students: JSON.stringify(event.detail.students.map((data) => data.id))
      })
      this.#refreshedMetrics(filters)
    })
    const refreshButton = document.getElementById('refreshButton')
    refreshButton.addEventListener('click', () => {
      const startDateSelector = document.getElementById('startDateSelector')
      const endDateSelector = document.getElementById('endDateSelector')
      const studentSelector = document.getElementById('studentSelector')
      const filters = this.#convertFiltersToQueryParams({
        startDate: startDateSelector.value,
        endDate: endDateSelector.value,
        students: JSON.stringify(this.#getSelectedOptionsAsIntArray(studentSelector))
      })
      this.#refreshedMetrics(filters)
    })
  }

  #getSelectedOptionsAsIntArray(selectElement) {
    const selectedOptions = Array.from(selectElement.selectedOptions)
    return selectedOptions.map((option) => parseInt(option.value, 10))
  }

  async #refreshedMetrics(filters) {
    fetch(`${window.webServiceUrl}/dashboardMetrics?${filters}`, {
      credentials: 'include', // important for sending cookies
      headers: {'Content-Type': 'application/json'}
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        document.getElementById('dashboard').classList.toggle('hidden', false)
        initCompletionRateChart(data)
        initOnTimeCompletionRateChart(data)
        initHomeworkLoadChart(data)
        initHomeworkLoadPerWeekDayChart(data)
        initSubjectMetricsChart(data)
        initHomeworksDurationChart(data)
      })
  }

}

export default Dashboard
